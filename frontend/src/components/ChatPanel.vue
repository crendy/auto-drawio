<template>
  <div class="chat-panel" :class="{ 'is-collapsing': props.isCollapsing }">
    <div class="chat-header">
      <h2>auto-drawio</h2>
      <button class="btn btn-secondary btn-small" @click="openTemplateModal">
        🎨 模板
      </button>
      <button class="btn btn-secondary btn-small" @click="newConversation">
        新建会话
      </button>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', `message-${message.type}`]"
      >
        <div class="message-content">
          <template v-if="message.isStream">
            <!-- 流式消息 -->
            <div v-if="message.content" class="code-block">
              <div class="code-header">
                <span class="code-language">XML</span>
              </div>
              <pre ref="codeOutputRef" class="code-output"><code>{{ message.content }}</code></pre>
            </div>
            <div v-else class="generating-text">正在生成...</div>
          </template>
          <template v-else>
            <!-- 普通消息 -->
            <div v-html="formatMessage(message.content)"></div>
          </template>
        </div>

        <!-- AI 消息的操作按钮 -->
        <div v-if="message.type === 'ai' && message.content" class="message-actions">
          <button
            class="action-btn"
            @click="copyMessageContent(message, index)"
            :class="{ copied: message.copied }"
            :title="message.copied ? '已复制' : '复制内容'"
          >
            <svg v-if="!message.copied" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M16 8V6C16 4.89543 15.1046 4 14 4H6C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H8" stroke="currentColor" stroke-width="2"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            v-if="message.isStream && message.content"
            class="action-btn"
            @click="regenerateMessage(index)"
            title="重新生成"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.26284 19 6.25" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M19 3V6.25H15.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <!-- 快捷提问按钮 -->
      <div class="quick-questions">
        <button
          class="quick-question-btn"
          :disabled="!editorStore.isEditorReady"
          @click="quickQuestion('生成一个用户登录流程图')"
        >
          用户登录流程
        </button>
        <button
          class="quick-question-btn"
          :disabled="!editorStore.isEditorReady"
          @click="quickQuestion('创建一个电商订单处理流程')"
        >
          订单处理流程
        </button>
        <button
          class="quick-question-btn"
          :disabled="!editorStore.isEditorReady"
          @click="quickQuestion('设计一个支付系统架构图')"
        >
          支付系统架构
        </button>
      </div>

      <div class="input-group">
        <input
          type="text"
          class="chat-input"
          v-model="userInput"
          :placeholder="editorStore.isEditorReady ? '描述你想要的流程图...' : '等待编辑器初始化...'"
          :disabled="!editorStore.isEditorReady"
          @keypress.enter="generateDiagram"
        />
        <button
          class="btn btn-primary"
          :disabled="!editorStore.isEditorReady || !userInput.trim()"
          @click="generateDiagram"
        >
          生成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useConversationStore } from '../stores/conversation'
import { useEditorStore } from '../stores/editor'
import { useTemplateStore } from '../stores/template'
import { useAI } from '../composables/useAI'

// 定义 props
const props = defineProps({
  isCollapsing: {
    type: Boolean,
    default: false
  }
})

const conversationStore = useConversationStore()
const editorStore = useEditorStore()
const templateStore = useTemplateStore()
const { generateDiagramStream } = useAI()

const userInput = ref('')
const messagesContainer = ref(null)
const codeOutputRef = ref(null)

// 使用 storeToRefs 保持响应式
const { messages } = storeToRefs(conversationStore)

// 监听消息变化，自动滚动
watch(messages, () => {
  // 滚动消息容器到底部
  scrollToBottom()

  // 滚动代码输出框到底部
  nextTick(() => {
    scrollCodeToBottom()
  })
}, { deep: true })

// 格式化消息（处理换行）
function formatMessage(content) {
  return content.replace(/\n/g, '<br>')
}

// 复制消息内容（带状态提示，支持重复复制）
async function copyMessageContent(message, index) {
  try {
    await navigator.clipboard.writeText(message.content)
    // 设置 copied 状态
    messages.value[index].copied = true
    setTimeout(() => {
      messages.value[index].copied = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

// 重新生成消息（不重新发送用户消息）
async function regenerateMessage(index) {
  // 找到对应的用户消息（AI 消息的前一条）
  if (index > 0) {
    const userMessage = messages.value[index - 1]
    if (userMessage && userMessage.type === 'user') {
      const prompt = userMessage.content

      // 只删除当前 AI 消息，保留用户消息
      conversationStore.removeMessage(index)

      // 重新生成（跳过添加用户消息）
      await generateDiagramStream(prompt, true)
      scrollToBottom()
    } else {
      alert('无法找到对应的用户提问，请重新提问')
    }
  } else {
    alert('无法重新生成，请重新提问')
  }
}

// 快捷提问
function quickQuestion(question) {
  userInput.value = question
  generateDiagram()
}

// 生成流程图
async function generateDiagram() {
  const prompt = userInput.value.trim()
  if (!prompt || !editorStore.isEditorReady) return

  // 清空输入
  userInput.value = ''

  // 调用 AI 生成
  await generateDiagramStream(prompt)

  // 滚动到底部
  scrollToBottom()
}

// 新建会话
function newConversation() {
  conversationStore.clearConversation()
  conversationStore.addWelcomeMessage()
  userInput.value = ''

  // 清空编辑器（隐藏 iframe，显示空状态）
  editorStore.currentXML = null
}

// 打开模板模态框
function openTemplateModal() {
  templateStore.openModal()
}

// 滚动消息容器到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 滚动代码输出框到底部
function scrollCodeToBottom() {
  if (codeOutputRef.value) {
    // 如果是数组（多个 ref），遍历所有
    const refs = Array.isArray(codeOutputRef.value) ? codeOutputRef.value : [codeOutputRef.value]
    refs.forEach(ref => {
      if (ref) {
        ref.scrollTop = ref.scrollHeight
      }
    })
  }
}

// 组件挂载时初始化欢迎消息
onMounted(() => {
  if (messages.value.length === 0) {
    conversationStore.addWelcomeMessage()
  }
  console.log('[ChatPanel] 组件已挂载，消息数量:', messages.value.length)
})
</script>

<style scoped>
.chat-panel {
  width: 400px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1),
              border 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  will-change: width;
}

.chat-panel.is-collapsing .chat-header,
.chat-panel.is-collapsing .chat-messages,
.chat-panel.is-collapsing .chat-input-area {
  opacity: 0;
  pointer-events: none;
}

.chat-header,
.chat-messages,
.chat-input-area {
  transition: opacity 0.25s ease;
  opacity: 1;
}

.chat-header {
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-header h2 {
  font-size: 18px;
  color: #212529;
  flex: 1;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth; /* 平滑滚动 */
}

/* 消息容器滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.message {
  margin-bottom: 16px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-user {
  text-align: right;
}

.message-ai {
  text-align: left;
}

.message-content {
  display: inline-block;
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 8px;
  word-wrap: break-word;
}

.message-user .message-content {
  background: #1e40af;
  color: white;
}

.message-ai .message-content {
  background: white;
  color: #212529;
  border: 1px solid #dee2e6;
  max-width: 100%; /* 代码块需要更宽 */
}

/* 消息操作按钮 */
.message-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  margin-left: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #1e40af;
  color: #1e40af;
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.copied {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.action-btn.copied:hover {
  background: #218838;
  border-color: #1e7e34;
}

.action-btn svg {
  display: block;
}


.code-block {
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  overflow: hidden;
  margin: 0;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
}

.code-language {
  font-size: 12px;
  color: #586069;
  text-transform: uppercase;
  font-weight: 500;
}

.copy-btn {
  padding: 4px 12px;
  background: #ffffff;
  border: 1px solid #d1d5da;
  border-radius: 4px;
  color: #24292e;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #f3f4f6;
  border-color: #1e40af;
  color: #1e40af;
}

.copy-btn.copied {
  background: #28a745;
  border-color: #28a745;
  color: white;
}

.code-output {
  margin: 0;
  padding: 16px;
  background: #ffffff;
  color: #24292e;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.code-output::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.code-output::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.code-output::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.code-output::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.code-output code {
  color: #24292e;
  font-family: inherit;
}

.generating-text {
  color: #6c757d;
  font-style: italic;
  padding: 8px 0;
}

.stream-output {
  display: none; /* 隐藏旧的流式输出样式 */
}

.stream-status {
  display: none; /* 隐藏状态文本 */
}

.chat-input-area {
  padding: 20px;
  background: #fff;
  border-top: 1px solid #dee2e6;
}

.quick-questions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.quick-question-btn {
  padding: 8px 14px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 16px;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.quick-question-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #1e40af;
  color: #1e40af;
}

.quick-question-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-group {
  display: flex;
  gap: 10px;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.chat-input:focus {
  border-color: #1e40af;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1e40af;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1e3a8a;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
}
</style>
