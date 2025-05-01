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
        <n-scrollbar class="scrollbar" :trigger="none">
          <n-grid
            class="all-notes"
            responsive="screen"
            :cols="gridCols"
            :x-gap="12"
            :y-gap="12"
          >
            <n-grid-item
              v-for="note in sortedNotes"
              :key="note.id"
              class="note-item"
              @click="handleNoteClick(note)"
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
        <n-empty description="暂无便签">
          <template #extra>
            <n-button size="small" @click="openAddModal">
              添加便签
            </n-button>
          </template>
        </n-empty>
      </div>
    </Transition>

    <!-- 添加/编辑便签模态框 -->
    <n-modal
      v-model:show="showModal"
      :title="currentNote.id ? '编辑便签' : '添加便签'"
      preset="dialog"
      style="width: 90%; max-width: 600px;"
      :mask-closable="false"
      @after-leave="resetForm"
    >
      <n-form 
        ref="noteFormRef" 
        :model="currentNote" 
        :rules="formRules"
      >
        <n-form-item label="标题" path="title">
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
          <n-button 
            type="primary" 
            @click="handleSubmit"
            :loading="isSubmitting"
          >
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
  NEmpty,
  useMessage,
  useDialog,
  useBreakpoints
} from 'naive-ui'
import SvgIcon from '@/components/SvgIcon.vue'

const message = useMessage()
const dialog = useDialog()
const breakpoints = useBreakpoints()

// 响应式列数
const gridCols = computed(() => {
  if (breakpoints.value.small) return '2'
  if (breakpoints.value.medium) return '3'
  if (breakpoints.value.large) return '4'
  return '1'
})

// 便签数据
const notes = ref([])
const isSubmitting = ref(false)

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

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入便签标题', trigger: 'blur' },
    { min: 1, max: 30, message: '标题长度应在1-30个字符之间', trigger: 'blur' }
  ],
  content: [
    { max: 500, message: '内容不能超过500个字符', trigger: 'blur' }
  ]
}

// 初始化数据
const initNotes = () => {
  const savedNotes = localStorage.getItem('notes')
  notes.value = savedNotes ? JSON.parse(savedNotes) : [
    { 
      id: 1, 
      title: '欢迎使用便签', 
      content: '这是一个简单的便签示例，您可以编辑或删除它。长内容会自动显示省略号，鼠标悬停可查看完整内容。', 
      updateTime: Date.now()
    }
  ]
}

// 按更新时间排序的便签
const sortedNotes = computed(() => {
  return [...notes.value].sort((a, b) => b.updateTime - a.updateTime)
})

// 日期格式化
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 保存便签到localStorage
const saveToLocalStorage = () => {
  localStorage.setItem('notes', JSON.stringify(notes.value))
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

// 处理便签点击
const handleNoteClick = (note) => {
  editNote(note)
}

// 提交表单
const handleSubmit = () => {
  noteFormRef.value?.validate(async (errors) => {
    if (!errors) {
      isSubmitting.value = true
      try {
        await saveNote()
        showModal.value = false
      } finally {
        isSubmitting.value = false
      }
    }
  })
}

// 保存便签
const saveNote = () => {
  return new Promise((resolve) => {
    setTimeout(() => { // 模拟异步操作
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
      resolve()
    }, 300)
  })
}

// 重置表单
const resetForm = () => {
  noteFormRef.value?.restoreValidation()
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

// 初始化
onMounted(() => {
  initNotes()
})
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
  height: calc(100% - 68px);
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
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  background-color: var(--n-color);
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.note-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--n-border-color);
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
  color: var(--n-text-color-secondary);
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
  color: var(--n-text-color);
}

.note-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--n-border-color);
}

.not-note {
  height: calc(100% - 68px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
