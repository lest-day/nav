<template>
  <n-tabs class="all-box" size="large" justify-content="space-evenly" animated>
    <n-tab-pane class="no-padding height--full" name="link" tab="快链">
      <ShortCut />
    </n-tab-pane>
    <n-tab-pane name="note" tab="便签">
      
    </n-tab-pane>
    <n-tab-pane name="more" tab="待办">

    </n-tab-pane>
  </n-tabs>
</template>

<script setup>
import { NTabs, NTabPane } from "naive-ui";
import ShortCut from "@/components/AllFunc/Box/ShortCut.vue";
</script>
<style>
.height--full {
  height: 100%;
}
</style>