<template>
  <!-- 时钟和日期 -->
  <div
    :class="[
      'time-container',
      status.siteStatus,
      status.mainBoxBig && status.siteStatus !== 'normal' && status.siteStatus !== 'focus'
        ? 'hidden'
        : null,
      set.showLunar ? 'lunar' : null,
      set.timeStyle,
    ]"
    @click.stop
  >
    <!-- 时间显示 -->
    <div
      class="time"
      @click.stop="
        status.setSiteStatus(
          status.siteStatus !== 'normal' && status.siteStatus !== 'focus' ? 'normal' : 'box',
        )
      "
    >
      <span class="hour">{{ timeData.hour ?? "00" }}</span>
      <span class="separator" :key="set.showSeconds">:</span>
      <span class="minute">{{ timeData.minute ?? "00" }}</span>
      <Transition name="fade" mode="out-in">
        <span v-if="set.showSeconds" class="second">
          <span class="separator">:</span>
          <span class="second-num">{{ timeData.second ?? "00" }}</span>
        </span>
      </Transition>
      <template v-if="set.use12HourFormat">
        <span class="amPm">{{ timeData.amPm ?? "am" }}</span>
      </template>
    </div>

    <!-- 农历显示 -->
    <div v-if="set.showLunar" class="lunar">
      <span class="year">{{ timeData.lunar?.GanZhiYear }}</span>
      <span class="text">{{ timeData.lunar?.text }}</span>
    </div>

    <!-- 日期显示 -->
    <div class="date">
      <span class="month">{{ timeData.month ?? "0" }}</span>
      <span class="day">{{ timeData.day ?? "0" }}</span>
      <span class="weekday">{{ timeData.weekday ?? "星期八" }}</span>
    </div>
  </div>
</template>

<script setup>
import { getCurrentTime } from "@/utils/timeTools";
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { statusStore, setStore } from "@/stores";

const set = setStore();
const status = statusStore();

// 时间数据
const timeData = ref({});
const timeInterval = ref(null);

// 更新时间
const updateTimeData = () => {
  timeData.value = getCurrentTime(set.showZeroTime, set.use12HourFormat);
};

// 监听配置变化
watch(
  () => [set.showZeroTime, set.use12HourFormat],
  () => {
    updateTimeData();
  },
);

onMounted(() => {
  updateTimeData();
  timeInterval.value = setInterval(updateTimeData, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timeInterval.value);
});
</script>

<style lang="scss" scoped>
.time-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  transform: translateY(-140px);
  color: var(--main-text-color);
  animation: fade-time-in 0.6s cubic-bezier(0.21, 0.78, 0.36, 1);
  transition:
    transform 0.3s,
    opacity 0.5s,
    margin-bottom 0.3s;
  z-index: 1;

  .time {
    cursor: pointer;
    font-size: 3rem;
    margin: 6px 0px;
    text-shadow: var(--main-text-shadow);
    transition: transform 0.3s;

    .separator {
      opacity: 0.8;
      font-size: 2.8rem;
      display: inline-block;
      margin: 0 5px;
      transform: translateY(-4px);
      animation: separator-breathe 0.7s infinite alternate;
    }

    .amPm {
      font-size: 1rem;
      opacity: 0.6;
      margin-left: 6px;
    }

    &:hover {
      transform: scale(1.08);
    }

    &:active {
      transform: scale(1);
    }
  }

  .date {
    font-size: 1.15rem;
    opacity: 0.8;
    margin: 4px 0px;
    text-shadow: var(--main-text-shadow);

    .month::after {
      margin: 0 4px;
      content: "月";
    }

    .day::after {
      margin: 0 8px 0 4px;
      content: "日";
    }
  }

  .lunar {
    font-size: 0.9rem;
    opacity: 0.6;
    text-shadow: var(--main-text-shadow);

    .year::after {
      margin-right: 4px;
      content: "年";
    }
  }

  /* 状态切换动画 */
  &.focus {
    transform: translateY(-180px);
  }

  &.box,
  &.set {
    transform: translateY(-34vh);

    @media (max-width: 478px) {
      transform: translateY(-32vh);
    }
  }

  &.hidden {
    transform: translateY(-180px);
    opacity: 0;
  }

  &.lunar {
    margin-bottom: 50px;
  }

  /* 特殊时间样式（如两行显示） */
  &.two {
    padding-bottom: 30px;

    .time {
      display: flex;
      flex-direction: column;
      align-items: center;

      span {
        line-height: normal;
      }

      .separator,
      .second {
        display: none;
      }

      .hour::after {
        content: "/";
        font-size: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        opacity: 0.4;
        transform: rotate(50deg);
        margin: 12px 0;
      }
    }
  }
}

/* 动画定义 */
@keyframes fade-time-in {
  from {
    opacity: 0;
    transform: translateY(-100px);
  }
  to {
    opacity: 1;
    transform: translateY(-140px);
  }
}

@keyframes separator-breathe {
  from {
    opacity: 0.3;
  }
  to {
    opacity: 0.8;
  }
}
</style>
