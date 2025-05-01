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
              v-for="note in notesData"
              :key="note.id"
              class="note-item"
              @contextmenu="noteContextmenu($event, note)"
            >
              <div class="note-header">
                <span class="title">{{ note.title }}</span>
                <span class="date">{{ formatDate(note.updatedAt) }}</span>
              </div>
              <div class="content">{{ note.content }}</div>
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
    <div class="footer__btn-group">
      <div class="footer__btn" @click="exportNotes">
        <SvgIcon iconName="icon-xiazai" />
        <span class="btnName">导出</span>
      </div>
      <div class="footer__btn" @click="clickFileDom">
        <input type="file" name="上传" id="notesUploadInput" accept=".json" />
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
    :on-clickoutside="() => (noteDropdownShow = false)"
    @select="noteDropdownSelect"
  />
</template>

<script setup>
import { ref, nextTick, h } from "vue";
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
import SvgIcon from "@/components/SvgIcon.vue";

// 图标渲染
const renderIcon = (icon) => {
  return () => {
    return h(SvgIcon, { iconName: `icon-${icon}` }, null);
  };
};

// 便签数据
const notesData = ref([
  // 示例数据
  // {
  //   id: 1,
  //   title: "欢迎使用",
  //   content: "这是一个便签示例，右键点击可以编辑或删除",
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // },
]);

// 日期格式化
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};

// 表单相关
const noteFormRef = ref(null);
const noteModalShow = ref(false);
const noteModalType = ref(false); // false 添加 / true 编辑
const noteFormValue = ref({
  id: null,
  title: "",
  content: "",
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
      return false;
    }

    const now = new Date();
    noteFormValue.value.updatedAt = now;

    if (!noteModalType.value) {
      // 添加新便签
      noteFormValue.value.createdAt = now;
      notesData.value.push({ ...noteFormValue.value });
    } else {
      // 更新便签
      const index = notesData.value.findIndex((item) => item.id === noteFormValue.value.id);
      if (index !== -1) {
        notesData.value[index] = { ...noteFormValue.value };
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
  const index = notesData.value.findIndex((item) => item.id === noteFormValue.value.id);
  if (index !== -1) {
    notesData.value.splice(index, 1);
  }
};

// 导出便签
const exportNotes = () => {
  const dataStr = JSON.stringify(notesData.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const dataUrl = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `notes_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(dataUrl);
};

// 导入便签
onMounted(() => {
  document.querySelector("#notesUploadInput")?.addEventListener("change", importNotes);
});

onBeforeUnmount(() => {
  document.querySelector("#notesUploadInput")?.removeEventListener("change", importNotes);
});

const importNotes = function () {
  if (this.files && this.files[0]) {
    const fileReader = new FileReader();
    fileReader.readAsText(this.files[0]);
    fileReader.onload = function () {
      try {
        const importedNotes = JSON.parse(fileReader.result);
        if (Array.isArray(importedNotes)) {
          // 生成新的ID避免冲突
          const maxId = notesData.value.reduce((max, item) => Math.max(max, item.id), 0);
          importedNotes.forEach((note, index) => {
            note.id = maxId + index + 1;
            note.createdAt = note.createdAt || new Date();
            note.updatedAt = note.updatedAt || new Date();
          });
          notesData.value.push(...importedNotes);
        }
      } catch (e) {
        console.error("导入失败", e);
      }
    };
  }
};

const clickFileDom = () => {
  const fileDom = document.querySelector("#notesUploadInput");
  fileDom?.click();
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
    height: 100%;
    overflow-y: auto;
    
    .all-notes {
      padding: 20px;
      box-sizing: border-box;
      
      .note-item {
        cursor: pointer;
        min-height: 120px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        background-color: var(--main-background-light-color);
        border-radius: 8px;
        transition: 
          background-color 0.3s,
          box-shadow 0.3s;
        
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
          }
          
          .date {
            font-size: 12px;
            color: var(--text-color-2);
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
    height: 100%;
    
    .tip {
      font-size: 24px;
      margin-bottom: 20px;
    }
  }
  
  .footer__btn-group {
    display: flex;
    padding: 15px 0;
    padding-left: 20px;
    
    .footer__btn {
      border-radius: 8px;
      width: 80px;
      height: 40px;
      background-color: var(--main-background-light-color);
      line-height: 40px;
      text-align: center;
      cursor: pointer;
      font-size: 16px;
      
      #notesUploadInput {
        display: none;
      }
    }
    
    div + div {
      margin-left: 10px;
    }
  }
}
</style>
