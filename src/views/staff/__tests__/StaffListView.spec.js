import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

vi.mock('@/api/staff', () => ({
  getStaff: vi.fn(),
}))
vi.mock('@/api/branches', () => ({
  getBranches: vi.fn(),
}))
vi.mock('vue3-toastify', () => ({
  toast: { info: vi.fn() },
}))

import { getStaff } from '@/api/staff'
import { getBranches } from '@/api/branches'
import { toast } from 'vue3-toastify'
import StaffListView from '../StaffListView.vue'

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

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/dashboard/staff', name: 'staff', component: StaffListView }],
  })
  router.push('/dashboard/staff')
  await router.isReady()
  return mount(StaffListView, { global: { plugins: [router] } })
}

describe('StaffListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStaff.mockResolvedValue(staffPayload)
    getBranches.mockResolvedValue(branchesPayload)
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

  it('shows a toast when a placeholder action is clicked', async () => {
    const wrapper = await mountView()
    await flushPromises()

    const editButtons = wrapper.findAll('tbody tr').at(0).findAll('button')
    const editButton = editButtons.find((button) => button.text().includes('Edit'))
    await editButton.trigger('click')

    expect(toast.info).toHaveBeenCalledWith('Edit is not available yet.')
  })
})
