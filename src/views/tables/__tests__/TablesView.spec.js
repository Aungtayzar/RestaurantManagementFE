import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
vi.mock('@/api/tables', () => ({
  getTables: vi.fn(),
  createTable: vi.fn(),
  updateTable: vi.fn(),
  deleteTable: vi.fn(),
}))
vi.mock('@/api/branches', () => ({ getBranches: vi.fn() }))
vi.mock('vue3-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
import { getTables, deleteTable } from '@/api/tables'
import { getBranches } from '@/api/branches'
import { useAuthStore } from '@/stores/auth'
import TablesView from '../TablesView.vue'
import TableFormModal from '@/components/tables/TableFormModal.vue'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal.vue'

const records = [
  { id: 1, name: 'Dining 01', capacity: 2, display_order: 1, is_active: true, status: 'available' },
  { id: 2, name: 'Patio 01', capacity: 4, display_order: 2, is_active: false, status: null },
  { id: 3, name: 'Booth 01', capacity: 6, display_order: 3, is_active: true, status: 'occupied' },
]
let wrapper
async function start(role = 'admin') {
  useAuthStore().user = { id: 1, roles: [role], branch_id: 1 }
  wrapper = mount(TablesView, {
    global: { stubs: { TableFormModal: true, DeleteConfirmationModal: true } },
  })
  await flushPromises()
}
const button = (text) => wrapper.findAll('button').find((item) => item.text() === text)
describe('TablesView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    sessionStorage.clear()
    setActivePinia(createPinia())
    getBranches.mockResolvedValue({
      data: [
        { id: 1, name: 'Downtown', is_active: true },
        { id: 2, name: 'Riverside', is_active: false },
      ],
      meta: { last_page: 1 },
    })
    getTables.mockResolvedValue({ data: records, summary: { available: 1, occupied: 1 } })
  })
  afterEach(() => wrapper?.unmount())
  it('requires explicit admin selection and loads every branch page', async () => {
    getBranches
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'Downtown' }], meta: { last_page: 2 } })
      .mockResolvedValueOnce({ data: [{ id: 16, name: 'Airport' }], meta: { last_page: 2 } })
    await start()
    expect(getBranches).toHaveBeenCalledWith({ page: 2 })
    expect(getTables).not.toHaveBeenCalled()
    expect(button('Add table').attributes('disabled')).toBeDefined()
    await wrapper.get('#tables-branch').setValue('16')
    await flushPromises()
    expect(getTables).toHaveBeenCalledWith({ branch_id: 16, include_inactive: true })
    await button('Add table').trigger('click')
    expect(wrapper.findComponent(TableFormModal).props()).toMatchObject({
      branchId: '16',
      branchName: 'Airport',
    })
  })
  it('loads managers’ assigned branch without querying branches', async () => {
    await start('manager')
    expect(getBranches).not.toHaveBeenCalled()
    expect(getTables).toHaveBeenCalledWith({ branch_id: undefined, include_inactive: true })
  })
  it('gives cashiers read-only active table access', async () => {
    await start('cashier')
    expect(getTables).toHaveBeenCalledWith({ branch_id: undefined, include_inactive: false })
    expect(button('Add table')).toBeUndefined()
    expect(wrapper.find('[aria-label="Edit Dining 01"]').exists()).toBe(false)
    expect(wrapper.find('#tables-activity').exists()).toBe(false)
  })
  it('preserves filtering when toggling layout and remembers preferences on navigation', async () => {
    await start()
    await wrapper.get('#tables-branch').setValue('1')
    await flushPromises()
    await wrapper.get('#tables-search').setValue('Patio')
    await button('grid').trigger('click')
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(wrapper.get('article').text()).toContain('Patio 01')
    expect(wrapper.find('[aria-label="Edit Patio 01"]').exists()).toBe(true)
    wrapper.unmount()
    await start()
    expect(wrapper.get('#tables-branch').element.value).toBe('1')
    expect(button('grid').attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('article')).toHaveLength(3)
  })
  it('combines activity and occupancy filters with a recoverable empty state', async () => {
    await start('manager')
    await wrapper.get('#tables-activity').setValue('inactive')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    await wrapper.get('#tables-occupancy').setValue('occupied')
    expect(wrapper.text()).toContain('No matching tables')
    await button('Clear filters').trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })
  it('ignores stale responses when an admin switches branches', async () => {
    let resolveOld
    getTables
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve
          }),
      )
      .mockResolvedValueOnce({
        data: [{ ...records[0], name: 'Riverside table' }],
        summary: { available: 1, occupied: 0 },
      })
    await start()
    await wrapper.get('#tables-branch').setValue('1')
    await wrapper.get('#tables-branch').setValue('2')
    await flushPromises()
    resolveOld({ data: records })
    await flushPromises()
    expect(wrapper.text()).toContain('Riverside table')
    expect(wrapper.text()).not.toContain('Dining 01')
    expect(button('Add table').attributes('disabled')).toBeDefined()
  })
  it('confirms the named table before deletion and refreshes after success', async () => {
    await start('manager')
    await wrapper.get('[aria-label="Delete Dining 01"]').trigger('click')
    expect(deleteTable).not.toHaveBeenCalled()
    const dialog = wrapper.findComponent(DeleteConfirmationModal)
    expect(dialog.props('itemName')).toBe('Dining 01')
    dialog.vm.$emit('confirm')
    await flushPromises()
    expect(deleteTable).toHaveBeenCalledWith(1)
    expect(getTables).toHaveBeenCalledTimes(2)
    expect(dialog.props('open')).toBe(false)
  })
  it.each([
    [401, 'Your session has expired'],
    [403, 'You do not have permission'],
  ])('handles HTTP %s and allows retry', async (status, message) => {
    getTables.mockRejectedValueOnce({ response: { status } })
    await start('manager')
    expect(wrapper.get('[role="alert"]').text()).toContain(message)
    await button('Retry').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })
})
