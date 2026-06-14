import { SUPPORTED_LANGS } from '../i18n/index'
import { addDays, getTodayStr } from './date'

export const DEMO_TESTER_ID = '__g20_demo__'
export const ONBOARDING_STORAGE_KEY = 'tester-tracker-onboarding-v1'

const DEMO_COPY = {
  EN: {
    name: '[Demo] Test Partner',
    platform: '— not a real contact —',
    description: 'Sample app: Weather Widget (demo). This card previews how a real task looks.',
    tag: 'Demo data',
  },
  ZH: {
    name: '【演示】测试伙伴',
    platform: '— 非真实联系方式 —',
    description: '示例 App：天气小组件（演示版）。此卡片用于预览真实任务的展示效果。',
    tag: '演示数据',
  },
  ES: {
    name: '[Demo] Socio de prueba',
    platform: '— contacto ficticio —',
    description: 'App de ejemplo: Widget del tiempo (demo). Vista previa de una tarea real.',
    tag: 'Datos demo',
  },
  PT: {
    name: '[Demo] Parceiro teste',
    platform: '— contato fictício —',
    description: 'App exemplo: Widget do tempo (demo). Prévia de uma tarefa real.',
    tag: 'Dados demo',
  },
  FR: {
    name: '[Démo] Partenaire test',
    platform: '— contact fictif —',
    description: 'App exemple : Widget météo (démo). Aperçu d’une vraie tâche.',
    tag: 'Données démo',
  },
  DE: {
    name: '[Demo] Testpartner',
    platform: '— kein echter Kontakt —',
    description: 'Beispiel-App: Wetter-Widget (Demo). Vorschau einer echten Aufgabe.',
    tag: 'Demodaten',
  },
  RU: {
    name: '[Демо] Тестовый партнёр',
    platform: '— ненастоящий контакт —',
    description: 'Пример приложения: Виджет погоды (демо). Предпросмотр реальной задачи.',
    tag: 'Демо-данные',
  },
  ID: {
    name: '[Demo] Partner uji',
    platform: '— bukan kontak asli —',
    description: 'App contoh: Widget Cuaca (demo). Pratinjau tugas nyata.',
    tag: 'Data demo',
  },
  HI: {
    name: '[डेमो] टेस्ट पार्टनर',
    platform: '— वास्तविक संपर्क नहीं —',
    description: 'नमूना ऐप: Weather Widget (demo)। वास्तविक कार्य का पूर्वावलोकन।',
    tag: 'डेमो डेटा',
  },
  AR: {
    name: '[تجريبي] شريك اختبار',
    platform: '— ليس جهة اتصال حقيقية —',
    description: 'تطبيق نموذجي: أداة الطقس (تجريبي). معاينة لمهمة حقيقية.',
    tag: 'بيانات تجريبية',
  },
}

function getBrowserLang() {
  const bl = (navigator.language || 'en').split('-')[0].toUpperCase()
  return SUPPORTED_LANGS.includes(bl) ? bl : 'EN'
}

/** 是否已有本应用的历史使用记录（非首次访问） */
export function hasUsedAppBefore() {
  try {
    if (localStorage.getItem(ONBOARDING_STORAGE_KEY)) return true
    return ['testers', 'settings'].some(
      (key) => localStorage.getItem('tester-tracker-' + key) !== null,
    )
  } catch {
    return true
  }
}

/** 构建示例测试员：第 1–2 天仅对方活跃，今天双方完成 */
export function createDemoTester() {
  const lang = getBrowserLang()
  const copy = DEMO_COPY[lang] || DEMO_COPY.EN
  const today = getTodayStr()
  const joinedAt = addDays(today, -2)
  const day1 = addDays(joinedAt, 0)
  const day2 = addDays(joinedAt, 1)

  return {
    id: DEMO_TESTER_ID,
    isDemo: true,
    name: copy.name,
    platform: copy.platform,
    description: copy.description,
    type: 'Exchange',
    tags: [copy.tag],
    totalDays: 14,
    joinedAt,
    dropped: false,
    checks: {
      [day1]: { activeToday: true, iReplied: false },
      [day2]: { activeToday: true, iReplied: false },
      [today]: { activeToday: true, iReplied: true },
    },
  }
}

export function isDemoTester(tester) {
  return !!(tester?.isDemo || tester?.id === DEMO_TESTER_ID)
}

export function markOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
  } catch {
    // ignore
  }
}
