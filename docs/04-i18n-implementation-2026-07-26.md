# OpenWebTTS 中英文国际化（i18n）实现记录

- 日期：2026-07-26
- 状态：已实现（Tasks 1-8 完成，静态验证通过）
- 关联文档：`docs/02-i18n-design-2026-07-26.md`（设计）、`docs/03-i18n-implementation-plan-2026-07-26.md`（计划）

## 1. 实现概览

采用零依赖、零构建的纯 JS 运行时 i18n 方案，与现有预构建静态文件兼容。共 8 个任务，通过 subagent-driven development 流程逐个实现并审查。

### 提交历史

| Task | Commit | 内容 |
|------|--------|------|
| 1 | `ffe3729` | 新增 `i18n.js` 核心模块（initI18n/t/setLang/getCurrentLang） |
| 2 | `b482006` | 新增 `en.json` 英文翻译表（179 key） |
| 3 | `22a5cc0` | 新增 `zh.json` 中文翻译表（179 key） |
| 4 | `101ed10` | `index.html` 添加 data-i18n 属性 + 语言切换器 |
| 5 | `1a1e954` | `config.html` 添加 data-i18n 属性 |
| 6 | `9769cff` | `index.js` 替换硬编码英文为 t() 调用（~68 处） |
| 7 | `f469fef` | `UI.js` 替换硬编码英文为 t() 调用（9 处） |
| 8 | `28544ab` | `helpers.js` + `config.js` 替换硬编码英文为 t() 调用（6 处） |

## 2. 新增/修改文件

### 新增文件
- `static/js/i18n.js` — i18n 核心模块（124 行）
- `static/locales/en.json` — 英文翻译表（195 行，179 key）
- `static/locales/zh.json` — 中文翻译表（195 行，179 key）

### 修改文件
- `templates/index.html` — 148 行变更，添加 data-i18n 属性 + 语言切换器 `<select id="lang-select">`
- `templates/config.html` — 113 行变更，添加 data-i18n 属性 + i18n.js 导入 + initI18n 调用
- `static/js/index.js` — 85 增 72 删，import i18n + async DOMContentLoaded + 语言切换器绑定 + ~68 处 t() 替换
- `static/js/UI.js` — 10 增 9 删，import t + 9 处 t() 替换
- `static/js/helpers.js` — import t + 4 处 t() 替换
- `static/js/config.js` — import initI18n+t + async DOMContentLoaded + 2 处 t() 替换

## 3. i18n 模块接口

```javascript
// static/js/i18n.js
import { initI18n, t, setLang, getCurrentLang } from './i18n.js';

// async，页面加载时调用：检测语言 → fetch JSON → applyTranslations → 设置 <html lang>
await initI18n();

// 同步，返回当前语言的翻译字符串，缺失时回退到英文，再回退到 key 本身
t('nav.library');  // → "书库" 或 "Library"

// async，切换语言：存 localStorage → 加载翻译 → 重新 applyTranslations
await setLang('zh');

// 同步，返回当前语言代码
getCurrentLang();  // → 'zh' 或 'en'
```

### 语言检测优先级
1. `localStorage('openwebtts_lang')` — 用户明确选择过
2. `navigator.language` — 浏览器语言，`zh` 开头 → `zh`，否则 → `en`
3. `'en'` — 兜底默认

### 插值约定
翻译表使用 `{placeholder}` 标记，JS 侧用 `.replace()` 填充：
```javascript
t('toast.podcast_deleted').replace('{title}', podcast.title)
// en.json: "Podcast '{title}' deleted."
// zh.json: "播客'{title}'已删除。"
```

## 4. 翻译表 key 命名空间

| 前缀 | 用途 | 示例 |
|------|------|------|
| `nav.` | 导航栏 | `nav.new_book`、`nav.library` |
| `account.` | 账户区 | `account.anonymous`、`account.sign_in` |
| `book.` | 书籍操作 | `book.delete_book`、`book.import_file` |
| `player.` | 播放器 | `player.listen`、`player.pause` |
| `settings.` | 朗读设置 | `settings.tts_engine`、`settings.speed` |
| `login.` | 登录 | `login.login_create`、`login.placeholder_username` |
| `command.` | 命令面板 | `command.palette_title`、`command.no_commands` |
| `common.` | 通用 | `common.delete`、`common.loading` |
| `toast.` | 提示消息 | `toast.login_success`、`toast.error_occurred` |
| `config.` | 配置页 | `config.title`、`config.clear_cache` |
| `aria.` | 无障碍 | `aria.pdf_page`、`aria.zoom_in` |
| `lang.` | 语言切换器 | `lang.switch`、`lang.zh`、`lang.en` |

## 5. 静态验证结果

| 验证项 | 结果 |
|--------|------|
| `node --check` 语法检查（5 个 JS 文件） | 全部通过 |
| EN/ZH 翻译表 key 一致性 | 179 key 完全一致，无缺失 |
| JS `t()` 调用 key 完整性（98 处） | 全部命中翻译表 |
| HTML `data-i18n` 属性 key 完整性（109 处） | 全部命中翻译表 |

## 6. 已知限制

1. **confirm() 对话框格式**（Task 6 Minor）：`index.js` L353/590/2123 处 ` ?` 问号前有多余空格（源自 brief 示例模式），`': '` 半角冒号在中文下应为全角 `：`。因 brief 禁止新增翻译 key，此局限在设计层面接受。
2. **浏览器手动验证未执行**：Task 9 Step 1-7 的端到端浏览器验证（语言检测、切换、持久化、回退）需在浏览器环境中手动执行，本次仅完成静态验证。
3. **后端 i18n 不在范围**：API 错误消息、日志等保持英文（YAGNI）。
4. **部分硬编码英文未覆盖**：`helpers.js` L567 recordBtn innerHTML、`config.js` 中的 `'Downloading...'` 等非 brief 范围内的字符串保持原样，可在后续迭代中补充。

## 7. 后续迭代建议

- 修复 Task 6 Minor findings（confirm 对话框标点格式）
- 补充 helpers.js/config.js 中剩余的硬编码英文
- 执行浏览器端到端验证（Task 9 Step 1-7）
- 考虑将语言切换器从 `<select>` 升级为下拉菜单（设计文档第 7 节原设计）
