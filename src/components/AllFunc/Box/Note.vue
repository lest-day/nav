<template>
  <div class="note__layout">
    <div class="add-btn-container">
      <n-button type="primary" @click="openAddModal" class="add-btn">
        <template #icon>
          <SvgIcon iconName="icon-add" />
        </template>
        添加便签
      </n-button>
    </div>

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
              v-for="note in sortedNotes"
              :key="note.id"
              class="note-item"
            >
              <div class="note-header">
                <span class="title">{{ note.title }}</span>
                <span class="date">{{ formatDate(note.updateTime) }}</span>
              </div>
              <div class="content" :title="note.content">{{ note.content }}</div>
              <div class="note-actions">
                <n-button text @click.stop="editNote(note)">
                  <SvgIcon iconName="icon-edit" size="16" />
                </n-button>
                <n-button text @click.stop="confirmDeleteNote(note)">
                  <SvgIcon iconName="icon-delete" size="16" />
                </n-button>
              </div>
            </n-grid-item>
          </n-grid>
        </n-scrollbar>
      </div>
      <div v-else class="not-note">
        <span class="tip">暂无便签，点击上方按钮添加</span>
      </div>
    </Transition>

    <!-- 添加/编辑便签模态框 -->
    <n-modal
      v-model:show="showModal"
      :title="currentNote.id ? '编辑便签' : '添加便签'"
      preset="dialog"
      style="width: 90%; max-width: 600px;"
      :mask-closable="false"
    >
      <n-form ref="noteFormRef">
        <n-form-item label="标题" path="title" required>
          <n-input 
            v-model:value="currentNote.title" 
            placeholder="便签标题"
            maxlength="30"
            show-count
            clearable
          />
        </n-form-item>
        <n-form-item label="内容" path="content">
          <n-input
            v-model:value="currentNote.content"
            type="textarea"
            placeholder="便签内容"
            :autosize="{
              minRows: 3,
              maxRows: 10
            }"
            maxlength="500"
            show-count
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="saveNote">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  NButton, 
  NScrollbar, 
  NGrid, 
  NGridItem, 
  NModal, 
  NForm, 
  NFormItem, 
  NInput,
  NSpace,
  useMessage,
  useDialog
} from 'naive-ui'
import SvgIcon from '@/components/SvgIcon.vue'

const message = useMessage()
const dialog = useDialog()

// 便签数据
const notes = ref(JSON.parse(localStorage.getItem('notes')) || [
  { 
    id: 1, 
    title: '欢迎使用便签', 
    content: '这是一个简单的便签示例，您可以编辑或删除它。长内容会自动显示省略号，鼠标悬停可查看完整内容。', 
    updateTime: Date.now()
  }
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
const noteFormRef = ref(null)

// 按更新时间排序的便签
const sortedNotes = computed(() => {
  return [...notes.value].sort((a, b) => b.updateTime - a.updateTime)
})

// 日期格式化
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
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

// 保存便签到localStorage
const saveToLocalStorage = () => {
  localStorage.setItem('notes', JSON.stringify(notes.value))
}

// 保存便签
const saveNote = () => {
  if (!currentNote.value.title.trim()) {
    message.warning('请输入便签标题')
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
      message.success('便签已更新')
    }
  } else {
    // 添加新便签
    const newId = notes.value.length > 0 
      ? Math.max(...notes.value.map(n => n.id)) + 1 
      : 1
    notes.value.push({ 
      ...currentNote.value, 
      id: newId,
      updateTime: Date.now() 
    })
    message.success('便签已添加')
  }
  
  saveToLocalStorage()
  showModal.value = false
}

// 确认删除便签
const confirmDeleteNote = (note) => {
  dialog.warning({
    title: '删除确认',
    content: `确定要删除便签"${note.title}"吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      deleteNote(note.id)
    }
  })
}

// 删除便签
const deleteNote = (id) => {
  const index = notes.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notes.value.splice(index, 1)
    saveToLocalStorage()
    message.success('便签已删除')
  }
}
</script>

<style scoped>
.note__layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.add-btn-container {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  margin-bottom: 16px;
}

.note-container {
  height: 100%;
  padding: 0 16px 16px;
  box-sizing: border-box;
}

.all-notes {
  height: 100%;
}

.note-item {
  display: flex;
  flex-direction: column;
  height: 220px;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.title {
  font-weight: 500;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.date {
  font-size: 12px;
  color: #757575;
  margin-left: 8px;
  white-space: nowrap;
}

.content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
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
}
</style>
