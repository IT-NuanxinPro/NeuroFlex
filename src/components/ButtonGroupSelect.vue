<template>
  <div class="button-group-select">
    <button
      v-for="option in options"
      :key="option.value"
      :class="['option-button', { active: modelValue === option.value }]"
      @click="selectOption(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true
    // 格式: [{ label: '显示文本', value: '值' }]
  }
})

const emit = defineEmits(['update:modelValue'])

function selectOption(value) {
  emit('update:modelValue', value)
}
</script>

<style lang="scss" scoped>
.button-group-select {
  @include button-grid(70px, $spacing-sm);
  width: 100%;

  .option-button {
    @include button-reset;
    @include click-feedback;
    min-width: 70px;
    padding: $spacing-md;
    border-radius: $radius-md;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-primary;
    font-weight: $font-medium;
    font-size: $font-base;
    transition: all $transition-base;
    text-align: center;

    @media (max-width: $breakpoint-sm) {
      flex: 1 1 auto;
      min-width: 0;
      font-size: $font-sm;
      padding: $spacing-sm $spacing-xs;
    }

    &.active {
      background: rgba(0, 212, 255, 0.1);
      border-color: $accent-primary;
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(0, 212, 255, 0.3);
    }

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
