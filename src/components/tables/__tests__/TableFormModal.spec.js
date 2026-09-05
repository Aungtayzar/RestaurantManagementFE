import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
vi.mock('@/api/tables', () => ({ createTable: vi.fn(), updateTable: vi.fn() }))
import { createTable, updateTable } from '@/api/tables'
import TableFormModal from '../TableFormModal.vue'
let wrapper
async function start(props = {}) {
  wrapper = mount(TableFormModal, {
    props: { branchName: 'Downtown', ...props },
    attachTo: document.body,
  })
  await flushPromises()
}
async function input(selector, value) {
  const field = document.querySelector(selector)
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}
async function submit() {
  document
    .querySelector('form')
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}
describe('TableFormModal', () => {
  beforeEach(() => vi.resetAllMocks())
  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })
  it('creates an admin table in the selected branch with numeric fields', async () => {
    await start({ branchId: '2' })
    await input('#table-name', ' T01 ')
    await input('#table-capacity', '10')
    await input('#table-order', '1')
    await submit()
    expect(createTable).toHaveBeenCalledWith({
      branch_id: 2,
      name: 'T01',
      capacity: 10,
      display_order: 1,
      is_active: true,
    })
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })
  it('omits branch_id for manager creation', async () => {
    await start()
    await input('#table-name', 'T02')
    await submit()
    expect(createTable.mock.calls[0][0]).not.toHaveProperty('branch_id')
  })
  it('edits the existing table without attempting to move branches', async () => {
    await start({
      branchId: '1',
      table: { id: 4, name: 'T01', capacity: 10, display_order: 1, is_active: true },
    })
    await input('#table-name', 'T04')
    await input('#table-capacity', '11')
    await submit()
    expect(updateTable).toHaveBeenCalledWith(4, {
      name: 'T04',
      capacity: 11,
      display_order: 1,
      is_active: true,
    })
  })
  it('validates blank names and numeric limits without API calls', async () => {
    await start()
    await input('#table-capacity', '101')
    await input('#table-order', '-1')
    await submit()
    expect(document.body.textContent).toContain('Enter a name of 1–50 characters.')
    expect(document.body.textContent).toContain('Enter a whole number from 1 to 100.')
    expect(createTable).not.toHaveBeenCalled()
  })
  it('keeps values and displays backend validation errors', async () => {
    createTable.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'Validation failed',
          errors: { name: ['The name has already been taken for this branch.'] },
        },
      },
    })
    await start()
    await input('#table-name', 'T01')
    await submit()
    expect(document.body.textContent).toContain('The name has already been taken for this branch.')
    expect(document.querySelector('#table-name').value).toBe('T01')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })
  it('prevents duplicate submission while saving', async () => {
    let resolveSave
    createTable.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve
        }),
    )
    await start()
    await input('#table-name', 'T01')
    await submit()
    await submit()
    expect(createTable).toHaveBeenCalledTimes(1)
    expect(document.querySelector('fieldset').disabled).toBe(true)
    resolveSave({})
    await flushPromises()
  })
})
