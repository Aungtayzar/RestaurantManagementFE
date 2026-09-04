import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/categories', () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
}))
vi.mock('vue3-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { createCategory, updateCategory } from '@/api/categories'
import CategoryFormModal from '../CategoryFormModal.vue'

let wrapper

async function mountModal(props = {}) {
  wrapper = mount(CategoryFormModal, {
    props: { open: true, ...props },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

const find = (selector) => document.querySelector(selector)

describe('CategoryFormModal', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('validates the required name without calling the API', async () => {
    await mountModal()
    find('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(document.body.textContent).toContain('Name is required.')
    expect(createCategory).not.toHaveBeenCalled()
  })

  it('creates a category and emits the saved record', async () => {
    const category = { id: 8, name: 'Pasta' }
    createCategory.mockResolvedValueOnce({ data: category })
    await mountModal()
    find('#category-name').value = ' Pasta '
    find('#category-name').dispatchEvent(new Event('input', { bubbles: true }))
    find('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    const payload = createCategory.mock.calls[0][0]
    expect(payload.get('name')).toBe('Pasta')
    expect(wrapper.emitted('saved')[0]).toEqual([category])
  })

  it('prefills and updates an existing category', async () => {
    const category = { id: 2, name: 'Mains' }
    updateCategory.mockResolvedValueOnce({ data: { ...category, name: 'Main Courses' } })
    await mountModal({ category })

    expect(find('#category-name').value).toBe('Mains')
    find('#category-name').value = 'Main Courses'
    find('#category-name').dispatchEvent(new Event('input', { bubbles: true }))
    find('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(updateCategory).toHaveBeenCalledWith(2, expect.any(FormData))
  })

  it.each([
    [401, 'Your session has expired. Please sign in again.'],
    [403, 'You do not have permission to manage categories.'],
  ])('shows an accessible error for HTTP %s', async (status, message) => {
    createCategory.mockRejectedValueOnce({ response: { status } })
    await mountModal()
    find('#category-name').value = 'Drinks'
    find('#category-name').dispatchEvent(new Event('input', { bubbles: true }))
    find('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(find('[role="alert"]').textContent).toBe(message)
  })
})
