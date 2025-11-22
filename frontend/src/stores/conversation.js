import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConversationStore = defineStore('conversation', () => {
  // 对话历史
  const messages = ref([])
  const conversationHistory = ref([])

  // 当前提示词
  const lastPrompt = ref(null)
  const lastFailedXML = ref(null)
  const lastValidationError = ref(null)
  const failedAPIs = ref([])
  const lastUsedAPI = ref(null)

  // 添加消息
  function addMessage(type, content) {
    messages.value.push({
      type,
      content,
      timestamp: Date.now()
    })
  }

  // 添加流式消息
  function addStreamMessage() {
    const message = {
      type: 'ai',
      isStream: true,
      content: '',
      status: '',
      isCompleted: false,
      isError: false,
      timestamp: Date.now()
    }
    messages.value.push(message)
    // 返回消息在数组中的索引
    return messages.value.length - 1
  }

  // 更新流式消息内容（使用索引）
  function appendStreamContent(messageIndex, content) {
    if (messageIndex >= 0 && messageIndex < messages.value.length) {
      messages.value[messageIndex].content += content
      // 强制触发响应式更新
      messages.value = [...messages.value]
    }
  }

  // 更新流式消息状态（使用索引）
  function updateStreamStatus(messageIndex, status, isCompleted = false, isError = false) {
    if (messageIndex >= 0 && messageIndex < messages.value.length) {
      messages.value[messageIndex].status = status
      messages.value[messageIndex].isCompleted = isCompleted
      messages.value[messageIndex].isError = isError
      // 强制触发响应式更新
      messages.value = [...messages.value]
    }
  }

  // 清空对话
  function clearConversation() {
    messages.value = []
    conversationHistory.value = []
    lastPrompt.value = null
    lastFailedXML.value = null
    lastValidationError.value = null
    failedAPIs.value = []
    lastUsedAPI.value = null
  }

  // 添加欢迎消息
  function addWelcomeMessage() {
    messages.value = [{
      type: 'ai',
      content: '你好！我是 auto-drawio。\n请描述你想要生成的流程图，例如：\n• "生成一个用户登录流程图"\n• "创建订单处理流程"\n• "设计支付系统架构图"',
      timestamp: Date.now()
    }]
  }

  // 移除指定索引的消息
  function removeMessage(index) {
    if (index >= 0 && index < messages.value.length) {
      messages.value.splice(index, 1)
    }
  }

  return {
    messages,
    conversationHistory,
    lastPrompt,
    lastFailedXML,
    lastValidationError,
    failedAPIs,
    lastUsedAPI,
    addMessage,
    addStreamMessage,
    appendStreamContent,
    updateStreamStatus,
    clearConversation,
    addWelcomeMessage,
    removeMessage
  }
})
