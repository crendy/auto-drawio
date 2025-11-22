<template>
  <div v-if="configStore.showModal" class="modal" @click="configStore.closeModal()">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>AI 模型配置</h3>
        <button class="close-btn" @click="configStore.closeModal()">&times;</button>
      </div>

      <button class="btn btn-add" @click="configStore.openFormModal()">+ 添加新配置</button>

      <!-- 配置列表 -->
      <div class="config-list">
        <p v-if="configStore.isLoading" style="text-align: center; color: #6c757d;">加载中...</p>
        <p v-else-if="!configStore.configs.length" style="text-align: center; color: #6c757d;">
          还没有配置，点击上方按钮添加
        </p>
        <div v-else v-for="config in configStore.configs" :key="config.id" class="config-item" :class="{ 'system-config': config.is_system }">
          <div class="config-header">
            <div>
              <span class="config-name">{{ config.name }}</span>
              <span v-if="config.is_system" class="config-badge config-system-badge">系统默认</span>
              <span class="config-status" :class="config.enabled ? 'config-enabled' : 'config-disabled'">
                {{ config.enabled ? '已启用' : '已禁用' }}
              </span>
            </div>
            <div class="config-actions">
              <!-- 系统配置不显示编辑和删除按钮 -->
              <button v-if="!config.is_system" class="btn btn-small btn-secondary" @click="editConfig(config)">编辑</button>
              <button
                class="btn btn-small"
                :class="config.enabled ? 'btn-secondary' : 'btn-success'"
                @click="toggleConfig(config.id, !config.enabled)"
              >
                {{ config.enabled ? '禁用' : '启用' }}
              </button>
              <button v-if="!config.is_system" class="btn btn-small btn-danger" @click="deleteConfig(config.id)">删除</button>
            </div>
          </div>
          <div class="config-details">
            <div><strong>模型:</strong> {{ config.model }}</div>
            <div v-if="!config.is_system"><strong>URL:</strong> {{ config.base_url }}</div>
            <div v-if="!config.is_system"><strong>API Key:</strong> {{ maskApiKey(config.api_key) }}</div>
            <div v-if="config.is_system" style="color: #6c757d; font-size: 12px;">系统配置，URL 和 API Key 已隐藏</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 添加/编辑配置表单 -->
  <div v-if="configStore.showFormModal" class="modal" @click="configStore.closeFormModal()">
    <div class="modal-content" style="max-width: 600px;" @click.stop>
      <div class="modal-header">
        <h3>{{ configStore.editingConfig ? '编辑配置' : '添加新配置' }}</h3>
        <button class="close-btn" @click="configStore.closeFormModal()">&times;</button>
      </div>

      <form @submit.prevent="saveConfig">
        <div class="form-group">
          <label>配置名称 *</label>
          <input type="text" v-model="formData.name" required placeholder="例如: OpenAI GPT-4" />
        </div>

        <div class="form-group">
          <label>API 基础 URL *</label>
          <input type="url" v-model="formData.base_url" required placeholder="例如: https://api.openai.com/v1" />
        </div>

        <div class="form-group">
          <label>API 密钥 *</label>
          <input type="text" v-model="formData.api_key" required placeholder="sk-..." />
        </div>

        <div class="form-group">
          <label>模型名称 *</label>
          <input type="text" v-model="formData.model" required placeholder="例如: gpt-4" />
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="configStore.closeFormModal()">取消</button>
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useConfigStore } from '../stores/config'

const configStore = useConfigStore()

const formData = reactive({
  name: '',
  base_url: '',
  api_key: '',
  model: ''
})

// 监听编辑配置变化
watch(() => configStore.editingConfig, (config) => {
  if (config) {
    formData.name = config.name
    formData.base_url = config.base_url
    formData.api_key = config.api_key
    formData.model = config.model
  } else {
    formData.name = ''
    formData.base_url = ''
    formData.api_key = ''
    formData.model = ''
  }
})

// 编辑配置
async function editConfig(config) {
  const fullConfig = await configStore.getConfig(config.id)
  if (fullConfig) {
    configStore.openFormModal(fullConfig)
  }
}

// 保存配置
async function saveConfig() {
  const config = configStore.editingConfig

  if (config) {
    // 更新
    await configStore.updateConfig(config.id, formData)
  } else {
    // 创建
    await configStore.createConfig(formData)
  }

  configStore.closeFormModal()
}

// 切换配置
async function toggleConfig(configId, enabled) {
  await configStore.toggleConfig(configId, enabled)
}

// 删除配置
async function deleteConfig(configId) {
  if (confirm('确定要删除此配置吗？')) {
    await configStore.deleteConfig(configId)
  }
}

// 遮蔽 API Key
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) {
    return '***'
  }
  return apiKey.substring(0, 10) + '***' + apiKey.substring(apiKey.length - 4)
}
</script>

<style scoped>
.modal {
  display: flex;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 15px;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #212529;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  line-height: 28px;
}

.close-btn:hover {
  color: #000;
}

.btn-add {
  background: #28a745;
  color: white;
  margin-bottom: 20px;
}

.btn-add:hover {
  background: #218838;
}

.config-list {
  margin-bottom: 20px;
}

.config-item {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.config-item.system-config {
  background: #e7f3ff;
  border: 1px solid #1e40af;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.config-name {
  font-weight: bold;
  font-size: 16px;
  color: #212529;
}

.config-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
}

.config-system-badge {
  background: #1e40af;
  color: white;
}

.config-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
}

.config-enabled {
  background: #d4edda;
  color: #155724;
}

.config-disabled {
  background: #f8d7da;
  color: #721c24;
}

.config-actions {
  display: flex;
  gap: 8px;
}

.config-details {
  font-size: 13px;
  color: #495057;
}

.config-details div {
  margin: 5px 0;
  word-break: break-all;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #212529;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #1e40af;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: #1e40af;
  color: white;
}

.btn-primary:hover {
  background: #1e3a8a;
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

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}
</style>
