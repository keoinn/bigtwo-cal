<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    unit?: string
  }>(),
  {
    min: 0,
    max: 9999,
    step: 1,
    unit: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function clamp(value: number) {
  return Math.max(props.min, Math.min(props.max, value))
}

function adjust(delta: number) {
  emit('update:modelValue', clamp(props.modelValue + delta))
}

function onInput(event: Event) {
  const raw = parseInt((event.target as HTMLInputElement).value) || 0
  emit('update:modelValue', clamp(raw))
}
</script>

<template>
  <div class="stepper-input">
    <button
      type="button"
      class="step-btn"
      :disabled="modelValue <= min"
      @click="adjust(-step)"
    >
      −
    </button>
    <input
      type="number"
      inputmode="numeric"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="onInput"
    />
    <button
      type="button"
      class="step-btn"
      :disabled="modelValue >= max"
      @click="adjust(step)"
    >
      +
    </button>
    <span v-if="unit" class="unit">{{ unit }}</span>
  </div>
</template>

<style scoped>
.stepper-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-btn {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--text);
}

.step-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper-input input {
  width: 4rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
}

.unit {
  font-size: 1rem;
  color: var(--text-muted);
}
</style>
