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
}))
vi.mock('vue3-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

import { getMenuItems, updateMenuItem } from '@/api/menuItems'
import { getCategories } from '@/api/categories'
import { toast } from 'vue3-toastify'
import MenuItemsView from '../MenuItemsView.vue'
import MenuItemRow from '@/components/menu/MenuItemRow.vue'
import MenuItemFormModal from '@/components/menu/MenuItemFormModal.vue'
import MenuItemDetailModal from '@/components/menu/MenuItemDetailModal.vue'

const menuItemsPayload = {
  data: [
    {
      id: 1,
      name: 'Mains',
      image_path: null,
      display_order: 0,
      menu_items_count: 1,
      items: [
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
        },
      ],
    },
    {
      id: 2,
      name: 'Starters',
      image_path: null,
      display_order: 0,
      menu_items_count: 1,
      items: [
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
        },
      ],
    },
  ],
}

const categoriesPayload = {
  data: [
    { id: 1, name: 'Mains' },
    { id: 2, name: 'Starters' },
    { id: 3, name: 'Desserts' },
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
    getMenuItems.mockResolvedValue(menuItemsPayload)
    getCategories.mockResolvedValue(categoriesPayload)
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

  it('renders category sections with a row for each menu item', async () => {
    const wrapper = await mountView()

    const rows = wrapper.findAllComponents(MenuItemRow)
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain('Mains')
    expect(wrapper.text()).toContain('Starters')
    expect(wrapper.text()).toContain('1 items visible to consumer')
    expect(wrapper.text()).toContain('Chicken Curry')
    expect(wrapper.text()).toContain('Caesar Salad')
  })

  it('collapses and expands each category independently', async () => {
    const wrapper = await mountView()
    const mainsToggle = wrapper.find('button[aria-label="Collapse Mains"]')
    const mainsItems = wrapper.find('#category-items-1')
    const startersItems = wrapper.find('#category-items-2')

    expect(mainsToggle.attributes('aria-expanded')).toBe('true')
    expect(mainsItems.isVisible()).toBe(true)
    expect(startersItems.isVisible()).toBe(true)

    await mainsToggle.trigger('click')

    expect(wrapper.find('button[aria-label="Expand Mains"]').attributes('aria-expanded')).toBe(
      'false',
    )
    expect(wrapper.find('#category-items-1').attributes('style')).toContain('display: none')
    expect(startersItems.isVisible()).toBe(true)

    await wrapper.find('button[aria-label="Expand Mains"]').trigger('click')

    expect(wrapper.find('#category-items-1').isVisible()).toBe(true)
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
    getMenuItems.mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Failed to load menu items. Please try again.')
    expect(wrapper.text()).toContain('Retry')
  })

  it('shows the empty state when there are no menu items', async () => {
    getMenuItems.mockResolvedValueOnce({ data: [] })
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('No menu items found.')
  })

  it('hides categories without any items', async () => {
    getMenuItems.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Mains', menu_items_count: 0, items: [] },
        { id: 2, name: 'Starters', menu_items_count: 1, items: menuItemsPayload.data[1].items },
      ],
    })
    const wrapper = await mountView()

    const headings = wrapper.findAll('h2').map((heading) => heading.text())

    expect(wrapper.findAllComponents(MenuItemRow)).toHaveLength(1)
    expect(headings).toEqual(['Starters'])
  })

  it('shows an error toast when the categories API fails', async () => {
    getCategories.mockRejectedValueOnce(new Error('boom'))
    await mountView()

    expect(toast.error).toHaveBeenCalledWith('Failed to load categories. Please try again.')
  })

  it('populates the category filter from the categories API', async () => {
    const wrapper = await mountView()

    const categoryOptions = wrapper
      .find('#menu-category-filter')
      .findAll('option')
      .map((option) => option.text())

    expect(categoryOptions).toContain('All Categories')
    expect(categoryOptions).toContain('Mains')
    expect(categoryOptions).toContain('Starters')
    expect(categoryOptions).toContain('Desserts')
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

    await wrapper.find('#menu-category-filter').setValue('1')
    await flushPromises()

    expect(getMenuItems).toHaveBeenLastCalledWith(expect.objectContaining({ category_id: '1' }))
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
    expect(modal.props('menuItem')).toEqual(menuItemsPayload.data[0].items[0])
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
    await detailModal.vm.$emit('edit', menuItemsPayload.data[0].items[0])
    await flushPromises()

    expect(wrapper.findComponent(MenuItemDetailModal).props('open')).toBe(false)

    const formModal = wrapper.findComponent(MenuItemFormModal)
    expect(formModal.props('open')).toBe(true)
    expect(formModal.props('menuItem')).toEqual(menuItemsPayload.data[0].items[0])
  })

  it('calls updateMenuItem when a row emits toggle-availability', async () => {
    updateMenuItem.mockResolvedValueOnce({ data: {} })
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('toggle-availability', { id: 1, currentStatus: true })
    await flushPromises()

    expect(updateMenuItem).toHaveBeenCalledTimes(1)
    const [id, formData] = updateMenuItem.mock.calls[0]
    expect(id).toBe(1)
    expect(formData.get('is_available')).toBe('0')
    expect(toast.success).toHaveBeenCalledWith('Item marked as unavailable')
    expect(getMenuItems).toHaveBeenCalledTimes(2)
  })

  it('shows error toast when toggle-availability fails', async () => {
    updateMenuItem.mockRejectedValueOnce(new Error('fail'))
    const wrapper = await mountView()

    const firstRow = wrapper.findAllComponents(MenuItemRow).at(0)
    await firstRow.vm.$emit('toggle-availability', { id: 1, currentStatus: true })
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('Failed to update availability. Please try again.')
  })

  it('clicking Retry refetches menu items after an error', async () => {
    getMenuItems.mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Failed to load menu items')

    getMenuItems.mockResolvedValueOnce(menuItemsPayload)
    const retryButton = wrapper.findAll('button').find((b) => b.text().includes('Retry'))
    await retryButton.trigger('click')
    await flushPromises()

    expect(getMenuItems).toHaveBeenCalledTimes(2)
    expect(wrapper.findAllComponents(MenuItemRow)).toHaveLength(2)
  })
})
