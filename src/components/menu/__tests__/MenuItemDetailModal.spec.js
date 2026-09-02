import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/menuItems', () => ({
  getMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  getImageUrl: vi.fn((path) => (path ? `/storage/${path}` : '')),
}))

import { getMenuItem, deleteMenuItem } from '@/api/menuItems'
import MenuItemDetailModal from '../MenuItemDetailModal.vue'

const menuItemPayload = {
  id: 1,
  name: 'Chicken Curry',
  description: 'A delicious chicken curry dish',
  base_price: '12.50',
  image_path: 'menu-items/chicken-curry.jpg',
  category_name: 'Mains',
  is_available: true,
  variants: [
    { id: 1, name: 'Small', price: '10.00' },
    { id: 2, name: 'Large', price: '15.00' },
  ],
}

describe('MenuItemDetailModal', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    getMenuItem.mockResolvedValue({ data: menuItemPayload })
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  async function mountModal(props = {}) {
    wrapper = mount(MenuItemDetailModal, {
      props: { open: true, menuItemId: 1, ...props },
      attachTo: document.body,
    })
    await flushPromises()
  }

  it('fetches the menu item and renders its details', async () => {
    await mountModal()

    expect(getMenuItem).toHaveBeenCalledWith(1)
    const text = document.body.textContent
    expect(text).toContain('Chicken Curry')
    expect(text).toContain('A delicious chicken curry dish')
    expect(text).toContain('Mains')
    expect(text).toContain('$12.50')
    expect(text).toContain('Available')
    expect(text).toContain('Small')
    expect(text).toContain('$10.00')
    expect(text).toContain('Large')
    expect(text).toContain('$15.00')
  })

  it('shows a loading skeleton while fetching', async () => {
    let resolveFetch
    getMenuItem.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )

    wrapper = mount(MenuItemDetailModal, {
      props: { open: true, menuItemId: 1 },
      attachTo: document.body,
    })
    await flushPromises()

    expect(document.querySelector('[aria-label="Loading menu item details"]')).not.toBeNull()
    expect(getMenuItem).toHaveBeenCalledWith(1)

    resolveFetch({ data: menuItemPayload })
    await flushPromises()

    expect(document.querySelector('[aria-label="Loading menu item details"]')).toBeNull()
    expect(document.body.textContent).toContain('Chicken Curry')
  })

  it('shows an error with retry when the API fails', async () => {
    getMenuItem.mockRejectedValueOnce(new Error('boom'))
    await mountModal()

    expect(document.body.textContent).toContain(
      'Failed to load menu item details. Please try again.',
    )

    getMenuItem.mockResolvedValueOnce({ data: menuItemPayload })
    const retryButton = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent.trim() === 'Retry',
    )
    retryButton.click()
    await flushPromises()

    expect(getMenuItem).toHaveBeenCalledTimes(2)
    expect(document.body.textContent).toContain('Chicken Curry')
  })

  it('emits close when the close button is clicked', async () => {
    await mountModal()

    const closeButton = document.querySelector('[aria-label="Close"]')
    closeButton.click()
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits edit with item data when Edit button is clicked', async () => {
    await mountModal()

    const editButton = document.querySelector('[data-testid="edit-button"]')
    editButton.click()
    await flushPromises()

    expect(wrapper.emitted('edit')).toHaveLength(1)
    expect(wrapper.emitted('edit')[0]).toEqual([menuItemPayload])
  })

  it('opens delete confirmation dialog when Delete button is clicked', async () => {
    await mountModal()

    const deleteButton = document.querySelector('[data-testid="delete-button"]')
    deleteButton.click()
    await flushPromises()

    expect(document.body.textContent).toContain('Delete Chicken Curry?')
    expect(document.body.textContent).toContain('This action cannot be undone.')
  })

  it('closes delete confirmation when Cancel is clicked', async () => {
    await mountModal()

    const deleteButton = document.querySelector('[data-testid="delete-button"]')
    deleteButton.click()
    await flushPromises()

    const cancelButton = document.querySelector('[data-testid="cancel-delete-button"]')
    cancelButton.click()
    await flushPromises()

    expect(deleteMenuItem).not.toHaveBeenCalled()
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('calls deleteMenuItem, emits deleted, and closes on confirm', async () => {
    deleteMenuItem.mockResolvedValueOnce({})
    await mountModal()

    const deleteButton = document.querySelector('[data-testid="delete-button"]')
    deleteButton.click()
    await flushPromises()

    const confirmButton = document.querySelector('[data-testid="confirm-delete-button"]')
    confirmButton.click()
    await flushPromises()

    expect(deleteMenuItem).toHaveBeenCalledWith(1)
    expect(wrapper.emitted('deleted')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('shows error toast when delete fails', async () => {
    deleteMenuItem.mockRejectedValueOnce(new Error('fail'))
    await mountModal()

    const deleteButton = document.querySelector('[data-testid="delete-button"]')
    deleteButton.click()
    await flushPromises()

    const confirmButton = document.querySelector('[data-testid="confirm-delete-button"]')
    confirmButton.click()
    await flushPromises()

    expect(deleteMenuItem).toHaveBeenCalledWith(1)
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('renders "No variants" when variants array is empty', async () => {
    getMenuItem.mockResolvedValueOnce({
      data: { ...menuItemPayload, variants: [] },
    })
    await mountModal()

    expect(document.body.textContent).toContain('No variants')
  })

  it('renders "No description" when description is empty', async () => {
    getMenuItem.mockResolvedValueOnce({
      data: { ...menuItemPayload, description: '' },
    })
    await mountModal()

    expect(document.body.textContent).toContain('No description')
  })

  it('renders image when image_path is provided', async () => {
    await mountModal()

    const img = document.querySelector('img')
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('/storage/menu-items/chicken-curry.jpg')
    expect(img.getAttribute('alt')).toBe('Chicken Curry')
  })

  it('renders placeholder icon when no image_path', async () => {
    getMenuItem.mockResolvedValueOnce({
      data: { ...menuItemPayload, image_path: null },
    })
    await mountModal()

    const img = document.querySelector('img[alt="Chicken Curry"]')
    expect(img).toBeNull()
  })
})
