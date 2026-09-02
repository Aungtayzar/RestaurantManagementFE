import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import MenuItemRow from '../MenuItemRow.vue'

vi.mock('@/api/menuItems', () => ({
  getImageUrl: (path) => (path ? `/storage/${path}` : ''),
}))

function createMenuItem(overrides = {}) {
  return {
    id: 1,
    name: 'Chicken Curry',
    description: 'Spicy chicken curry with coconut milk and fresh herbs.',
    base_price: '12.50',
    image_path: 'menu-items/chicken-curry.jpg',
    image_url: null,
    is_available: true,
    ...overrides,
  }
}

function createWrapper(props = {}) {
  return mount(MenuItemRow, {
    props: {
      menuItem: createMenuItem(),
      ...props,
    },
  })
}

describe('MenuItemRow', () => {
  it('renders the item name and description', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Chicken Curry')
    expect(wrapper.text()).toContain('Spicy chicken curry with coconut milk and fresh herbs.')
  })

  it('trims descriptions longer than 20 words with an ellipsis', () => {
    const longDescription = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ')
    const wrapper = createWrapper({
      menuItem: createMenuItem({ description: longDescription }),
    })
    const text = wrapper.text()
    expect(text).toContain('word19…')
    expect(text).not.toContain('word20')
  })

  it('keeps descriptions of 20 words or fewer untouched', () => {
    const description = Array.from({ length: 20 }, (_, i) => `word${i}`).join(' ')
    const wrapper = createWrapper({
      menuItem: createMenuItem({ description }),
    })
    expect(wrapper.text()).toContain(description)
    expect(wrapper.text()).not.toContain('…')
  })

  it('uses image_url when provided', () => {
    const wrapper = createWrapper({
      menuItem: createMenuItem({
        image_url: 'http://example.test/storage/menu-items/full.jpg',
      }),
    })
    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('http://example.test/storage/menu-items/full.jpg')
    expect(img.attributes('alt')).toBe('Chicken Curry')
  })

  it('falls back to getImageUrl when only image_path is provided', () => {
    const wrapper = createWrapper()
    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('/storage/menu-items/chicken-curry.jpg')
  })

  it('shows a placeholder icon when there is no image', () => {
    const wrapper = createWrapper({
      menuItem: createMenuItem({ image_path: null, image_url: null }),
    })
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('displays the formatted base price', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('$12.50')
  })

  it('emits toggle-availability with the current status when switched', async () => {
    const wrapper = createWrapper()
    const toggle = wrapper.find('[data-testid="toggle-availability"]')
    await toggle.trigger('click')
    expect(wrapper.emitted('toggle-availability')).toHaveLength(1)
    expect(wrapper.emitted('toggle-availability')[0]).toEqual([{ id: 1, currentStatus: true }])
  })

  it('shows Unavailable text and emits false status when item is unavailable', async () => {
    const wrapper = createWrapper({
      menuItem: createMenuItem({ is_available: false }),
    })
    expect(wrapper.text()).toContain('Unavailable')
    const toggle = wrapper.find('[data-testid="toggle-availability"]')
    await toggle.trigger('click')
    expect(wrapper.emitted('toggle-availability')[0]).toEqual([{ id: 1, currentStatus: false }])
  })

  it('opens the dropdown and emits edit when Edit is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('[data-testid="row-menu"]').trigger('click')
    await nextTick()

    const editOption = wrapper.find('[data-testid="edit-option"]')
    expect(editOption.exists()).toBe(true)
    await editOption.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('edit')).toHaveLength(1)
  })

  it('opens the dropdown and emits view when View is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('[data-testid="row-menu"]').trigger('click')
    await nextTick()

    const viewOption = wrapper.find('[data-testid="view-option"]')
    expect(viewOption.exists()).toBe(true)
    await viewOption.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('view')).toHaveLength(1)
  })
})