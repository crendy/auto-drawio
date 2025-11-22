# Docker 部署指南

## 快速开始

### 方式一：使用 docker-compose（推荐）

```bash
# 1. 配置环境变量（可选）
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入你的 AI API 配置

# 2. 一键启动
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 访问应用
# 浏览器打开 http://localhost:8000
```

### 方式二：使用 Docker 命令

```bash
# 1. 构建镜像
docker build -t auto-drawio:latest .

# 2. 运行容器
docker run -d \
  --name auto-drawio \
  -p 8000:8000 \
  --env-file backend/.env \
  --restart unless-stopped \
  auto-drawio:latest

# 3. 查看日志
docker logs -f auto-drawio

# 4. 访问应用
# 浏览器打开 http://localhost:8000
```

## 端口配置

### 使用 8000 端口（默认）
```bash
docker-compose up -d
# 访问: http://localhost:8000
```

### 使用 80 端口（生产环境）
修改 `docker-compose.yml`：
```yaml
ports:
  - "80:8000"  # 将 8000 改为 80
```

然后启动：
```bash
docker-compose up -d
# 访问: http://localhost 或 http://your-server-ip
```

## 环境变量配置

### 方式一：使用 .env 文件（推荐）

编辑 `backend/.env`：
```env
# 开发模式（生产环境设为 false）
DEV_MODE=false

# 默认 AI 配置
DEFAULT_AI_NAME=Claude Sonnet 4.5
DEFAULT_AI_BASE_URL=https://api.example.com/v1
DEFAULT_AI_API_KEY=your-api-key-here
DEFAULT_AI_MODEL=claude-sonnet-4-5-20250929
```

### 方式二：在 docker-compose.yml 中配置

编辑 `docker-compose.yml`：
```yaml
environment:
  - DEV_MODE=false
  - DEFAULT_AI_NAME=Claude Sonnet 4.5
  - DEFAULT_AI_BASE_URL=https://api.example.com/v1
  - DEFAULT_AI_API_KEY=your-api-key-here
  - DEFAULT_AI_MODEL=claude-sonnet-4-5-20250929
```

### 方式三：在前端界面配置（最灵活）

启动应用后，在前端界面点击"模型配置"按钮添加 AI 配置。

## 常用命令

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 重新构建并启动（代码更新后）
```bash
# 方式 1：强制重新构建（推荐）
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 方式 2：一键清理重建
docker-compose down --rmi all
docker-compose up -d --build

# 方式 3：快速重建（可能使用部分缓存）
docker-compose up -d --build --force-recreate
```

### 查看日志
```bash
# 查看所有日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100
```

### 进入容器
```bash
docker-compose exec auto-drawio sh
```

### 重新构建镜像
```bash
# 重新构建并启动
docker-compose up -d --build

# 或者分步执行
docker-compose build
docker-compose up -d
```

### 清理容器和镜像
```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker rmi auto-drawio:latest

# 清理未使用的镜像和容器
docker system prune -a
```

## 健康检查

容器内置健康检查，每 30 秒检查一次 `/health` 端点。

查看健康状态：
```bash
docker-compose ps
```

## 数据持久化（可选）

如果需要持久化数据，可以在 `docker-compose.yml` 中添加数据卷：

```yaml
volumes:
  - ./data:/app/data
```

## 故障排查

### 1. 容器无法启动

查看日志：
```bash
docker-compose logs
```

检查端口占用：
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

### 2. 代码更新后仍然是旧版本（Docker 缓存问题）

**症状**：
- 修改了代码但部署后没生效
- 构建时看到很多 `CACHED` 标记

**原因**：
- Docker 使用层缓存机制
- 检测到文件没变化时会复用缓存层
- 导致新代码没被复制到镜像中

**解决方案**：
```bash
# 推荐：强制重新构建（不使用缓存）
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 或者：删除镜像后重建
docker-compose down --rmi all
docker-compose up -d --build

# 查看是否还有旧镜像
docker images | grep auto-drawio
```

**预防措施**：
1. 修改 `docker-compose.yml`，取消注释 `no_cache: true`（开发环境）
2. 每次更新代码后使用 `--no-cache` 重建
3. 定期清理 Docker 缓存：`docker system prune -a`

### 3. 前端无法加载

确保前端已正确构建：
```bash
# 重新构建镜像
docker-compose up -d --build
```

### 3. AI API 调用失败

检查环境变量配置：
```bash
docker-compose exec auto-drawio env | grep DEFAULT_AI
```

或在前端界面重新配置 AI API。

### 4. 健康检查失败

进入容器检查：
```bash
docker-compose exec auto-drawio sh
curl http://localhost:8000/health
```

## 生产环境建议

1. **使用 HTTPS**：配置 Nginx 反向代理并启用 SSL
2. **设置资源限制**：
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 2G
       reservations:
         cpus: '1'
         memory: 1G
   ```
3. **日志管理**：配置日志轮转
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```
4. **安全配置**：
   - 不要在 docker-compose.yml 中硬编码敏感信息
   - 使用 Docker secrets 或环境变量
   - 定期更新基础镜像

## 架构说明

本项目使用多阶段构建：

1. **阶段 1**：使用 Node.js 镜像构建 Vue 3 前端
2. **阶段 2**：使用 Python 3.12 镜像运行 FastAPI 后端，并服务前端静态文件

最终镜像大小约 200-300 MB，包含：
- Python 3.12 运行时
- FastAPI + 依赖
- Vue 3 前端构建产物

## 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并启动
docker-compose up -d --build

# 3. 清理旧镜像（可选）
docker image prune -f
```

## 技术栈

- **前端**：Vue 3 + Vite + Pinia
- **后端**：FastAPI + Python 3.12
- **Web 服务器**：Uvicorn
- **容器**：Docker + Docker Compose

## 支持

如有问题，请查看：
- 容器日志：`docker-compose logs -f`
- 健康检查：`http://localhost:8000/health`
- API 文档：`http://localhost:8000/docs`
