<template>
  <div class="html-fetcher">
    <div class="input-section">
      <el-input
        v-model="urlInput"
        placeholder="请输入网站URL（例如：https://example.com）"
        class="url-input"
        @keyup.enter="fetchHtml"
      />
      <el-button 
        type="primary" 
        @click="fetchHtml"
        :loading="loading"
        :disabled="!isValidUrl"
      >
        获取HTML
      </el-button>
    </div>
    
    <div v-if="htmlContent" class="result-section">
      <div class="result-header">
        <h3>HTML源代码</h3>
        <el-button size="small" @click="copyToClipboard">复制</el-button>
      </div>
      <pre class="html-content">{{ htmlContent }}</pre>
    </div>
    
    <div v-if="error" class="error-section">
      <el-alert
        :title="error"
        type="error"
        :closable="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { fetchHtmlContent } from '@/utils/html-fetcher'

const urlInput = ref('')
const htmlContent = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 验证输入的URL格式
const isValidUrl = computed(() => {
  try {
    new URL(urlInput.value)
    return urlInput.value.startsWith('http://') || urlInput.value.startsWith('https://')
  } catch {
    return false
  }
})

// 获取HTML内容
const fetchHtml = async () => {
  if (!isValidUrl.value) {
    error.value = '请输入有效的URL（以http://或https://开头）'
    return
  }
  
  loading.value = true
  error.value = null
  htmlContent.value = null
  
  try {
    const content = await fetchHtmlContent(urlInput.value)
    if (content) {
      htmlContent.value = content
    } else {
      error.value = '获取HTML内容失败，请检查URL是否有效'
    }
  } catch (err) {
    error.value = `获取HTML内容时发生错误: ${err}`
  } finally {
    loading.value = false
  }
}

// 复制HTML内容到剪贴板
const copyToClipboard = async () => {
  if (htmlContent.value) {
    try {
      await navigator.clipboard.writeText(htmlContent.value)
      // 这里可以添加一个提示，如ElMessage
      console.log('HTML内容已复制到剪贴板')
    } catch (err) {
      console.error('复制到剪贴板失败:', err)
    }
  }
}
</script>

<style scoped>
.html-fetcher {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.url-input {
  flex: 1;
}

.result-section {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.html-content {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 12px;
}

.error-section {
  margin-top: 20px;
}
</style>