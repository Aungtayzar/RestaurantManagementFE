import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/staff', () => ({
  getStaffMember: vi.fn(),
}))

import { getStaffMember } from '@/api/staff'
import StaffDetailModal from '../StaffDetailModal.vue'

const memberPayload = {
  id: 3,
  name: 'Cashier',
  email: 'cashier@gmail.com',
  is_active: true,
  branch_id: 1,
  roles: ['cashier'],
  permissions: ['dashboard.view', 'pos.access', 'orders.manage', 'reservations.manage'],
  branch: {
    id: 1,
    name: 'HQ Branch',
    address: '123 Main Street',
    phone: '0123456789',
    tax_rate: '0.00',
    service_charge: '0.00',
    is_active: false,
  },
}

describe('StaffDetailModal', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    getStaffMember.mockResolvedValue({ data: memberPayload })
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  async function mountModal(props = {}) {
    wrapper = mount(StaffDetailModal, {
      props: { open: true, staffId: 3, ...props },
    })
    await flushPromises()
  }

  it('fetches the staff member and renders their details', async () => {
    await mountModal()

    expect(getStaffMember).toHaveBeenCalledWith(3)
    const text = document.body.textContent
    expect(text).toContain('Cashier')
    expect(text).toContain('cashier@gmail.com')
    expect(text).toContain('cashier')
    expect(text).toContain('Active')
    expect(text).toContain('HQ Branch')
    expect(text).toContain('123 Main Street')
    expect(text).toContain('0123456789')
    for (const permission of memberPayload.permissions) {
      expect(text).toContain(permission)
    }
  })

  it('renders an em dash when the member has no branch', async () => {
    getStaffMember.mockResolvedValue({
      data: { ...memberPayload, branch: null, branch_id: null },
    })
    await mountModal()

    const text = document.body.textContent
    expect(text).toContain('Cashier')
    expect(text).not.toContain('HQ Branch')
    expect(text).toContain('—')
  })

  it('shows a loading skeleton while fetching', async () => {
    let resolveFetch
    getStaffMember.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )

    wrapper = mount(StaffDetailModal, { props: { open: true, staffId: 3 } })
    await flushPromises()

    expect(document.querySelector('[aria-label="Loading staff details"]')).not.toBeNull()
    expect(getStaffMember).toHaveBeenCalledWith(3)

    resolveFetch({ data: memberPayload })
    await flushPromises()

    expect(document.querySelector('[aria-label="Loading staff details"]')).toBeNull()
    expect(document.body.textContent).toContain('Cashier')
  })

  it('shows an error with retry when the API fails', async () => {
    getStaffMember.mockRejectedValueOnce(new Error('boom'))
    await mountModal()

    expect(document.body.textContent).toContain('Failed to load staff details. Please try again.')

    getStaffMember.mockResolvedValueOnce({ data: memberPayload })
    const retryButton = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent.trim() === 'Retry',
    )
    retryButton.click()
    await flushPromises()

    expect(getStaffMember).toHaveBeenCalledTimes(2)
    expect(document.body.textContent).toContain('Cashier')
  })

  it('emits close when the close button is clicked', async () => {
    await mountModal()

    const closeButton = document.querySelector('[aria-label="Close"]')
    closeButton.click()
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
