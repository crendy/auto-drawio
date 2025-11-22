import { useConversationStore } from '../stores/conversation'
import { useEditorStore } from '../stores/editor'
import { useTemplateStore } from '../stores/template'

export function useAI() {
  const conversationStore = useConversationStore()
  const editorStore = useEditorStore()
  const templateStore = useTemplateStore()

  // 流式生成流程图
  async function generateDiagramStream(prompt, skipUserMessage = false) {
    if (!prompt) return false

    // 保存提示词
    conversationStore.lastPrompt = prompt

    // 添加用户消息（重新生成时跳过）
    if (!skipUserMessage) {
      conversationStore.addMessage('user', prompt)
    }

    // 创建流式消息，获取索引
    const streamMessageIndex = conversationStore.addStreamMessage()

    // 显示加载状态
    editorStore.updateStatus('生成中...', 'loading')
    editorStore.setLoading(true)

    try {
      // 构建请求体
      const requestBody = {
        prompt: prompt,
        messages: conversationStore.conversationHistory,
        skip_apis: conversationStore.failedAPIs
      }

      // 如果选择了模板，添加自定义系统提示词
      if (templateStore.currentTemplate?.systemPrompt) {
        requestBody.system_prompt = templateStore.currentTemplate.systemPrompt
      }

      const response = await fetch('/api/generate-diagram-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('生成失败')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // 保留最后不完整的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'content') {
              // 追加内容（使用索引）
              conversationStore.appendStreamContent(streamMessageIndex, data.content)
            } else if (data.type === 'validation_failed') {
              // 验证失败
              conversationStore.updateStreamStatus(
                streamMessageIndex,
                `❌ ${data.message}`,
                false,
                true
              )
              editorStore.updateStatus('验证失败', 'ready')
              editorStore.setLoading(false)
              return false
            } else if (data.type === 'complete') {
              // 生成完成（不显示状态消息）
              conversationStore.conversationHistory = data.messages

              // 加载到编辑器
              editorStore.loadXMLToEditor(data.xml)
              editorStore.updateStatus('就绪', 'ready')
              editorStore.setLoading(false)
              return true
            } else if (data.type === 'error' || data.type === 'failed') {
              // 错误
              conversationStore.updateStreamStatus(
                streamMessageIndex,
                `❌ ${data.message}`,
                false,
                true
              )
              editorStore.updateStatus('错误', 'ready')
              editorStore.setLoading(false)
              return false
            }
          }
        }
      }
    } catch (error) {
      console.error('生成失败:', error)
      conversationStore.updateStreamStatus(
        streamMessageIndex,
        '❌ 网络错误或请求失败，请检查连接后重试',
        false,
        true
      )
      editorStore.updateStatus('错误', 'ready')
      editorStore.setLoading(false)
      return false
    }
  }

  return {
    generateDiagramStream
  }
}
