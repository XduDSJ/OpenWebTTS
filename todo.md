# todo

## 进行中

## 已完成

- [x] Docker 镜像 CI/CD：新增 GitHub Actions 自动构建并推送 ghcr.io（详见 `docs/01-docker-cicd-2026-07-25.md`）
  - 修复 Dockerfile 缺失 `npm install` 的构建失败问题
  - 新增 `.dockerignore`
  - 新增 `.github/workflows/docker-publish.yml`（push master + tag 触发，amd64）
- [x] 中英文国际化（i18n）：前端双语支持，零依赖零构建方案（详见 `docs/04-i18n-implementation-2026-07-26.md`）
  - 新增 `static/js/i18n.js` 核心模块（initI18n/t/setLang/getCurrentLang）
  - 新增 `static/locales/en.json`、`zh.json` 翻译表（181 key）
  - `templates/index.html`、`config.html` 添加 data-i18n 属性 + 语言切换器
  - `static/js/index.js`、`UI.js`、`helpers.js`、`config.js` 替换硬编码英文为 t() 调用
  - 最终审查修复：统一切换器 ID、消除双重 initI18n、修复 4 处 innerHTML 覆盖
  - 静态验证：5 文件语法 OK、181 key 双语一致、102 t() + 109 data-i18n 全部命中翻译表
- [x] 登录崩溃修复：`Cannot read properties of undefined (reading 'elements')`（详见 `docs/05-登录崩溃修复-2026-07-26.md`）
  - 根因：`index.js:2009` `handleLogin` 调用 `hideLoginModal()` 漏传 `appState`，函数内 `undefined.elements` 崩溃
  - 同类修复：`index.js:319` `handleSidebarCollapse()` 同样漏传 `appState`（podcast 点击 + 侧栏折叠时触发）
  - 同类排查：grep 所有 UI.js 导入函数空参数调用，已清零
  - 改动：`static/js/index.js` 2 行，surgical
- [x] i18n 回归 bug 修复：裸变量引用 + preventDefault + podcast 错误处理（详见 `docs/06-i18n回归修复-2026-07-26.md`）
  - 修复 16 处裸变量引用（漏写 `appState.elements.`/`variables.` 前缀）
  - 删除 document click 监听器多余的 `e.preventDefault()`（阻止文件选择器/checkbox）
  - 修复 podcast.js 错误处理 body 二次消费 bug（`json()` 失败后 `text()` 抛 TypeError）
  - Oracle 审查确认修复正确，无遗漏
  - 改动：`index.js`、`UI.js`、`podcast.js`，surgical
- [x] /api/piper_voices 阻塞事件循环修复（详见 `docs/07-piper-voices阻塞修复-2026-07-26.md`）
  - 根因：async 函数中同步调用 `requests.get()` 无 timeout，Docker 网络不通时无限挂起阻塞事件循环
  - 修复：`asyncio.to_thread` + `timeout=10`，10 秒超时快速失败
  - 改动：`functions/routes.py`，surgical
