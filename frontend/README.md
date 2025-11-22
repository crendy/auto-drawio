# Vue3 前端快速启动指南

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
npm run dev
```

访问: http://localhost:5173

## 生产构建

```bash
npm run build
```

构建输出: `dist/`

## 预览生产构建

```bash
npm run preview
```

## 注意事项

1. 开发环境下，API 请求会自动代理到 `http://localhost:8000`
2. 确保后端服务已启动在 8000 端口
3. 生产构建后，由后端统一服务静态文件和 API
