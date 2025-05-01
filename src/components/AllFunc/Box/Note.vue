<template>
  <div class="note__layout">
    <Transition name="fade" mode="out-in">
      <div v-if="notes.length" class="note-container">
        <n-scrollbar class="scrollbar">
          <n-grid
            class="all-notes"
            responsive="screen"
            cols="1 s:2 m:3 l:4"
            :x-gap="12"
            :y-gap="12"
          >
            <n-grid-item
              v-for="note in notes"
              :key="note.id"
              class="note-item"
            >
              <div class="note-header">
                <span class="title">{{ note.title }}</span>
                <span class="date">{{ formatDate(note.updateTime) }}</span>
              </div>
              <div class="content">{{ note.content }}</div>
              <div class="note-actions">
                <n-button text @click="editNote(note)">
                  <template #icon>
                    <SvgIcon iconName="icon-edit" />
                  </template>
                </n-button>
                <n-button text @click="deleteNote(note.id)">
                  <template #icon>
                    <SvgIcon iconName="icon-delete" />
                  </template>
                </n-button>
              </div>
            </n-grid-item>
            <n-grid-item
              class="note-item add-note"
              @click="openAddModal"
            >
              <SvgIcon iconName="icon-add" />
              <span class="add-text">添加便签</span>
            </n-grid-item>
          </n-grid>
        </n-scrollbar>
      </div>
      <div v-else class="not-note">
        <span class="tip">暂无便签，去添加吧</span>
        <n-button strong secondary @click="openAddModal">
          <template #icon>
            <SvgIcon iconName="icon-add" />
          </template>
          添加便签
        </n-button>
      </div>
    </Transition>

    <!-- 添加/编辑便签模态框 -->
    <n-modal
      v-model:show="showModal"
      :title="currentNote.id ? '编辑便签' : '添加便签'"
      preset="dialog"
    >
      <n-form>
        <n-form-item label="标题">
          <n-input v-model:value="currentNote.title" placeholder="便签标题" />
        </n-form-item>
        <n-form-item label="内容">
          <n-input
            v-model:value="currentNote.content"
            type="textarea"
            placeholder="便签内容"
            :autosize="{
              minRows: 3,
              maxRows: 10
            }"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="saveNote">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NButton, NScrollbar, NGrid, NGridItem, NModal, NForm, NFormItem, NInput } from 'naive-ui'
import SvgIcon from '@/components/SvgIcon.vue'

// 便签数据
const notes = ref([
  { id: 1, title: '示例便签', content: '这是一个简单的便签示例', updateTime: Date.now() }
])

// 当前操作的便签
const currentNote = ref({
  id: null,
  title: '',
  content: '',
  updateTime: null
})

// 控制模态框显示
const showModal = ref(false)

// 日期格式化
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 打开添加模态框
const openAddModal = () => {
  currentNote.value = {
    id: null,
    title: '',
    content: '',
    updateTime: null
  }
  showModal.value = true
}

// 编辑便签
const editNote = (note) => {
  currentNote.value = { ...note }
  showModal.value = true
}

// 保存便签
const saveNote = () => {
  if (!currentNote.value.title.trim()) {
    window.$message?.warning('请输入便签标题')
    return
  }

  if (currentNote.value.id) {
    // 更新现有便签
    const index = notes.value.findIndex(n => n.id === currentNote.value.id)
    if (index !== -1) {
      notes.value[index] = { 
        ...currentNote.value, 
        updateTime: Date.now() 
      }
    }
  } else {
    // 添加新便签 - 修复了这里的问题
    const newId = notes.value.length > 0 
      ? Math.max(...notes.value.map(n => n.id)) + 1 
      : 1
    notes.value.push({ 
      ...currentNote.value, 
      id: newId,
      updateTime: Date.now() 
    })
  }
  
  showModal.value = false
  window.$message?.success('便签已保存')
}

// 删除便签
const deleteNote = (id) => {
  const index = notes.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notes.value.splice(index, 1)
    window.$message?.success('便签已删除')
  }
}
</script>

<style scoped>
.note__layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.note-container {
  height: 100%;
  padding: 12px;
}

.all-notes {
  height: 100%;
}

.note-item {
  display: flex;
  flex-direction: column;
  height: 200px;
  padding: 12px;
  background-color: var(--note-bg-color);
  border-radius: 8px;
  border: 1px solid var(--note-border-color);
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--note-border-color);
}

.title {
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date {
  font-size: 12px;
  color: var(--note-date-color);
}

.content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.add-note {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: var(--note-add-bg-color);
}

.add-note:hover {
  background-color: var(--note-add-hover-color);
}

.not-note {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.tip {
  font-size: 16px;
  color: var(--note-tip-color);
}
</style>
