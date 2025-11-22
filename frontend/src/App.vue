<template>
  <div class="container">
    <!-- 左侧 AI 对话区 -->
    <ChatPanel
      :class="{ 'chat-panel-collapsed': isChatCollapsed }"
      :is-collapsing="isChatCollapsed"
    />

    <!-- 右侧 Draw.io 编辑区 -->
    <EditorPanel :is-chat-collapsed="isChatCollapsed" @toggle-chat="toggleChat" />
  </div>

  <!-- 模板浏览弹窗 -->
  <TemplateModal />

  <!-- AI 配置管理弹窗 -->
  <SettingsModal />
</template>

<script setup>
import { ref } from 'vue'
import ChatPanel from './components/ChatPanel.vue'
import EditorPanel from './components/EditorPanel.vue'
import TemplateModal from './components/TemplateModal.vue'
import SettingsModal from './components/SettingsModal.vue'

// 聊天面板展开/收缩状态
const isChatCollapsed = ref(false)

// 切换聊天面板
function toggleChat() {
  isChatCollapsed.value = !isChatCollapsed.value
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  height: 100vh;
  overflow: hidden;
}

.container {
  display: flex;
  height: 100vh;
  position: relative;
}

/* 聊天面板收缩状态 */
.chat-panel-collapsed {
  width: 0 !important;
  min-width: 0 !important;
  border: none !important;
  overflow: hidden !important;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
