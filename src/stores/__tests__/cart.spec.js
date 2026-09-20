import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../cart'

const item = { id: 4, name: 'Lava Cake', base_price: '6.99' }
const variant = { id: 8, name: 'Single', price: '7.50' }

describe('cart store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('merges identical item/variant lines and totals variant prices', () => {
    const cart = useCartStore()
    cart.add(item, variant)
    cart.add(item, variant)
    cart.add(item)
    expect(cart.lines).toHaveLength(2)
    expect(cart.count).toBe(3)
    expect(cart.subtotal).toBeCloseTo(21.99)
  })

  it('decrements to removal and builds the order items', () => {
    const cart = useCartStore()
    cart.add(item, variant)
    cart.setNotes(cart.lines[0].key, ' No sugar ')
    expect(cart.toOrderItems()).toEqual([
      { menu_item_id: 4, variant_id: 8, quantity: 1, notes: 'No sugar' },
    ])
    cart.decrement(cart.lines[0].key)
    expect(cart.lines).toEqual([])
  })
})
