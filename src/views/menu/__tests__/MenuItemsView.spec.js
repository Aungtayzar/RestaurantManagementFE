import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('@/api/menuItems', () => ({
  getMenuItems: vi.fn(),
  getMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  createMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  getImageUrl: vi.fn((path) => (path ? `/storage/${path}` : '')),
}))
vi.mock('@/api/categories', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))
vi.mock('vue3-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

import { getMenuItems, updateMenuItem } from '@/api/menuItems'
import { deleteCategory, getCategories } from '@/api/categories'
import { toast } from 'vue3-toastify'
import MenuItemsView from '../MenuItemsView.vue'
import MenuItemRow from '@/components/menu/MenuItemRow.vue'
import MenuItemFormModal from '@/components/menu/MenuItemFormModal.vue'
import MenuItemDetailModal from '@/components/menu/MenuItemDetailModal.vue'

const menuItemsPayload = {
  data: [
    {
      id: 1,
      category_id: 1,
      category_name: 'Mains',
      name: 'Chicken Curry',
      description: 'Spicy chicken curry',
      base_price: '12.50',
      image_path: 'menu-items/chicken-curry.jpg',
      image_url: null,
      is_available: true,
      variants: [{ id: 1, name: 'Large', price: '15.00' }],
    },
    {
      id: 2,
      category_id: 2,
      category_name: 'Starters',
      name: 'Caesar Salad',
      description: 'Fresh caesar salad',
      base_price: '8.00',
      image_path: null,
      image_url: null,
      is_available: false,
      variants: [],
    },
  ],
}

const categoriesPayload = {
  data: [
    { id: 1, name: 'Mains', menu_items_count: 1 },
    { id: 2, name: 'Starters', menu_items_count: 1 },
    { id: 3, name: 'Desserts', menu_items_count: 0 },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, per_page: 100, to: 3, total: 3 },
}

let wrapper

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/dashboard/menu', name: 'menu-items', component: MenuItemsView }],
  })
  router.push('/dashboard/menu')
  await router.isReady()
  wrapper = mount(MenuItemsView, {
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

describe('MenuItemsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMenuItems.mockImplementation(({ category_id } = {}) =>
      Promise.resolve({
        data: menuItemsPayload.data.filter(
          (item) => category_id === undefined || String(item.category_id) === String(category_id),
        ),
      }),
    )
    getCategories.mockResolvedValue(categoriesPayload)
    deleteCategory.mockResolvedValue({})
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('renders the page heading and New Item button', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Menu Items')
    const newButton = wrapper.findAll('button').find((b) => b.text().includes('New Item'))
    expect(newButton).toBeTruthy()
  })

  it('renders the category sidebar and only the selected category items', async () => {
    const wrapper = await mountView()

    const rows = wrapper.findAllComponents(MenuItemRow)
    expect(rows).toHaveLength(1)
    expect(wrapper.text()).toContain('Mains')
    expect(wrapper.text()).toContain('Starters')
    expect(wrapper.text()).toContain('Chicken Curry')
    expect(wrapper.text()).not.toContain('Caesar Salad')
  })

  it('selects the first category and switches the right pane from the sidebar', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('button[aria-current="true"]').text()).toContain('Mains')
    const startersButton = wrapper.findAll('button').find((button) => button.text() === 'Starters')
    await startersButton.trigger('click')
    await flushPromises()

    expect(wrapper.find('button[aria-current="true"]').text()).toContain('Starters')
    expect(getMenuItems).toHaveBeenLastCalledWith(expect.objectContaining({ category_id: '2' }))
    expect(wrapper.text()).toContain('Caesar Salad')
  })

  it('shows loading skeletons while fetching', async () => {
    let resolveFetch
    getMenuItems.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    getCategories.mockResolvedValue(categoriesPayload)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard/menu', name: 'menu-items', component: MenuItemsView }],
    })
    router.push('/dashboard/menu')
    await router.isReady()
    wrapper = mount(MenuItemsView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.find('[aria-label="Loading menu items"]').exists()).toBe(true)

    resolveFetch(menuItemsPayload)
    await flushPromises()

    expect(wrapper.find('[aria-label="Loading menu items"]').exists()).toBe(false)
  })

  it('shows an error message when the menu items API fails', async () => {
    getMenuItems.mockRejectedValue(new Error('boom'))
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Failed to load menu items. Please try again.')
    expect(wrapper.text()).toContain('Retry')
  })

  it('shows the empty state when there are no menu items', async () => {
    getMenuItems.mockResolvedValue({ data: [] })
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('No menu items found in this category.')
  })

  it('keeps categories without items visible with a zero count', async () => {
    getCategories.mockResolvedValue({
      ...categoriesPayload,
      data: [
        { id: 1, name: 'Mains', menu_items_count: 0 },
        { id: 2, name: 'Starters', menu_items_count: 1 },
      ],
    })
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Mains')
    expect(wrapper.text()).toContain('Starters')
    expect(wrapper.find('[data-testid="category-scroll-region"]').text()).toContain('Mains0')
  })

  it('shows an error toast when the categories API fails', async () => {
    getCategories.mockRejectedValueOnce(new Error('boom'))
    await mountView()

    expect(toast.error).toHaveBeenCalledWith('Failed to load categories. Please try again.')
  })

  it('populates the scrollable category sidebar from the categories API', async () => {
    const wrapper = await mountView()
    const region = wrapper.find('[data-testid="category-scroll-region"]')
    expect(region.classes()).toContain('overflow-y-auto')
    expect(region.text()).toContain('Mains')
    expect(region.text()).toContain('Starters')
    expect(region.text()).toContain('Desserts')
    expect(region.text()).not.toContain('New Category')
  })

  it('renders the category delete button hidden until its row is hovered', async () => {
    const wrapper = await mountView()
    const deleteButton = wrapper.find('button[aria-label="Delete Mains"]')

    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.classes()).toContain('opacity-0')
    expect(deleteButton.classes()).toContain('group-hover:opacity-100')
  })

  it('confirms and deletes a category before refreshing the lists', async () => {
    getCategories
      .mockResolvedValueOnce(categoriesPayload)
      .mockResolvedValueOnce({ ...categoriesPayload, data: categoriesPayload.data.slice(1) })
    const wrapper = await mountView()

    await wrapper.find('button[aria-label="Delete Mains"]').trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Are you sure you want to delete Mains?')
    document.querySelector('[data-testid="confirm-delete-button"]').click()
    await flushPromises()

    expect(deleteCategory).toHaveBeenCalledWith(1)
    expect(toast.success).toHaveBeenCalledWith('Category deleted successfully')
    expect(wrapper.text()).not.toContain('Mains')
  })

  it('does not delete a category when confirmation is cancelled', async () => {
    const wrapper = await mountView()

    await wrapper.find('button[aria-label="Delete Mains"]').trigger('click')
    await flushPromises()
    document.querySelector('[data-testid="cancel-delete-button"]').click()
    await flushPromises()

    expect(deleteCategory).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toContain('Are you sure you want to delete Mains?')
  })

  it('shows the API message when category deletion fails', async () => {
    deleteCategory.mockRejectedValueOnce({
      response: { data: { message: 'Cannot delete a category that still contains menu items.' } },
    })
    const wrapper = await mountView()

    await wrapper.find('button[aria-label="Delete Mains"]').trigger('click')
    await flushPromises()
    document.querySelector('[data-testid="confirm-delete-button"]').click()
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith(
      'Cannot delete a category that still contains menu items.',
    )
  })

  it('renders the availability filter buttons', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('All')
    expect(wrapper.text()).toContain('Available')
    expect(wrapper.text()).toContain('Unavailable')
  })

  it('passes the selected category filter to the API', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const startersButton = wrapper.findAll('button').find((button) => button.text() === 'Starters')
    await startersButton.trigger('click')
    await flushPromises()

    expect(getMenuItems).toHaveBeenLastCalledWith(expect.objectContaining({ category_id: '2' }))
  })

  it('passes the selected availability filter to the API', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const unavailableButton = wrapper.findAll('button').find((b) => b.text() === 'Unavailable')
    await unavailableButton.trigger('click')
    await flushPromises()

    expect(getMenuItems).toHaveBeenLastCalledWith(expect.objectContaining({ available: '0' }))
  })

  it('debounces search input and queries with search param after 300ms', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()

    const searchInput = wrapper.find('#menu-search')
    await searchInput.setValue('curry')
    await flushPromises()

    expect(getMenuItems).not.toHaveBeenLastCalledWith(expect.objectContaining({ search: 'curry' }))

    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(getMenuItems).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'curry' }))
    vi.useRealTimers()
  })

  it('opens the detail modal when a row emits view', async () => {
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('view')
    await flushPromises()

    const modal = wrapper.findComponent(MenuItemDetailModal)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('menuItemId')).toBe(1)
  })

  it('opens the form modal when a row emits edit', async () => {
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('edit')
    await flushPromises()

    const modal = wrapper.findComponent(MenuItemFormModal)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('menuItem')).toEqual(menuItemsPayload.data[0])
  })

  it('opens the create modal when New Item is clicked', async () => {
    const wrapper = await mountView()

    const newButton = wrapper.findAll('button').find((b) => b.text().includes('New Item'))
    await newButton.trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(MenuItemFormModal)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('menuItem')).toBeNull()
  })

  it('closes the create modal and refreshes on saved event', async () => {
    const wrapper = await mountView()

    const newButton = wrapper.findAll('button').find((b) => b.text().includes('New Item'))
    await newButton.trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(MenuItemFormModal)
    expect(modal.props('open')).toBe(true)

    await modal.vm.$emit('saved')
    await flushPromises()

    expect(wrapper.findComponent(MenuItemFormModal).props('open')).toBe(false)
    expect(getMenuItems).toHaveBeenCalledTimes(2)
  })

  it('closes the detail modal and refreshes on deleted event', async () => {
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('view')
    await flushPromises()

    const detailModal = wrapper.findComponent(MenuItemDetailModal)
    expect(detailModal.props('open')).toBe(true)

    await detailModal.vm.$emit('deleted')
    await flushPromises()

    expect(wrapper.findComponent(MenuItemDetailModal).props('open')).toBe(false)
    expect(getMenuItems).toHaveBeenCalledTimes(2)
  })

  it('closes detail modal and opens form modal on edit event from detail modal', async () => {
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('view')
    await flushPromises()

    const detailModal = wrapper.findComponent(MenuItemDetailModal)
    await detailModal.vm.$emit('edit', menuItemsPayload.data[0])
    await flushPromises()

    expect(wrapper.findComponent(MenuItemDetailModal).props('open')).toBe(false)

    const formModal = wrapper.findComponent(MenuItemFormModal)
    expect(formModal.props('open')).toBe(true)
    expect(formModal.props('menuItem')).toEqual(menuItemsPayload.data[0])
  })

  it('calls updateMenuItem when a row emits toggle-availability', async () => {
    updateMenuItem.mockResolvedValueOnce({ data: {} })
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('toggle-availability', { id: 1, newStatus: false })
    await flushPromises()

    expect(updateMenuItem).toHaveBeenCalledTimes(1)
    const [id, formData] = updateMenuItem.mock.calls[0]
    expect(id).toBe(1)
    expect(formData.get('is_available')).toBe('0')
    expect(toast.success).toHaveBeenCalledWith('Item marked as unavailable')
    expect(getMenuItems).toHaveBeenCalledTimes(1)
  })

  it('shows error toast when toggle-availability fails', async () => {
    updateMenuItem.mockRejectedValueOnce(new Error('fail'))
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('toggle-availability', { id: 1, newStatus: false })
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('Failed to update availability. Please try again.')
  })

  it('clicking Retry refetches menu items after an error', async () => {
    getMenuItems.mockRejectedValue(new Error('boom'))
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Failed to load menu items')

    getMenuItems.mockResolvedValue({ data: [menuItemsPayload.data[0]] })
    const retryButton = wrapper.findAll('button').find((b) => b.text().includes('Retry'))
    await retryButton.trigger('click')
    await flushPromises()

    expect(getMenuItems).toHaveBeenCalledTimes(2)
    expect(wrapper.findAllComponents(MenuItemRow)).toHaveLength(1)
  })
})
