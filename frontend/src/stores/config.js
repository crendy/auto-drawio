import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  // 配置列表
  const configs = ref([])
  const isLoading = ref(false)

  // 模态框状态
  const showModal = ref(false)
  const showFormModal = ref(false)
  const editingConfig = ref(null)

  // 加载配置列表
  async function loadConfigs() {
    try {
      isLoading.value = true
      const response = await fetch('/api/ai-configs')
      const data = await response.json()

      if (data.success) {
        configs.value = data.configs
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个配置
  async function getConfig(configId) {
    try {
      const response = await fetch(`/api/ai-configs/${configId}`)
      const data = await response.json()

      if (data.success) {
        return data.config
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    }
    return null
  }

  // 创建配置
  async function createConfig(configData) {
    try {
      const response = await fetch('/api/ai-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })

      const data = await response.json()

      if (data.success) {
        await loadConfigs()
        return true
      }
    } catch (error) {
      console.error('创建配置失败:', error)
    }
    return false
  }

  // 更新配置
  async function updateConfig(configId, updateData) {
    try {
      const response = await fetch(`/api/ai-configs/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success) {
        await loadConfigs()
        return true
      }
    } catch (error) {
      console.error('更新配置失败:', error)
    }
    return false
  }

  // 删除配置
  async function deleteConfig(configId) {
    try {
      const response = await fetch(`/api/ai-configs/${configId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadConfigs()
        return true
      }
    } catch (error) {
      console.error('删除配置失败:', error)
    }
    return false
  }

  // 切换配置启用状态
  async function toggleConfig(configId, enabled) {
    if (enabled) {
      // 禁用所有其他配置
      for (const config of configs.value) {
        if (config.enabled && config.id !== configId) {
          await updateConfig(config.id, { enabled: false })
        }
      }
    }

    return await updateConfig(configId, { enabled })
  }

  // 打开设置模态框
  function openModal() {
    showModal.value = true
    loadConfigs()
  }

  // 关闭设置模态框
  function closeModal() {
    showModal.value = false
    closeFormModal()
  }

  // 打开表单模态框
  function openFormModal(config = null) {
    editingConfig.value = config
    showFormModal.value = true
  }

  // 关闭表单模态框
  function closeFormModal() {
    showFormModal.value = false
    editingConfig.value = null
  }

  return {
    configs,
    isLoading,
    showModal,
    showFormModal,
    editingConfig,
    loadConfigs,
    getConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfig,
    openModal,
    closeModal,
    openFormModal,
    closeFormModal
  }
})
