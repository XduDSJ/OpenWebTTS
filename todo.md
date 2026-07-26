# todo

## 进行中

## 已完成

- [x] Docker 镜像 CI/CD：新增 GitHub Actions 自动构建并推送 ghcr.io（详见 `docs/01-docker-cicd-2026-07-25.md`）
  - 修复 Dockerfile 缺失 `npm install` 的构建失败问题
  - 新增 `.dockerignore`
  - 新增 `.github/workflows/docker-publish.yml`（push master + tag 触发，amd64）
- [x] 中英文国际化（i18n）：前端双语支持，零依赖零构建方案（详见 `docs/04-i18n-implementation-2026-07-26.md`）
  - 新增 `static/js/i18n.js` 核心模块（initI18n/t/setLang/getCurrentLang）
  - 新增 `static/locales/en.json`、`zh.json` 翻译表（179 key）
  - `templates/index.html`、`config.html` 添加 data-i18n 属性 + 语言切换器
  - `static/js/index.js`、`UI.js`、`helpers.js`、`config.js` 替换硬编码英文为 t() 调用
  - 静态验证：5 文件语法 OK、179 key 双语一致、98 t() + 109 data-i18n 全部命中翻译表
