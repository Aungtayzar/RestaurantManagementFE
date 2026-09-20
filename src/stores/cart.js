import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  const lines = ref([])

  const subtotal = computed(() =>
    lines.value.reduce((sum, line) => sum + line.price * line.quantity, 0),
  )
  const count = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0))

  function add(item, variant = null) {
    const key = `${item.id}:${variant?.id ?? 'base'}`
    const existing = lines.value.find((line) => line.key === key)
    if (existing) {
      existing.quantity++
      return
    }
    lines.value.push({
      key,
      menu_item_id: item.id,
      variant_id: variant?.id ?? null,
      name: item.name,
      variant_name: variant?.name ?? '',
      price: Number(variant?.price ?? item.base_price),
      quantity: 1,
      notes: '',
    })
  }
  function increment(key) {
    const line = lines.value.find((entry) => entry.key === key)
    if (line) line.quantity++
  }
  function decrement(key) {
    const line = lines.value.find((entry) => entry.key === key)
    if (!line) return
    if (line.quantity <= 1) remove(key)
    else line.quantity--
  }
  function remove(key) {
    lines.value = lines.value.filter((line) => line.key !== key)
  }
  function setNotes(key, notes) {
    const line = lines.value.find((entry) => entry.key === key)
    if (line) line.notes = notes
  }
  function clear() {
    lines.value = []
  }
  function toOrderItems() {
    return lines.value.map((line) => ({
      menu_item_id: line.menu_item_id,
      variant_id: line.variant_id,
      quantity: line.quantity,
      notes: line.notes.trim() || undefined,
    }))
  }

  return {
    lines,
    subtotal,
    count,
    add,
    increment,
    decrement,
    remove,
    setNotes,
    clear,
    toOrderItems,
  }
})
