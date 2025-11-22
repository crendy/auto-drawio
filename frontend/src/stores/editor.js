import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  // 编辑器状态
  const isEditorReady = ref(false)
  const currentXML = ref(null)
  const editorFrame = ref(null)

  // 加载状态
  const isLoading = ref(false)
  const status = ref('初始化中...')
  const statusType = ref('loading') // 'loading', 'ready', 'error'

  // 导出状态
  const exportingImage = ref(false)
  const selectedFormat = ref('png')

  // 设置编辑器引用
  function setEditorFrame(frame) {
    editorFrame.value = frame
  }

  // 设置编辑器就绪
  function setEditorReady(ready) {
    isEditorReady.value = ready
    if (ready) {
      updateStatus('就绪', 'ready')
    }
  }

  // 更新状态
  function updateStatus(text, type = 'ready') {
    status.value = text
    statusType.value = type
  }

  // 设置加载状态
  function setLoading(loading) {
    isLoading.value = loading
  }

  // 加载 XML 到编辑器
  function loadXMLToEditor(xml) {
    if (!isEditorReady.value || !editorFrame.value) {
      console.error('编辑器未就绪')
      return
    }

    currentXML.value = xml

    const message = JSON.stringify({
      action: 'load',
      xml: xml,
      autosave: 1
    })

    editorFrame.value.contentWindow.postMessage(message, '*')
    console.log('XML 已加载到编辑器')
  }

  // 导出图片
  function exportImage(format = 'png') {
    if (!isEditorReady.value || !currentXML.value) {
      return false
    }

    exportingImage.value = true
    selectedFormat.value = format

    const message = JSON.stringify({
      action: 'export',
      format: format,
      spin: 'Exporting...'
    })

    editorFrame.value.contentWindow.postMessage(message, '*')
    return true
  }

  // 处理导出完成
  function handleExportComplete(data) {
    exportingImage.value = false
    return data
  }

  return {
    isEditorReady,
    currentXML,
    editorFrame,
    isLoading,
    status,
    statusType,
    exportingImage,
    selectedFormat,
    setEditorFrame,
    setEditorReady,
    updateStatus,
    setLoading,
    loadXMLToEditor,
    exportImage,
    handleExportComplete
  }
})
