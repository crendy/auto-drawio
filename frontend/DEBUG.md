# 调试指南

## 问题：聊天框不显示聊天记录

### 排查步骤

#### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签：

**期望看到的日志**：
```
[ChatPanel] 组件已挂载，消息数量: 1
```

**如果看到错误**：
- 查看具体错误信息
- 检查是否有模块加载失败
- 检查网络请求是否正常

#### 2. 检查 Vue DevTools

安装 Vue DevTools 浏览器扩展，然后：

1. 打开 DevTools 中的 Vue 标签
2. 查看组件树，找到 `ChatPanel` 组件
3. 检查 `messages` 数据是否有值
4. 检查 `conversationStore` 的状态

**期望状态**：
```javascript
messages: [
  {
    type: 'ai',
    content: '你好！我是 auto-drawio...',
    timestamp: 1234567890
  }
]
```

#### 3. 手动测试消息添加

在浏览器控制台中执行：

```javascript
// 获取 Pinia store
const { useConversationStore } = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps[0].config.globalProperties.$pinia._s.get('conversation')

// 查看当前消息
console.log('当前消息:', messages.value)

// 手动添加消息
conversationStore.addMessage('user', '测试消息')
console.log('添加后消息:', messages.value)
```

#### 4. 检查 CSS 样式

在开发者工具的 Elements 标签中：

1. 找到 `.chat-messages` 元素
2. 检查是否有 `display: none` 或 `opacity: 0`
3. 检查 `overflow` 属性
4. 查看消息元素是否实际存在于 DOM 中

#### 5. 检查组件渲染

在 ChatPanel.vue 的 `<script setup>` 中添加调试代码：

```javascript
// 监听消息变化
watch(messages, (newMessages) => {
  console.log('[ChatPanel] 消息更新:', newMessages)
}, { deep: true })
```

#### 6. 验证 Pinia 配置

检查 `main.js` 中是否正确配置了 Pinia：

```javascript
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)
```

### 常见问题及解决方案

#### 问题 1：组件未挂载

**症状**：看不到 `[ChatPanel] 组件已挂载` 日志

**解决**：
1. 检查 `App.vue` 是否正确引入了 `ChatPanel`
2. 检查路由配置（如果有）
3. 查看是否有 JavaScript 错误阻止了组件挂载

#### 问题 2：消息数据为空

**症状**：`messages.value.length === 0`

**解决**：
1. 检查 `addWelcomeMessage()` 方法是否被调用
2. 在方法中添加 `console.log` 验证
3. 检查 Pinia store 是否正确初始化

#### 问题 3：响应式失效

**症状**：数据有值但页面不更新

**解决**：
1. 确认使用了 `storeToRefs`
2. 检查是否直接修改了响应式对象（应该使用 `.value`）
3. 尝试强制刷新页面

#### 问题 4：CSS 遮挡或隐藏

**症状**：DOM 中有元素但看不见

**解决**：
1. 检查 `.chat-messages` 的高度
2. 检查是否被其他元素遮挡（z-index）
3. 检查父容器的 `overflow` 属性

### 快速测试代码

将以下代码添加到 `ChatPanel.vue` 的 `onMounted` 中进行测试：

```javascript
onMounted(() => {
  // 测试代码
  console.log('[调试] Pinia store:', conversationStore)
  console.log('[调试] messages ref:', messages)
  console.log('[调试] messages.value:', messages.value)

  // 添加测试消息
  setTimeout(() => {
    conversationStore.addMessage('user', '这是一条测试消息')
    console.log('[调试] 添加测试消息后:', messages.value)
  }, 1000)

  // 初始化欢迎消息
  if (messages.value.length === 0) {
    conversationStore.addWelcomeMessage()
    console.log('[调试] 添加欢迎消息后:', messages.value)
  }
})
```

### 需要提供的信息

如果问题仍然存在，请提供：

1. 浏览器控制台的完整错误信息
2. Vue DevTools 中 ChatPanel 组件的状态截图
3. Network 标签中的 API 请求情况
4. 是否有任何 JavaScript 错误

### 强制刷新方案

如果以上都无效，尝试：

1. 清除浏览器缓存
2. 重启开发服务器
3. 删除 `node_modules` 和 `package-lock.json`，重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

### 联系支持

如果问题持续，请创建一个最小可复现示例并提供详细的环境信息。
