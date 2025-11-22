# ========================================
# 多阶段构建 Dockerfile
# 阶段1: 构建前端 (Node.js)
# 阶段2: 运行后端 + 服务前端静态文件 (Python 3.12)
# ========================================

# ==================== 阶段 1: 构建前端 ====================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm install

# 复制前端源代码
COPY frontend/ ./

# 构建前端（输出到 dist/）
RUN npm run build

# ==================== 阶段 2: 后端运行环境 ====================
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEV_MODE=false

# 安装系统依赖（如果需要）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件
COPY backend/requirements.txt ./backend/

# 安装后端依赖
RUN pip install --no-cache-dir -r backend/requirements.txt

# 复制后端源代码
COPY backend/ ./backend/

# 从前端构建阶段复制构建产物到后端目录
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# 复制 index.html 到根目录（如果需要）
COPY index.html ./

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# 启动命令
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
