# auto-drawio Vue3 版本 - 部署指南

## 项目结构

```
auto-drawio/
├── frontend/              # Vue3 前端项目
│   ├── src/
│   │   ├── components/    # Vue 组件
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── composables/   # 组合式函数
│   │   ├── App.vue        # 根组件
│   │   └── main.js        # 入口文件
│   ├── package.json
│   └── vite.config.js
├── backend/               # FastAPI 后端
│   ├── main.py            # 后端主文件
│   └── requirements.txt   # Python 依赖
└── index.html            # 旧版本（已废弃）
```

## 开发环境部署

### 1. 安装前端依赖

```bash
cd frontend
npm install
```

### 2. 启动前端开发服务器

```bash
npm run dev
```

前端将运行在 `http://localhost:5173`

### 3. 启动后端服务器

在另一个终端中：

```bash
cd backend
python main.py
```

后端将运行在 `http://localhost:8000`

### 4. 访问应用

在浏览器中打开 `http://localhost:5173`

**注意**：开发环境下，Vite 会自动将 `/api` 请求代理到后端的 `http://localhost:8000`

## 生产环境部署

### 1. 构建前端

```bash
cd frontend
npm run build
```

构建输出将生成在 `frontend/dist/` 目录

### 2. 启动后端服务器

```bash
cd backend
python main.py
```

后端会自动检测并服务 `frontend/dist/` 中的静态文件

### 3. 访问应用

在浏览器中打开 `http://localhost:8000`

## 环境变量配置

### 后端配置（backend/.env）

复制 `backend/.env.example` 为 `backend/.env`，并填写以下配置：

```env
# 默认 AI 配置
DEFAULT_AI_NAME=OpenAI GPT-4
DEFAULT_AI_BASE_URL=https://api.openai.com/v1
DEFAULT_AI_API_KEY=your-api-key-here
DEFAULT_AI_MODEL=gpt-4

# 开发模式（生产环境设置为 false）
DEV_MODE=true
```

## 主要改动说明

### 1. 前端架构

- **框架**: 从单文件 HTML 迁移到 Vue3 + Vite
- **状态管理**: 使用 Pinia 管理应用状态
- **组件化**: 将功能拆分为可复用的 Vue 组件
- **样式**: 使用 Scoped CSS，每个组件自包含样式

### 2. 核心组件

- `ChatPanel.vue`: 左侧聊天面板
- `EditorPanel.vue`: 右侧编辑器面板
- `TemplateModal.vue`: 模板选择弹窗
- `SettingsModal.vue`: AI 配置管理弹窗

### 3. 状态管理 (Pinia Stores)

- `conversation.js`: 对话历史管理
- `editor.js`: 编辑器状态管理
- `config.js`: AI 配置管理
- `template.js`: 模板管理

### 4. 后端改动

- 静态文件服务路径从 `../` 改为 `../frontend/dist`
- 支持开发和生产两种模式自动切换

## 色调调整

根据你的全局指令，前端已经调整为：
- **主色调**: 白底黑字 + 深蓝色（#1e40af）点缀
- **简约风格**: 清爽的卡片式设计

## 常见问题

### Q: 启动后前端无法连接到后端？

A: 检查以下几点：
1. 后端是否正常运行在 8000 端口
2. 开发环境下，前端 Vite 配置的代理是否正确
3. 生产环境下，前端是否已正确构建到 dist 目录

### Q: 如何添加新的 AI 配置？

A:
1. 点击右上角"模型配置"按钮
2. 点击"添加新配置"
3. 填写 API 信息并保存
4. 启用新配置（系统只允许启用一个配置）

### Q: 如何使用模板？

A:
1. 点击左上角"模板"按钮
2. 选择一个模板查看详情
3. 点击"应用此模板"
4. 输入描述生成流程图

## 技术栈

- **前端**: Vue 3.4, Vite 5.0, Pinia 2.1
- **后端**: FastAPI, Python 3.12
- **编辑器**: Draw.io (嵌入式)
- **样式**: 原生 CSS (Scoped)

## 开发建议

1. 修改组件时使用 Vue DevTools 调试
2. 状态变化通过 Pinia DevTools 查看
3. API 请求在浏览器 Network 面板查看
4. 遵循 Vue3 Composition API 风格

## 下一步优化建议

1. 添加路由（Vue Router）支持多页面
2. 添加 TypeScript 类型支持
3. 优化打包体积（代码分割）
4. 添加单元测试（Vitest）
5. 添加 E2E 测试（Playwright）

## 联系方式

如有问题，请查看项目 README 或提交 Issue。
