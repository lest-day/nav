<template>
  <!-- 便签主布局 -->
  <div class="note__layout">
    <Transition name="fade" mode="out-in">
      <div v-if="noteData[0]" class="note-container">
        <n-scrollbar class="scrollbar">
          <n-grid
            class="all-notes"
            responsive="screen"
            cols="1 s:2 m:3 l:4"
            :x-gap="12"
            :y-gap="12"
          >
            <n-grid-item
              v-for="item in noteData"
              :key="item.id"
              class="note-item"
              @contextmenu="noteContextmenu($event, item)"
            >
              <div class="note-header">
                <span class="title">{{ item.title }}</span>
                <span class="date">{{ formatDate(item.updateTime) }}</span>
              </div>
              <div class="content" v-html="item.content"></div>
              <div class="note-footer">
                <n-button
                  text
                  class="edit-btn"
                  @click.stop="editNote(item)"
                >
                  <template #icon>
                    <SvgIcon iconName="icon-edit" />
                  </template>
                </n-button>
              </div>
            </n-grid-item>
            <n-grid-item
              class="note-item add-note"
              @click="addNoteModalOpen"
            >
              <SvgIcon iconName="icon-add" />
              <span class="add-text">添加便签</span>
            </n-grid-item>
          </n-grid>
        </n-scrollbar>
      </div>
      <div v-else class="not-note">
        <span class="tip">暂无便签，去添加吧</span>
        <n-button strong secondary @click="addNoteModalOpen">
          <template #icon>
            <SvgIcon iconName="icon-add" />
          </template>
          添加便签
        </n-button>
      </div>
    </Transition>
    <div class="footer__btn-group">
      <div class="footer__btn" @click="exportNotes">
        <SvgIcon iconName="icon-xiazai" />
        <span class="btnName">导出</span>
      </div>
      <div class="footer__btn" @click="clickFileDom">
        <input type="file" name="上传" id="noteUploadInput" accept=".json" />
        <SvgIcon iconName="icon-shangchuan" />
        <span class="btnName">导入</span>
      </div>
    </div>
  </div>

  <!-- 添加/编辑便签模态框 -->
  <n-modal
    preset="card"
    v-model:show="noteModalShow"
    :title="`${noteModalType ? '编辑' : '添加'}便签`"
    :bordered="false"
    style="width: 90%; max-width: 800px;"
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
          maxlength="30"
          v-model:value="noteFormValue.title"
          placeholder="请输入便签标题"
        />
      </n-form-item>
      <n-form-item label="内容" path="content">
        <RichTextEditor
          v-model:value="noteFormValue.content"
          placeholder="请输入便签内容..."
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button strong secondary @click="noteModalClose"> 取消 </n-button>
        <n-button strong secondary @click="saveNote">
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
    :on-clickoutside="
      () => {
        noteDropdownShow = false;
      }
    "
    @select="noteDropdownSelect"
  />
</template>

<script setup>
import { ref, nextTick, h, computed } from "vue";
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
} from "naive-ui";
import { storeToRefs } from "pinia";
import { noteStore } from "@/stores";
import SvgIcon from "@/components/SvgIcon.vue";
import RichTextEditor from "@/components/RichTextEditor.vue";

const noteStoreInstance = noteStore();
const { noteData } = storeToRefs(noteStoreInstance);

// 图标渲染
const renderIcon = (icon) => {
  return () => {
    return h(SvgIcon, { iconName: `icon-${icon}` }, null);
  };
};

// 日期格式化
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// 便签表单数据
const noteFormRef = ref(null);
const noteModalShow = ref(false);
const noteModalType = ref(false); // false 添加 / true 编辑
const noteFormValue = ref({
  id: null,
  title: "",
  content: "",
  updateTime: null,
});

// 表单验证规则
const noteFormRules = {
  id: {
    required: true,
    type: "number",
    message: "请输入合法 ID",
    trigger: ["input", "blur"],
  },
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

// 右键菜单数据
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
  {
    label: "置顶",
    key: "pin",
    icon: renderIcon("pin"),
  },
];

// 关闭模态框
const noteModalClose = () => {
  noteModalShow.value = false;
  noteFormValue.value = {
    id: null,
    title: "",
    content: "",
    updateTime: null,
  };
};

// 打开添加便签模态框
const addNoteModalOpen = () => {
  // 生成ID
  const noteMaxID = noteData.value.reduce((max, item) => {
    return item.id > max ? item.id : max;
  }, -1);
  
  // 初始化表单数据
  noteFormValue.value = {
    id: noteMaxID + 1,
    title: "",
    content: "",
    updateTime: Date.now(),
  };
  
  noteModalType.value = false;
  noteModalShow.value = true;
};

// 编辑便签
const editNote = (note) => {
  noteFormValue.value = {
    id: note.id,
    title: note.title,
    content: note.content,
    updateTime: Date.now(),
  };
  noteModalType.value = true;
  noteModalShow.value = true;
};

// 保存便签
const saveNote = () => {
  noteFormRef.value?.validate((errors) => {
    if (errors) {
      $message.error("请检查您的输入");
      return false;
    }
    
    if (!noteModalType.value) {
      // 添加新便签
      noteData.value.push({
        ...noteFormValue.value,
        updateTime: Date.now(),
      });
      $message.success("便签添加成功");
    } else {
      // 更新现有便签
      const index = noteData.value.findIndex(item => item.id === noteFormValue.value.id);
      if (index !== -1) {
        noteData.value[index] = {
          ...noteFormValue.value,
          updateTime: Date.now(),
        };
        $message.success("便签更新成功");
      }
    }
    
    noteModalClose();
  });
};

// 删除便签
const deleteNote = () => {
  const deleteId = noteFormValue.value.id;
  if (typeof deleteId === "number") {
    const indexToRemove = noteData.value.findIndex(item => item.id === deleteId);
    if (indexToRemove !== -1) {
      noteData.value.splice(indexToRemove, 1);
      $message.success("便签删除成功");
      return true;
    }
  }
  $message.error("便签删除失败，请重试");
};

// 置顶便签
const pinNote = () => {
  const pinId = noteFormValue.value.id;
  if (typeof pinId === "number") {
    const index = noteData.value.findIndex(item => item.id === pinId);
    if (index !== -1) {
      const pinnedNote = noteData.value.splice(index, 1)[0];
      noteData.value.unshift(pinnedNote);
      $message.success("便签已置顶");
      return true;
    }
  }
  $message.error("便签置顶失败，请重试");
};

// 右键菜单触发
const noteContextmenu = (e, note) => {
  e.preventDefault();
  noteDropdownShow.value = false;
  
  // 设置当前操作的便签数据
  noteFormValue.value = {
    id: note.id,
    title: note.title,
    content: note.content,
    updateTime: note.updateTime,
  };
  
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
      editNote(noteFormValue.value);
      break;
    case "delete":
      $dialog.warning({
        title: "删除便签",
        content: `确认删除 "${noteFormValue.value.title}" 便签？此操作将无法恢复！`,
        positiveText: "删除",
        negativeText: "取消",
        onPositiveClick: () => {
          deleteNote();
        },
      });
      break;
    case "pin":
      pinNote();
      break;
    default:
      break;
  }
};

// 导出便签
const exportNotes = () => {
  if (!noteData.value.length) {
    $message.warning("没有可导出的便签");
    return;
  }
  
  // 准备导出数据
  const exportData = {
    version: "1.0",
    createdAt: Date.now(),
    notes: noteData.value,
  };
  
  // 创建Blob对象
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  // 创建下载链接
  const a = document.createElement("a");
  a.href = url;
  a.download = `便签备份_${formatDate(Date.now())}.json`;
  a.click();
  
  // 释放URL对象
  URL.revokeObjectURL(url);
};

// 导入便签
const importNotes = (file) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.notes || !Array.isArray(data.notes)) {
        $message.error("导入的文件格式不正确");
        return;
      }
      
      // 合并导入的便签
      const newNotes = data.notes.filter(note => 
        note.title && note.content && 
        !noteData.value.some(existing => 
          existing.title === note.title && existing.content === note.content
        )
      );
      
      if (newNotes.length === 0) {
        $message.warning("没有新的便签可导入");
        return;
      }
      
      // 计算新的ID
      const maxId = noteData.value.reduce((max, item) => Math.max(max, item.id), 0);
      newNotes.forEach((note, index) => {
        note.id = maxId + index + 1;
        note.updateTime = note.updateTime || Date.now();
      });
      
      noteData.value.push(...newNotes);
      $message.success(`成功导入 ${newNotes.length} 条便签`);
    } catch (error) {
      $message.error("导入失败: " + error.message);
    }
  };
  
  reader.onerror = () => {
    $message.error("文件读取失败");
  };
  
  reader.readAsText(file);
};

// 文件上传处理
const clickFileDom = () => {
  const fileDom = document.querySelector("#noteUploadInput");
  if (fileDom) {
    fileDom.value = ""; // 清除之前的选择
    fileDom.click();
  }
};

// 初始化文件上传监听
onMounted(() => {
  document.querySelector("#noteUploadInput")?.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      importNotes(e.target.files[0]);
    }
  });
});

onBeforeUnmount(() => {
  document.querySelector("#noteUploadInput")?.removeEventListener("change");
});
</script>

<style lang="scss" scoped>
.note__layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  
  .note-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    
    .all-notes {
      padding: 16px;
      box-sizing: border-box;
      
      .note-item {
        display: flex;
        flex-direction: column;
        height: 240px;
        padding: 16px;
        background-color: var(--main-background-light-color);
        border-radius: 8px;
        transition: all 0.3s;
        cursor: pointer;
        position: relative;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--divider-color);
          
          .title {
            font-size: 16px;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }
          
          .date {
            font-size: 12px;
            color: var(--text-color-secondary);
            margin-left: 8px;
          }
        }
        
        .content {
          flex: 1;
          overflow: hidden;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-color);
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 8;
          -webkit-box-orient: vertical;
          text-overflow: ellipsis;
        }
        
        .note-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
          
          .edit-btn {
            opacity: 0;
            transition: opacity 0.2s;
          }
        }
        
        &:hover .note-footer .edit-btn {
          opacity: 1;
        }
      }
      
      .add-note {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: var(--main-background-hover-color);
        
        .i-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .add-text {
          font-size: 14px;
        }
        
        &:hover {
          background-color: var(--main-background-light-color);
        }
      }
    }
  }
  
  .not-note {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    
    .tip {
      font-size: 18px;
      margin-bottom: 20px;
      color: var(--text-color-secondary);
    }
  }
  
  .footer__btn-group {
    display: flex;
    padding: 16px;
    border-top: 1px solid var(--divider-color);
    
    .footer__btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      width: 80px;
      height: 40px;
      background-color: var(--main-background-light-color);
      cursor: pointer;
      font-size: 14px;
      
      .i-icon {
        margin-right: 6px;
      }
      
      #noteUploadInput {
        display: none;
      }
    }
    
    div + div {
      margin-left: 12px;
    }
  }
}
</style>
