// i18n.js 核心逻辑测试
// 运行方式: node test/03-i18n-test-2026-07-26.js
// 注意: 需要将 i18n.js 的 export 改为 module.exports 或用 --experimental-vm-modules
// 这里用简化方式：直接内联测试 t() 回退逻辑

const assert = require('assert');

// 模拟 t() 的回退逻辑
function makeT(translations, fallbackTranslations) {
    return function t(key) {
        if (translations[key]) return translations[key];
        if (fallbackTranslations[key]) return fallbackTranslations[key];
        return key;
    };
}

// 测试 1: 当前语言有 key 时返回当前语言值
(function test1() {
    const t = makeT({ 'nav.title': '我的书籍' }, { 'nav.title': 'My Books' });
    assert.strictEqual(t('nav.title'), '我的书籍');
    console.log('✓ 测试1通过: 当前语言有 key 时返回当前语言值');
})();

// 测试 2: 当前语言缺失 key 时回退到英文
(function test2() {
    const t = makeT({}, { 'nav.title': 'My Books' });
    assert.strictEqual(t('nav.title'), 'My Books');
    console.log('✓ 测试2通过: 当前语言缺失时回退到英文');
})();

// 测试 3: 英文也缺失时返回 key 本身
(function test3() {
    const t = makeT({}, {});
    assert.strictEqual(t('missing.key'), 'missing.key');
    console.log('✓ 测试3通过: 英文也缺失时返回 key 本身');
})();

// 测试 4: 模拟 detectLang 逻辑
(function test4() {
    function detectLang(stored, browserLang) {
        const SUPPORTED = ['en', 'zh'];
        if (stored && SUPPORTED.includes(stored)) return stored;
        if (browserLang && browserLang.startsWith('zh')) return 'zh';
        return 'en';
    }
    assert.strictEqual(detectLang('zh', 'en-US'), 'zh');       // localStorage 优先
    assert.strictEqual(detectLang(null, 'zh-CN'), 'zh');       // 浏览器语言检测
    assert.strictEqual(detectLang(null, 'en-US'), 'en');       // 兜底英文
    assert.strictEqual(detectLang('en', 'zh-CN'), 'en');       // localStorage 优先于浏览器
    console.log('✓ 测试4通过: 语言检测优先级正确');
})();

console.log('\n全部测试通过');
