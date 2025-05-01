<template>
  <div class="rich-text-editor">
    <!-- 工具栏 -->
    <div v-if="editor" class="toolbar">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
      >
        <span class="icon">B</span>
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
      >
        <span class="icon">I</span>
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
      >
        <span class="icon">H2</span>
      </button>
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
      >
        <span class="icon">•</span>
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
      >
        <span class="icon">1.</span>
      </button>
      <button
        @click="setLink"
        :class="{ 'is-active': editor.isActive('link') }"
      >
        <span class="icon">🔗</span>
      </button>
      <button @click="editor.chain().focus().undo().run()">
        <span class="icon">↩️</span>
      </button>
      <button @click="editor.chain().focus().redo().run()">
        <span class="icon">↪️</span>
      </button>
    </div>

    <!-- 编辑器内容区 -->
    <editor-content :editor="editor" class="content" />
  </div>
</template>

<script>
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export default {
  name: "RichTextEditor",
  components: {
    EditorContent,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const editor = useEditor({
      content: props.modelValue,
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
        }),
      ],
      onUpdate: () => {
        emit("update:modelValue", editor.getHTML());
      },
    });

    const setLink = () => {
      const previousUrl = editor.getAttributes("link").href;
      const url = window.prompt("输入链接 URL", previousUrl);

      if (url === null) return;
      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }

      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    return {
      editor,
      setLink,
    };
  },
};
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.toolbar {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}

.toolbar button {
  background: #f5f5f5;
  border: none;
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
}

.toolbar button.is-active {
  background: #ddd;
}

.content {
  min-height: 100px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}
</style>
