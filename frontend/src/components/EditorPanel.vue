<template>
  <div class="editor-panel">
    <div class="editor-header">
      <div class="editor-header-left">
        <button class="toggle-chat-btn" @click="$emit('toggleChat')" :title="isChatCollapsed ? '展开聊天' : '收起聊天'">
          <svg v-if="isChatCollapsed" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span
          class="status-badge"
          :class="`status-${editorStore.statusType}`"
        >
          {{ editorStore.status }}
        </span>
      </div>
      <div class="editor-header-center">
        <!-- 提示横幅 -->
        <div class="tip-banner">
          <span class="tip-banner-icon">💡</span>
          <span>如果生成效果不佳，建议点击"新建会话"重新开始</span>
        </div>
      </div>
      <div class="editor-header-right">
        <div class="editor-actions">
          <button class="btn btn-secondary btn-small" @click="openSettings">
            模型配置
          </button>
          <button
            class="btn btn-success btn-small"
            :disabled="!editorStore.isEditorReady || !editorStore.currentXML"
            @click="showFormatSelector = true"
          >
            导出图片
          </button>
        </div>
      </div>
    </div>

    <div class="editor-container">
      <!-- 空状态提示 -->
      <div
        v-if="!editorStore.currentXML && !editorStore.isLoading"
        class="empty-state"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>还没有流程图</p>
        <p style="font-size: 14px; margin-top: 8px;">在左侧输入描述，让 AI 为你生成</p>
      </div>

      <!-- 加载中 -->
      <div v-if="editorStore.isLoading" class="loading active">
        <div class="spinner"></div>
        <p>正在生成流程图...</p>
      </div>

      <!-- Draw.io 编辑器 iframe -->
      <iframe
        ref="editorFrameRef"
        v-show="editorStore.currentXML"
        class="editor-iframe"
        src="https://embed.diagrams.net/?embed=1&proto=json&spin=1&saveAndExit=0&noSaveBtn=1&noExitBtn=1&libraries=1&ui=kennedy"
      ></iframe>
    </div>
  </div>

  <!-- 格式选择器 -->
  <div
    v-if="showFormatSelector"
    class="modal-overlay"
    @click="showFormatSelector = false"
  >
    <div class="format-selector" @click.stop>
      <h4>选择导出格式</h4>
      <div class="format-options">
        <div
          class="format-option"
          :class="{ active: selectedFormat === 'png' }"
          @click="selectedFormat = 'png'"
        >
          <input type="radio" name="format" :checked="selectedFormat === 'png'" />
          <label>
            <strong>PNG 格式</strong>
            <span class="format-description">适合网页使用，支持透明背景，文件较大</span>
          </label>
        </div>
        <div
          class="format-option"
          :class="{ active: selectedFormat === 'svg' }"
          @click="selectedFormat = 'svg'"
        >
          <input type="radio" name="format" :checked="selectedFormat === 'svg'" />
          <label>
            <strong>SVG 格式</strong>
            <span class="format-description">矢量图，可无限缩放不失真，适合编辑</span>
          </label>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="showFormatSelector = false">取消</button>
        <button type="button" class="btn btn-primary" @click="confirmExport">确定导出</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useConfigStore } from '../stores/config'

// 定义 props
const props = defineProps({
  isChatCollapsed: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
defineEmits(['toggleChat'])

const editorStore = useEditorStore()
const configStore = useConfigStore()

const editorFrameRef = ref(null)
const showFormatSelector = ref(false)
const selectedFormat = ref('png')

// 处理 draw.io 消息
function handleDrawioMessage(evt) {
  if (evt.data && evt.data.length > 0) {
    try {
      const msg = JSON.parse(evt.data)

      switch (msg.event) {
        case 'init':
          editorStore.setEditorReady(true)
          console.log('Draw.io 编辑器已就绪')
          break

        case 'save':
          editorStore.currentXML = msg.xml
          break

        case 'export':
          if (editorStore.exportingImage && msg.data) {
            // 导出图片
            console.log('[导出] 格式:', editorStore.selectedFormat)
            console.log('[导出] 数据长度:', msg.data?.length || 0)
            downloadImage(msg.data, editorStore.selectedFormat)
            editorStore.handleExportComplete(msg.data)
          } else {
            // 导出 XML
            editorStore.currentXML = msg.xml
          }
          break

        case 'autosave':
          editorStore.currentXML = msg.xml
          break
      }
    } catch (e) {
      // 忽略非 JSON 消息
    }
  }
}

// 下载图片
function downloadImage(data, format) {
  try {
    const link = document.createElement('a')

    if (format === 'svg') {
      // SVG 格式处理
      let svgContent = data

      // 如果是 data URL 格式，需要解码
      if (data.startsWith('data:image/svg+xml;base64,')) {
        const base64Data = data.split(',')[1]
        // 使用 Uint8Array 和 TextDecoder 正确处理 UTF-8 编码
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const decoder = new TextDecoder('utf-8')
        svgContent = decoder.decode(bytes)
        console.log('[导出] SVG 已从 base64 解码（UTF-8）')
      } else if (data.startsWith('data:image/svg+xml,')) {
        svgContent = decodeURIComponent(data.split(',')[1])
        console.log('[导出] SVG 已从 URI 解码')
      }

      // 使用 UTF-8 编码创建 Blob
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
      link.href = URL.createObjectURL(blob)
    } else {
      // PNG 格式处理（base64）
      if (!data.startsWith('data:')) {
        data = `data:image/png;base64,${data}`
      }

      try {
        const base64Data = data.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })
        link.href = URL.createObjectURL(blob)
      } catch (e) {
        console.warn('Blob 转换失败，使用 data URL:', e)
        link.href = data
      }
    }

    link.download = `diagram_${Date.now()}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (link.href.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(link.href), 100)
    }

    console.log(`[导出] ${format.toUpperCase()} 图片下载完成`)
  } catch (error) {
    console.error('[导出] 下载失败:', error)
    alert('下载图片失败: ' + error.message)
  }
}

// 确认导出
function confirmExport() {
  showFormatSelector.value = false
  editorStore.exportImage(selectedFormat.value)
}

// 打开设置
function openSettings() {
  configStore.openModal()
}

onMounted(() => {
  // 设置编辑器引用
  editorStore.setEditorFrame(editorFrameRef.value)

  // 监听来自 draw.io 的消息
  window.addEventListener('message', handleDrawioMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleDrawioMessage)
})
</script>

<style scoped>
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: flex 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: flex;
}

.editor-header {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-chat-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #dee2e6;
  background: #ffffff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #495057;
  padding: 0;
}

.toggle-chat-btn:hover {
  background: #f8f9fa;
  border-color: #1e40af;
  color: #1e40af;
}

.toggle-chat-btn:active {
  transform: scale(0.95);
}

.toggle-chat-btn svg {
  display: block;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-ready {
  background: #d4edda;
  color: #155724;
}

.status-loading {
  background: #fff3cd;
  color: #856404;
}

.tip-banner {
  padding: 6px 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 16px;
  font-size: 13px;
  color: #856404;
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-container {
  flex: 1;
  position: relative;
}

.editor-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.empty-state svg {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.3;
}

.loading {
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.loading.active {
  display: block;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1e40af;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-success:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-primary {
  background: #1e40af;
  color: white;
}

.btn-primary:hover {
  background: #1e3a8a;
}

/* 格式选择器 */
.modal-overlay {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.format-selector {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  min-width: 300px;
}

.format-selector h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #212529;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.format-option {
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.format-option:hover {
  border-color: #1e40af;
  background: #f8f9fa;
}

.format-option.active {
  border-color: #1e40af;
  background: #f0f9ff;
}

.format-option input[type="radio"] {
  cursor: pointer;
}

.format-option label {
  cursor: pointer;
  flex: 1;
  margin: 0;
}

.format-description {
  font-size: 12px;
  color: #6c757d;
  display: block;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
