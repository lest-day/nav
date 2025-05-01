<template>
  <!-- 便签主布局 -->
  <div class="notes__layout">
    <Transition name="fade" mode="out-in">
      <div v-if="notesData[0]" class="notes-container">
        <n-scrollbar class="scrollbar">
          <n-grid
            class="all-notes"
            responsive="screen"
            cols="1 s:2 m:3 l:4"
            :x-gap="12"
            :y-gap="12"
          >
            <n-grid-item
              v-for="note in filteredNotes"
              :key="note.id"
              class="note-item"
              :style="{ backgroundColor: note.color || '' }"
              @contextmenu="noteContextmenu($event, note)"
            >
              <div class="note-header">
                <span class="title">{{ note.title }}</span>
                <span class="date">{{ formatDate(note.updatedAt) }}</span>
              </div>
              <div class="content">{{ note.content }}</div>
              <div v-if="note.tags?.length" class="tags">
                <n-tag
                  v-for="tag in note.tags"
                  :key="tag"
                  size="small"
                  type="info"
                  style="margin-right: 4px"
                >
                  {{ tag }}
                </n-tag>
              </div>
            </n-grid-item>
            <n-grid-item
              class="note-item add-note"
              @click="addNoteModalOpen"
            >
              <SvgIcon iconName="icon-add" />
              <span class="name">添加便签</span>
            </n-grid-item>
          </n-grid>
        </n-scrollbar>
      </div>
      <div v-else class="no-notes">
        <span class="tip">暂无便签，去添加吧</span>
        <n-button strong secondary @click="addNoteModalOpen">
          <template #icon>
            <SvgIcon iconName="icon-add" />
          </template>
          添加便签
        </n-button>
      </div>
    </Transition>

    <!-- 操作栏 -->
    <div class="action-bar">
      <n-input
        v-model:value="searchQuery"
        placeholder="搜索便签..."
        clearable
        style="max-width: 300px; margin-right: 15px"
      >
        <template #prefix>
          <SvgIcon iconName="icon-search" />
        </template>
      </n-input>
      
      <n-select
        v-model:value="selectedTag"
        :options="tagOptions"
        placeholder="按标签筛选"
        clearable
        style="width: 150px; margin-right: 15px"
      />
      
      <div class="footer__btn-group">
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="footer__btn" @click="exportNotes">
              <SvgIcon iconName="icon-xiazai" />
              <span class="btnName">导出</span>
            </div>
          </template>
          导出为JSON文件
        </n-tooltip>
        
        <n-tooltip trigger="hover">
          <template #trigger>
            <div class="footer__btn" @click="clickFileDom">
              <input type="file" name="上传" id="notesUploadInput" accept=".json" />
              <SvgIcon iconName="icon-shangchuan" />
              <span class="btnName">导入</span>
            </div>
          </template>
          从JSON文件导入
        </n-tooltip>
      </div>
    </div>
  </div>

  <!-- 添加/编辑便签模态框 -->
  <n-modal
    preset="card"
    v-model:show="noteModalShow"
    :title="`${noteModalType ? '编辑' : '添加'}便签`"
    :bordered="false"
    style="max-width: 600px"
    @mask-click="noteModalClose"
  >
    <n-form
      ref="noteFormRef"
      :rules="noteFormRules"
      :model="noteFormValue"
      :label-width="80"
    >
      <n-form-item label="ID" path="id">
        <n-input-number
          disabled
          placeholder="自动生成ID"
          v-model:value="noteFormValue.id"
          style="width: 100%"
          :show-button="false"
        />
      </n-form-item>
      <n-form-item label="标题" path="title">
        <n-input
          clearable
          show-count
          maxlength="20"
          v-model:value="noteFormValue.title"
          placeholder="请输入便签标题"
        />
      </n-form-item>
      <n-form-item label="内容" path="content">
        <n-input
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 8 }"
          clearable
          show-count
          maxlength="500"
          v-model:value="noteFormValue.content"
          placeholder="请输入便签内容"
        />
      </n-form-item>
      <n-form-item label="标签" path="tags">
        <n-dynamic-tags v-model:value="noteFormValue.tags" />
      </n-form-item>
      <n-form-item label="颜色" path="color">
        <n-color-picker
          v-model:value="noteFormValue.color"
          :swatches="['#FFFFFF', '#FFF1F0', '#FFF2E8', '#FEF7E8', '#FBFFE8', '#F8FFE8', '#F0FFE8', '#E8FFEE', '#E8FFF7', '#E8FFFF', '#E8F7FF', '#E8EEFF', '#F0E8FF', '#F7E8FF', '#FFE8F7', '#FFE8EE']"
          :show-alpha="false"
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button strong secondary @click="noteModalClose"> 取消 </n-button>
        <n-button strong secondary type="primary" @click="saveNote">
          {{ noteModalType ? "保存" : "添加" }}
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- 便签右键菜单 -->
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    size="large"
    :x="noteDropdownX"
    :y="noteDropdownY"
    :options="noteDropdownOptions"
    :show="noteDropdownShow"
    :on-clickoutside="() => (noteDropdownShow = false)"
    @select="noteDropdownSelect"
  />
</template>

<script setup>
import { ref, computed, nextTick, h, watch } from "vue";
import {
  NButton,
  NScrollbar,
  NGrid,
  NGridItem,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NDropdown,
  NTag,
  NSelect,
  NColorPicker,
  NDynamicTags,
  NTooltip,
  useMessage,
  useDialog
} from "naive-ui";
import { debounce } from "lodash-es";
import SvgIcon from "@/components/SvgIcon.vue";

const message = useMessage();
const dialog = useDialog();

// 图标渲染
const renderIcon = (icon) => {
  return () => {
    return h(SvgIcon, { iconName: `icon-${icon}` }, null);
  };
};

// 便签数据（从localStorage初始化）
const notesData = ref(loadFromLocalStorage());
const searchQuery = ref("");
const selectedTag = ref(null);

// 标签选项（从现有便签自动生成）
const tagOptions = computed(() => {
  const tags = new Set();
  notesData.value.forEach(note => {
    if (note.tags) {
      note.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags).map(tag => ({
    label: tag,
    value: tag
  }));
});

// 筛选便签
const filteredNotes = computed(() => {
  return notesData.value.filter(note => {
    const matchesSearch = searchQuery.value === "" || 
      note.title.includes(searchQuery.value) || 
      note.content.includes(searchQuery.value);
    
    const matchesTag = selectedTag.value === null || 
      (note.tags && note.tags.includes(selectedTag.value));
    
    return matchesSearch && matchesTag;
  });
});

// 日期格式化
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};

// 加载本地数据
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('notes');
    if (!saved) return [];
    
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) 
      ? parsed.map(note => ({
          ...note,
          createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
          tags: note.tags || []
        }))
      : [];
  } catch (e) {
    console.error("加载便签失败:", e);
    message.error("加载便签数据失败");
    return [];
  }
}

// 保存到本地（使用防抖）
const saveToLocalStorage = debounce(() => {
  try {
    localStorage.setItem('notes', JSON.stringify(notesData.value));
  } catch (e) {
    console.error("保存便签失败:", e);
    message.error("保存便签失败，可能已超出存储限制");
  }
}, 500);

// 自动保存监听
watch(notesData, saveToLocalStorage, { deep: true });

// 表单相关
const noteFormRef = ref(null);
const noteModalShow = ref(false);
const noteModalType = ref(false); // false 添加 / true 编辑
const noteFormValue = ref({
  id: null,
  title: "",
  content: "",
  tags: [],
  color: "",
  createdAt: null,
  updatedAt: null,
});

const noteFormRules = {
  title: {
    required: true,
    message: "请输入标题",
    trigger: ["input", "blur"],
  },
  content: {
    required: true,
    message: "请输入内容",
    trigger: ["input", "blur"],
  },
};

// 右键菜单相关
const noteDropdownX = ref(0);
const noteDropdownY = ref(0);
const noteDropdownShow = ref(false);
const noteDropdownOptions = [
  {
    label: "编辑",
    key: "edit",
    icon: renderIcon("edit"),
  },
  {
    label: "删除",
    key: "delete",
    icon: renderIcon("delete-1"),
  },
];

// 关闭模态框
const noteModalClose = () => {
  noteModalShow.value = false;
  noteFormValue.value = {
    id: null,
    title: "",
    content: "",
    tags: [],
    color: "",
    createdAt: null,
    updatedAt: null,
  };
};

// 打开添加便签模态框
const addNoteModalOpen = () => {
  // 生成ID
  const maxId = notesData.value.reduce((max, item) => Math.max(max, item.id), 0);
  noteFormValue.value = {
    id: maxId + 1,
    title: "",
    content: "",
    tags: [],
    color: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  noteModalType.value = false;
  noteModalShow.value = true;
};

// 保存便签
const saveNote = () => {
  noteFormRef.value?.validate((errors) => {
    if (errors) {
      message.error("请检查表单填写是否正确");
      return false;
    }

    const now = new Date();
    noteFormValue.value.updatedAt = now;

    if (!noteModalType.value) {
      // 添加新便签
      noteFormValue.value.createdAt = now;
      notesData.value.push({ ...noteFormValue.value });
      message.success("便签添加成功");
    } else {
      // 更新便签
      const index = notesData.value.findIndex(item => item.id === noteFormValue.value.id);
      if (index !== -1) {
        notesData.value[index] = { ...noteFormValue.value };
        message.success("便签更新成功");
      }
    }

    noteModalClose();
    return true;
  });
};

// 右键菜单
const noteContextmenu = (e, note) => {
  e.preventDefault();
  noteDropdownShow.value = false;
  noteFormValue.value = { ...note };
  nextTick().then(() => {
    noteDropdownShow.value = true;
    noteDropdownX.value = e.clientX;
    noteDropdownY.value = e.clientY;
  });
};

// 右键菜单选择
const noteDropdownSelect = (key) => {
  noteDropdownShow.value = false;
  switch (key) {
    case "edit":
      noteModalType.value = true;
      noteModalShow.value = true;
      break;
    case "delete":
      deleteNote();
      break;
  }
};

// 删除便签
const deleteNote = () => {
  dialog.warning({
    title: "删除确认",
    content: `确定要删除便签"${noteFormValue.value.title}"吗？此操作不可恢复！`,
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: () => {
      const index = notesData.value.findIndex(item => item.id === noteFormValue.value.id);
      if (index !== -1) {
        notesData.value.splice(index, 1);
        message.success("便签已删除");
      }
    }
  });
};

// 导出便签
const exportNotes = () => {
  try {
    const data = {
      version: 1,
      createdAt: new Date().toISOString(),
      notes: notesData.value
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const dataUrl = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `notes_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(dataUrl);
    
    message.success("便签导出成功，已下载到您的设备");
  } catch (e) {
    console.error("导出失败:", e);
    message.error("便签导出失败");
  }
};

// 导入便签
const importNotes = function() {
  if (!this.files?.[0]) return;

  const fileReader = new FileReader();
  fileReader.readAsText(this.files[0]);
  fileReader.onload = () => {
    try {
      const data = JSON.parse(fileReader.result);
      
      // 验证数据结构
      if (!data?.notes || !Array.isArray(data.notes) || !data.notes.every(item => 
        typeof item?.id === 'number' && 
        item?.title && 
        item?.content
      )) {
        throw new Error("无效的便签数据格式");
      }

      dialog.info({
        title: "导入确认",
        content: `确定要导入 ${data.notes.length} 条便签吗？`,
        positiveText: "导入",
        negativeText: "取消",
        onPositiveClick: () => {
          // 合并数据（处理ID冲突）
          const maxId = notesData.value.reduce((max, item) => Math.max(max, item.id), 0);
          const newNotes = data.notes.map((note, i) => ({
            ...note,
            id: maxId + i + 1,
            createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
            updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
            tags: note.tags || [],
            color: note.color || ""
          }));

          notesData.value = [...notesData.value, ...newNotes];
          message.success(`成功导入 ${newNotes.length} 条便签`);
        }
      });
    } catch (e) {
      console.error("导入失败:", e);
      message.error(`导入失败: ${e.message}`);
    }
  };
};

const clickFileDom = () => {
  const fileDom = document.querySelector("#notesUploadInput");
  if (fileDom) {
    fileDom.value = ""; // 允许重复选择同一文件
    fileDom.click();
  }
};
</script>

<style lang="scss" scoped>
.notes__layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  
  .notes-container {
    width: 100%;
    height: calc(100% - 60px);
    overflow-y: auto;
    
    .all-notes {
      padding: 20px;
      box-sizing: border-box;
      
      .note-item {
        cursor: pointer;
        min-height: 140px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        background-color: var(--main-background-light-color);
        border-radius: 8px;
        transition: 
          background-color 0.3s,
          box-shadow 0.3s;
        border: 1px solid var(--divider-color);
        
        .note-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid var(--divider-color);
          
          .title {
            font-weight: bold;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }
          
          .date {
            font-size: 12px;
            color: var(--text-color-2);
            margin-left: 10px;
          }
        }
        
        .content {
          flex: 1;
          font-size: 14px;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 8px;
        }
        
        .tags {
          margin-top: auto;
          display: flex;
          flex-wrap: wrap;
        }
        
        &:hover {
          background-color: var(--main-background-hover-color);
          box-shadow: 0 0 0 2px var(--main-background-hover-color);
        }
      }
      
      .add-note {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        border: 1px dashed var(--divider-color);
        
        .i-icon {
          width: 1rem;
          margin-right: 6px;
          font-size: 20px;
          opacity: 1;
        }
        
        .name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
  
  .no-notes {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100% - 60px);
    
    .tip {
      font-size: 24px;
      margin-bottom: 20px;
    }
  }
  
  .action-bar {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border-top: 1px solid var(--divider-color);
    background-color: var(--main-background-light-color);
    
    .footer__btn-group {
      display: flex;
      margin-left: auto;
      
      .footer__btn {
        border-radius: 8px;
        width: 80px;
        height: 40px;
        background-color: var(--main-background-light-color);
        line-height: 40px;
        text-align: center;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        #notesUploadInput {
          display: none;
        }
        
        .i-icon {
          margin-right: 5px;
        }
      }
      
      div + div {
        margin-left: 10px;
      }
    }
  }
}
</style>
