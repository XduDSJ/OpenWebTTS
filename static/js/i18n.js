// i18n 模块：中英文国际化支持
// 零依赖、零构建，ES module

const SUPPORTED_LANGS = ['en', 'zh'];
const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'openwebtts_lang';

let translations = {};
let fallbackTranslations = {};
let currentLang = DEFAULT_LANG;
let loadPromise = null;

// 检测用户应使用的语言
function detectLang() {
    // 1. localStorage 中用户明确选择过
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) {
        return stored;
    }
    // 2. 浏览器语言
    const browserLang = navigator.language || '';
    if (browserLang.startsWith('zh')) {
        return 'zh';
    }
    // 3. 兜底默认
    return DEFAULT_LANG;
}

// 加载翻译表 JSON
async function loadTranslations(lang) {
    try {
        const response = await fetch(`/static/locales/${lang}.json`);
        if (!response.ok) {
            console.warn(`i18n: 无法加载 ${lang}.json (HTTP ${response.status})`);
            return {};
        }
        return await response.json();
    } catch (e) {
        console.warn(`i18n: 加载 ${lang}.json 失败:`, e);
        return {};
    }
}

// 遍历 DOM 应用翻译
function applyTranslations() {
    // data-i18n: 文本内容
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        if (text) {
            el.textContent = text;
        }
    });

    // data-i18n-placeholder: placeholder 属性
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const text = t(key);
        if (text) {
            el.placeholder = text;
        }
    });

    // data-i18n-aria-label: aria-label 属性
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        const text = t(key);
        if (text) {
            el.setAttribute('aria-label', text);
        }
    });

    // 更新 <html lang>
    document.documentElement.lang = currentLang;
}

// 获取翻译文本，带回退
function t(key) {
    if (translations[key]) {
        return translations[key];
    }
    if (fallbackTranslations[key]) {
        return fallbackTranslations[key];
    }
    return key;
}

// 初始化 i18n，页面加载时调用
export async function initI18n() {
    currentLang = detectLang();
    // 并行加载当前语言和英文回退
    const [main, fallback] = await Promise.all([
        loadTranslations(currentLang),
        loadTranslations(DEFAULT_LANG)
    ]);
    translations = main;
    fallbackTranslations = fallback;
    applyTranslations();
    loadPromise = null;
}

// 切换语言
export async function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
        console.warn(`i18n: 不支持的语言 "${lang}"`);
        return;
    }
    localStorage.setItem(STORAGE_KEY, lang);
    currentLang = lang;
    translations = await loadTranslations(lang);
    // 英文回退表已在 initI18n 加载，切换到英文时无需重新加载
    if (lang !== DEFAULT_LANG && Object.keys(fallbackTranslations).length === 0) {
        fallbackTranslations = await loadTranslations(DEFAULT_LANG);
    }
    applyTranslations();
}

// 获取当前语言代码
export function getCurrentLang() {
    return currentLang;
}

// 导出 t 供外部使用
export { t };
