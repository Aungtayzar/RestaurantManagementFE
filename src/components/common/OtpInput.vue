<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  length: { type: Number, default: 6 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const inputs = ref([])
const digits = ref([])

onMounted(() => {
  digits.value = props.modelValue.split('').slice(0, props.length)
  while (digits.value.length < props.length) {
    digits.value.push('')
  }
  setTimeout(() => inputs.value[0]?.focus(), 0)
})

watch(
  () => props.modelValue,
  (val) => {
    digits.value = val.split('').slice(0, props.length)
    while (digits.value.length < props.length) {
      digits.value.push('')
    }
  },
)

function handleInput(index, event) {
  const value = event.target.value
  if (!/^\d*$/.test(value)) {
    event.target.value = digits.value[index]
    return
  }

  digits.value[index] = value.slice(-1)
  event.target.value = digits.value[index]

  if (value && index < props.length - 1) {
    inputs.value[index + 1]?.focus()
  }

  emitValue()
}

function handleKeydown(index, event) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  }
}

function handlePaste(event) {
  event.preventDefault()
  const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, props.length)
  if (!pasted) return

  for (let i = 0; i < props.length; i++) {
    digits.value[i] = pasted[i] || ''
  }

  const focusIndex = Math.min(pasted.length, props.length - 1)
  inputs.value[focusIndex]?.focus()

  emitValue()
}

function emitValue() {
  emit('update:modelValue', digits.value.join(''))
}
</script>

<template>
  <div class="flex gap-2">
    <input
      v-for="(_, index) in length"
      :key="index"
      :ref="(el) => (inputs[index] = el)"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :value="digits[index]"
      :aria-label="`Digit ${index + 1} of ${length}`"
      :disabled="disabled"
      class="border-secondary-300 text-secondary-900 focus:border-primary-500 focus:ring-primary-100 h-12 w-12 rounded-lg border text-center text-lg font-semibold focus:ring-2 focus:outline-none disabled:bg-secondary-50 disabled:text-secondary-400 disabled:cursor-not-allowed"
      @input="handleInput(index, $event)"
      @keydown="handleKeydown(index, $event)"
      @paste="handlePaste"
    />
  </div>
</template>
