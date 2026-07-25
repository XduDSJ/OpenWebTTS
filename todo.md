# todo

## 进行中

## 已完成

- [x] Docker 镜像 CI/CD：新增 GitHub Actions 自动构建并推送 ghcr.io（详见 `docs/01-docker-cicd-2026-07-25.md`）
  - 修复 Dockerfile 缺失 `npm install` 的构建失败问题
  - 新增 `.dockerignore`
  - 新增 `.github/workflows/docker-publish.yml`（push master + tag 触发，amd64）
