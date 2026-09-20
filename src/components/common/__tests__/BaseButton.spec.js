import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../BaseButton.vue'

describe('BaseButton', () => {
  it('renders a primary md button by default', () => {
    const w = mount(BaseButton, { slots: { default: 'Save' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.attributes('type')).toBe('button')
    expect(w.classes()).toContain('bg-primary-600')
    expect(w.text()).toBe('Save')
  })

  it('applies variant, size and block, and merges consumer classes and attrs', () => {
    const w = mount(BaseButton, {
      props: { variant: 'danger', size: 'sm', block: true },
      attrs: { class: 'mt-4', 'data-testid': 'x' },
    })
    expect(w.classes()).toEqual(
      expect.arrayContaining(['bg-danger-600', 'text-xs', 'w-full', 'mt-4']),
    )
    expect(w.attributes('data-testid')).toBe('x')
  })

  it('disables and shows a spinner while loading, without emitting click', async () => {
    const w = mount(BaseButton, { props: { loading: true }, slots: { default: 'Go' } })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.find('svg').exists()).toBe(true)
    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('supports rendering as another element with icon slots', () => {
    const w = mount(BaseButton, {
      props: { as: 'a', disabled: true },
      slots: { 'icon-left': '<i class="l" />', 'icon-right': '<i class="r" />' },
    })
    expect(w.element.tagName).toBe('A')
    expect(w.attributes('type')).toBeUndefined()
    expect(w.attributes('aria-disabled')).toBe('true')
    expect(w.find('.l').exists() && w.find('.r').exists()).toBe(true)
  })
})
