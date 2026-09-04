import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import DeleteConfirmationModal from '../DeleteConfirmationModal.vue'

let wrapper

async function mountModal(props = {}) {
  wrapper = mount(DeleteConfirmationModal, {
    props: { open: true, itemName: 'Chicken Curry', ...props },
    attachTo: document.body,
  })
  await flushPromises()
}

describe('DeleteConfirmationModal', () => {
  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('renders the item name and emits confirm', async () => {
    await mountModal()

    expect(document.body.textContent).toContain('Are you sure you want to delete Chicken Curry?')
    document.querySelector('[data-testid="confirm-delete-button"]').click()
    await flushPromises()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits close from cancel', async () => {
    await mountModal()

    document.querySelector('[data-testid="cancel-delete-button"]').click()
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('disables both actions while deletion is in progress', async () => {
    await mountModal({ loading: true })

    expect(document.querySelector('[data-testid="cancel-delete-button"]').disabled).toBe(true)
    expect(document.querySelector('[data-testid="confirm-delete-button"]').disabled).toBe(true)
    expect(document.body.textContent).toContain('Deleting…')
  })
})
