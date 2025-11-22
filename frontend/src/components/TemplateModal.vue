<template>
  <div v-if="templateStore.showModal" class="template-modal" @click="templateStore.closeModal()">
    <div class="template-modal-content" @click.stop>
      <!-- 列表页 -->
      <div v-if="!templateStore.showDetailPage">
        <div class="template-modal-header">
          <div class="template-modal-title">
            <span>🎨</span>
            <span>选择绘图模板</span>
          </div>
          <button class="template-modal-close" @click="templateStore.closeModal()">✕</button>
        </div>
        <div class="template-modal-body">
          <div class="template-grid">
            <div
              v-for="template in templateStore.templates"
              :key="template.id"
              class="template-card"
              :class="{ active: templateStore.currentTemplate?.id === template.id }"
              @click="handleTemplateClick(template.id)"
            >
              <div class="template-preview" v-html="template.previewSvg"></div>
              <div class="template-content">
                <div class="template-header">
                  <span class="template-icon">{{ template.icon }}</span>
                  <span class="template-name">{{ template.name }}</span>
                </div>
                <div class="template-description">{{ template.description }}</div>
                <div class="template-tags">
                  <span v-for="tag in template.tags" :key="tag" class="template-tag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详情页 -->
      <div v-else class="template-detail-container">
        <div class="template-modal-header">
          <button class="btn-back" @click="templateStore.backToList()">← 返回</button>
          <div class="template-modal-title">
            <span>{{ templateStore.detailTemplate?.icon }}</span>
            <span>{{ templateStore.detailTemplate?.name }}</span>
          </div>
          <button class="template-modal-close" @click="templateStore.closeModal()">✕</button>
        </div>
        <div class="template-modal-body template-detail-body">
          <div class="template-detail-section">
            <h3>{{ templateStore.detailTemplate?.name }}</h3>
            <p>{{ templateStore.detailTemplate?.description }}</p>
            <div class="template-preview-large" v-html="templateStore.detailTemplate?.previewSvg"></div>
          </div>
        </div>
        <div class="template-modal-footer">
          <button class="btn btn-secondary" @click="templateStore.backToList()">返回列表</button>
          <button class="btn btn-primary" @click="applyTemplate">应用此模板</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTemplateStore } from '../stores/template'
import { useConversationStore } from '../stores/conversation'

const templateStore = useTemplateStore()
const conversationStore = useConversationStore()

function handleTemplateClick(templateId) {
  templateStore.viewDetail(templateId)
}

function applyTemplate() {
  if (templateStore.detailTemplate) {
    templateStore.applyTemplate(templateStore.detailTemplate.id)
    templateStore.closeModal()

    const template = templateStore.currentTemplate
    conversationStore.addMessage('ai', `已应用模板：${template.icon} ${template.name}。现在您可以描述想要生成的流程图了。`)
  }
}
</script>

<style scoped>
.template-modal {
  display: flex;
  position: fixed;
  z-index: 2000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  justify-content: center;
  align-items: center;
}

.template-modal-content {
  background-color: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s;
}

@keyframes slideIn {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.template-modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.template-modal-title {
  font-size: 24px;
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.template-modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  color: #6c757d;
  transition: all 0.2s;
}

.template-modal-close:hover {
  background: #e9ecef;
  color: #212529;
}

.template-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  min-height: 0; /* 修复flex子元素滚动问题 */
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.template-card {
  background: #ffffff;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.template-card:hover {
  border-color: #1e40af;
  box-shadow: 0 4px 16px rgba(30, 64, 175, 0.15);
  transform: translateY(-4px);
}

.template-card.active {
  border-color: #1e40af;
  background: #f0f9ff;
}

.template-preview {
  width: 100%;
  height: 200px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.template-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.template-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.template-icon {
  font-size: 28px;
}

.template-name {
  font-size: 18px;
  font-weight: 600;
  color: #212529;
}

.template-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 16px;
  flex: 1;
}

.template-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.template-tag {
  padding: 4px 12px;
  background: #e9ecef;
  border-radius: 16px;
  font-size: 12px;
  color: #495057;
}

.template-modal-footer {
  padding: 20px 32px;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1e40af;
  color: white;
}

.btn-primary:hover {
  background: #1e3a8a;
}

.btn-secondary {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
}

.btn-secondary:hover {
  background: #e9ecef;
}

.btn-back {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f8f9fa;
  border-color: #1e40af;
  color: #1e40af;
}

.template-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.template-detail-body {
  padding: 0;
  flex: 1;
  overflow-y: auto; /* 确保可以滚动 */
  min-height: 0;
}

.template-detail-section {
  padding: 32px;
}

.template-detail-section h3 {
  font-size: 24px;
  margin-bottom: 16px;
}

.template-preview-large {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}
</style>
