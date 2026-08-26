import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/staff', () => ({
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
}))
vi.mock('vue3-toastify', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

import { createStaff, updateStaff } from '@/api/staff'
import { toast } from 'vue3-toastify'
import StaffFormModal from '../StaffFormModal.vue'

// The dialog teleports its content to document.body, so interactions go through the DOM.
const $ = (selector) => document.querySelector(selector)

async function setInput(selector, value) {
  const element = $(selector)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

async function submitForm() {
  $('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

function clickButton(label) {
  const button = [...document.querySelectorAll('button')].find(
    (candidate) => candidate.textContent.trim() === label,
  )
  button.click()
}

async function fillValidForm({ name = 'New Cashier', password = 'password123' } = {}) {
  await setInput('#staff-name', name)
  await setInput('#staff-email', 'cashier@example.com')
  if (password !== undefined) {
    await setInput('#staff-password', password)
  }
  await setInput('#staff-role', 'cashier')
  await setInput('#staff-branch', '2')
}

const branches = [{ id: 2, name: 'Downtown' }]

const existingStaff = {
  id: 7,
  name: 'Old Name',
  email: 'old@example.com',
  roles: ['cashier'],
  branch_id: 2,
  is_active: false,
}

describe('StaffFormModal', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    createStaff.mockResolvedValue({ data: { id: 1 } })
    updateStaff.mockResolvedValue({ data: { ...existingStaff } })
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  async function mountModal(props = {}) {
    wrapper = mount(StaffFormModal, {
      props: { open: true, branches, ...props },
    })
    await flushPromises()
  }

  it('shows a validation error and does not call the API when required fields are missing', async () => {
    await mountModal()

    await submitForm()

    expect(document.body.textContent).toContain('Name is required.')
    expect(createStaff).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters', async () => {
    await mountModal()

    await fillValidForm({ password: 'short' })
    await submitForm()

    expect(document.body.textContent).toContain('Password must be at least 8 characters.')
    expect(createStaff).not.toHaveBeenCalled()
  })

  it('submits the expected payload and emits saved on success', async () => {
    await mountModal()

    await fillValidForm()
    await submitForm()

    expect(createStaff).toHaveBeenCalledWith({
      name: 'New Cashier',
      email: 'cashier@example.com',
      password: 'password123',
      role: 'cashier',
      branch_id: 2,
      is_active: true,
    })
    expect(toast.success).toHaveBeenCalledWith('Staff account created successfully')
    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('toggles the Active switch off in the payload', async () => {
    await mountModal()

    await fillValidForm({ name: 'Inactive Cashier' })
    $('[role="switch"]').click()
    await submitForm()

    expect(createStaff).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Inactive Cashier', is_active: false }),
    )
  })

  it('notifies via toast on API errors and stays open', async () => {
    createStaff.mockRejectedValueOnce({
      response: {
        data: {
          message: 'The email has already been taken.',
          errors: { email: ['The email has already been taken.'] },
        },
      },
    })
    await mountModal()

    await fillValidForm()
    await submitForm()

    expect(toast.error).toHaveBeenCalledWith('The email has already been taken.')
    expect(wrapper.emitted('saved')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('emits close when the cancel button is clicked', async () => {
    await mountModal()

    clickButton('Cancel')
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('prefills the form and shows edit labels when editing', async () => {
    await mountModal({ staff: existingStaff })

    expect(document.body.textContent).toContain('Edit staff')
    expect(document.body.textContent).toContain('Save changes')
    expect($('#staff-name').value).toBe('Old Name')
    expect($('#staff-email').value).toBe('old@example.com')
    expect($('#staff-role').value).toBe('cashier')
    expect($('#staff-branch').value).toBe('2')
    expect($('[role="switch"]').getAttribute('aria-checked')).toBe('false')
    expect($('#staff-password').required).toBe(false)
  })

  it('submits an update without a password when left blank', async () => {
    await mountModal({ staff: existingStaff })

    await setInput('#staff-name', 'Renamed Staff')
    await submitForm()

    expect(updateStaff).toHaveBeenCalledTimes(1)
    const [id, payload] = updateStaff.mock.calls[0]
    expect(id).toBe(7)
    expect(payload).toEqual({
      name: 'Renamed Staff',
      email: 'old@example.com',
      role: 'cashier',
      branch_id: 2,
      is_active: false,
    })
    expect(toast.success).toHaveBeenCalledWith('Staff account updated successfully')
    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('includes a typed password in the update payload', async () => {
    await mountModal({ staff: existingStaff })

    await fillValidForm({ name: 'Old Name', password: undefined })
    await setInput('#staff-name', 'Old Name')
    await setInput('#staff-password', 'newpassword1')
    await submitForm()

    expect(updateStaff).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ password: 'newpassword1' }),
    )
  })

  it('rejects a too-short password when replacing it during edit', async () => {
    await mountModal({ staff: existingStaff })

    await setInput('#staff-password', 'short')
    await submitForm()

    expect(document.body.textContent).toContain('Password must be at least 8 characters.')
    expect(updateStaff).not.toHaveBeenCalled()
  })

  it('disables role, branch, and active controls when editing own account', async () => {
    await mountModal({ staff: existingStaff, selfId: 7 })

    expect($('#staff-role').disabled).toBe(true)
    expect($('#staff-branch').disabled).toBe(true)
    expect($('[role="switch"]').disabled).toBe(true)
    expect(document.body.textContent).toContain("Your own role cannot be changed.")
    expect(document.body.textContent).toContain("Your own branch cannot be changed.")
    expect(document.body.textContent).toContain("Your own status cannot be changed.")
  })

  it('submits only name, email, and password when editing own account', async () => {
    await mountModal({ staff: existingStaff, selfId: 7 })

    await setInput('#staff-name', 'Updated Self')
    await setInput('#staff-email', 'self@example.com')
    await setInput('#staff-password', 'newpassword1')
    await submitForm()

    expect(updateStaff).toHaveBeenCalledTimes(1)
    const [id, payload] = updateStaff.mock.calls[0]
    expect(id).toBe(7)
    expect(payload).toEqual({
      name: 'Updated Self',
      email: 'self@example.com',
      password: 'newpassword1',
    })
    expect(payload.role).toBeUndefined()
    expect(payload.branch_id).toBeUndefined()
    expect(payload.is_active).toBeUndefined()
  })

  it('allows editing own account without branch (branchless admin)', async () => {
    const branchlessAdmin = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      roles: ['admin'],
      branch_id: null,
      is_active: true,
    }
    await mountModal({ staff: branchlessAdmin, selfId: 1 })

    await setInput('#staff-name', 'Updated Admin')
    await submitForm()

    expect(updateStaff).toHaveBeenCalledTimes(1)
    const [id, payload] = updateStaff.mock.calls[0]
    expect(id).toBe(1)
    expect(payload).toEqual({
      name: 'Updated Admin',
      email: 'admin@example.com',
    })
  })

  it('still requires role and branch when editing another user', async () => {
    await mountModal({ staff: existingStaff, selfId: 99 })

    await setInput('#staff-role', '')
    await setInput('#staff-branch', '')
    await submitForm()

    expect(document.body.textContent).toContain('Role is required.')
    expect(updateStaff).not.toHaveBeenCalled()
  })
})
