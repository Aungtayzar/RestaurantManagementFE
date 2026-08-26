import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/staff', () => ({
  getStaff: vi.fn(),
  getStaffMember: vi.fn(),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
}))
vi.mock('@/api/branches', () => ({
  getBranches: vi.fn(),
}))
vi.mock('vue3-toastify', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}))

import { getStaff, createStaff, updateStaff } from '@/api/staff'
import { getBranches } from '@/api/branches'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/stores/auth'
import StaffListView from '../StaffListView.vue'
import StaffFormModal from '@/components/common/StaffFormModal.vue'
import StaffDetailModal from '@/components/common/StaffDetailModal.vue'

const staffPayload = {
  data: [
    {
      id: 1,
      name: 'Admin',
      email: 'admin@gmail.com',
      is_active: true,
      branch_id: null,
      roles: ['admin'],
      permissions: ['dashboard.view', 'staff.manage'],
      branch: null,
    },
    {
      id: 2,
      name: 'Branch Manager',
      email: 'manager@gmail.com',
      is_active: true,
      branch_id: 1,
      roles: ['manager'],
      permissions: ['dashboard.view'],
      branch: { id: 1, name: 'HQ Branch' },
    },
  ],
  links: {
    first: 'http://example.test/api/staff?page=1',
    last: 'http://example.test/api/staff?page=1',
    prev: null,
    next: null,
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: 'http://example.test/api/staff',
    per_page: 15,
    to: 2,
    total: 2,
  },
}

const branchesPayload = {
  data: [
    { id: 1, name: 'HQ Branch' },
    { id: 2, name: 'Downtown' },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, per_page: 15, to: 2, total: 2 },
}

// The create-staff dialog teleports its content to document.body, so it is driven via the DOM.
const $ = (selector) => document.querySelector(selector)

async function setDialogInput(selector, value) {
  const element = $(selector)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

async function submitDialogForm() {
  $('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

let wrapper

async function mountView({ roles = ['admin'] } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const auth = useAuthStore()
  auth.token = 'test-token'
  auth.user = { id: 99, name: 'Test User', roles }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/dashboard/staff', name: 'staff', component: StaffListView }],
  })
  router.push('/dashboard/staff')
  await router.isReady()
  wrapper = mount(StaffListView, {
    global: { plugins: [router, pinia] },
  })
  await flushPromises()
  return wrapper
}

describe('StaffListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStaff.mockResolvedValue(staffPayload)
    getBranches.mockResolvedValue(branchesPayload)
    createStaff.mockResolvedValue({ data: { id: 3 } })
    updateStaff.mockResolvedValue({ data: { id: 2 } })
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('renders a row for each staff member from the API', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('admin@gmail.com')
    expect(wrapper.text()).toContain('Branch Manager')
    expect(wrapper.text()).toContain('manager@gmail.com')
  })

  it('shows an error message when the staff API fails', async () => {
    getStaff.mockRejectedValueOnce(new Error('boom'))
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load staff. Please try again.')
  })

  it('shows the empty state when there are no staff', async () => {
    getStaff.mockResolvedValueOnce({
      ...staffPayload,
      data: [],
      meta: { ...staffPayload.meta, total: 0, from: 0, to: 0 },
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('No staff found.')
  })

  it('populates the branch filter from the branches API', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const branchOptions = wrapper
      .find('#staff-branch-filter')
      .findAll('option')
      .map((option) => option.text())

    expect(branchOptions).toContain('All branches')
    expect(branchOptions).toContain('HQ Branch')
    expect(branchOptions).toContain('Downtown')
  })

  it('passes the selected role filter to the API', async () => {
    const wrapper = await mountView()
    await flushPromises()

    await wrapper.find('#staff-role-filter').setValue('manager')
    await flushPromises()

    expect(getStaff).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'manager' }))
  })

  it('opens the details modal for the selected staff member', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const detailsButton = wrapper
      .findAll('tbody tr')
      .at(0)
      .findAll('button')
      .find((button) => button.text().includes('Details'))
    await detailsButton.trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(StaffDetailModal)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('staffId')).toBe(staffPayload.data[0].id)
  })

  it('shows the Add New button and Edit actions for admins', async () => {
    const wrapper = await mountView({ roles: ['admin'] })
    await flushPromises()

    const addNewButton = wrapper.findAll('button').find((button) => button.text().includes('Add New'))
    expect(addNewButton).toBeTruthy()
    expect(wrapper.find('tbody tr').findAll('button').some((b) => b.text().includes('Edit'))).toBe(
      true,
    )
  })

  it('hides the Add New button and Edit actions for managers', async () => {
    const wrapper = await mountView({ roles: ['manager'] })
    await flushPromises()

    const addNewButton = wrapper.findAll('button').find((button) => button.text().includes('Add New'))
    expect(addNewButton).toBeUndefined()
    expect(wrapper.find('tbody tr').findAll('button').some((b) => b.text().includes('Edit'))).toBe(
      false,
    )
    expect(wrapper.find('tbody tr').findAll('button').some((b) => b.text().includes('Details'))).toBe(
      true,
    )
  })

  it('creates a staff member from the modal and refreshes the list', async () => {
    await mountView({ roles: ['admin'] })

    const addNewButton = wrapper.findAll('button').find((button) => button.text().includes('Add New'))
    await addNewButton.trigger('click')
    await flushPromises()

    await setDialogInput('#staff-name', 'New Cashier')
    await setDialogInput('#staff-email', 'cashier@example.com')
    await setDialogInput('#staff-password', 'password123')
    await setDialogInput('#staff-role', 'cashier')
    await setDialogInput('#staff-branch', '2')
    await submitDialogForm()

    expect(createStaff).toHaveBeenCalledWith({
      name: 'New Cashier',
      email: 'cashier@example.com',
      password: 'password123',
      role: 'cashier',
      branch_id: 2,
      is_active: true,
    })
    expect(toast.success).toHaveBeenCalledWith('Staff account created successfully')
    expect(getStaff).toHaveBeenCalledTimes(2)
    expect(wrapper.findComponent(StaffFormModal).props('open')).toBe(false)
  })

  it('keeps the modal open and shows an error when creation fails', async () => {
    createStaff.mockRejectedValueOnce({
      response: {
        data: {
          message: 'The email has already been taken.',
          errors: { email: ['The email has already been taken.'] },
        },
      },
    })
    await mountView({ roles: ['admin'] })

    const addNewButton = wrapper.findAll('button').find((button) => button.text().includes('Add New'))
    await addNewButton.trigger('click')
    await flushPromises()

    await setDialogInput('#staff-name', 'New Cashier')
    await setDialogInput('#staff-email', 'cashier@example.com')
    await setDialogInput('#staff-password', 'password123')
    await setDialogInput('#staff-role', 'cashier')
    await setDialogInput('#staff-branch', '2')
    await submitDialogForm()

    expect(createStaff).toHaveBeenCalledTimes(1)
    expect(getStaff).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith('The email has already been taken.')
    expect(document.querySelector('#staff-name')).not.toBeNull()
  })

  it('opens the edit modal prefilled with the selected staff member', async () => {
    await mountView({ roles: ['admin'] })
    await flushPromises()

    const member = staffPayload.data[1]
    const editButton = wrapper
      .findAll('tbody tr')
      .at(1)
      .findAll('button')
      .find((button) => button.text().includes('Edit'))
    await editButton.trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(StaffFormModal)
    expect(modal.props('open')).toBe(true)
    expect(modal.props('staff')).toEqual(member)
  })

  it('saves edits through the API and refreshes the current page', async () => {
    await mountView({ roles: ['admin'] })
    await flushPromises()

    const editButton = wrapper
      .findAll('tbody tr')
      .at(1)
      .findAll('button')
      .find((button) => button.text().includes('Edit'))
    await editButton.trigger('click')
    await flushPromises()

    await setDialogInput('#staff-name', 'Renamed Manager')
    await submitDialogForm()
    await flushPromises()

    expect(updateStaff).toHaveBeenCalledTimes(1)
    const [id, payload] = updateStaff.mock.calls[0]
    expect(id).toBe(2)
    expect(payload).toEqual({
      name: 'Renamed Manager',
      email: 'manager@gmail.com',
      role: 'manager',
      branch_id: 1,
      is_active: true,
    })
    expect(toast.success).toHaveBeenCalledWith('Staff account updated successfully')
    expect(getStaff).toHaveBeenCalledTimes(2)
    expect(wrapper.findComponent(StaffFormModal).props('open')).toBe(false)
  })
})
