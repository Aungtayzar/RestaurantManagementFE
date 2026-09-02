import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/menuItems', () => ({
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  getImageUrl: vi.fn((path) => (path ? `/storage/${path}` : '')),
}))
vi.mock('vue3-toastify', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

import { createMenuItem, updateMenuItem } from '@/api/menuItems'
import { toast } from 'vue3-toastify'
import MenuItemFormModal from '../MenuItemFormModal.vue'

// The dialog teleports its content to document.body, so interactions go through the DOM.
const $ = (selector) => document.querySelector(selector)

async function setInput(selector, value) {
  const element = $(selector)
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

async function setFile(selector, file) {
  const element = $(selector)
  Object.defineProperty(element, 'files', { value: [file], configurable: true })
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

function switchValue() {
  return document.querySelector('[role="switch"]')?.getAttribute('aria-checked') ?? null
}

async function fillValidForm({
  name = 'New Item',
  description = 'A delicious item',
  basePrice = '9.99',
  category = '1',
} = {}) {
  await setInput('#menu-item-name', name)
  await setInput('#menu-item-description', description)
  await setInput('#menu-item-base-price', basePrice)
  await setInput('#menu-item-category', category)
}

const categories = [{ id: 1, name: 'Mains' }]

const existingMenuItem = {
  id: 5,
  name: 'Chicken Curry',
  description: 'Spicy chicken dish',
  base_price: '12.50',
  category_id: 1,
  image_path: 'menu-items/chicken-curry.jpg',
  is_available: true,
  variants: [
    { id: 10, name: 'Regular', price: '10.00' },
    { id: 11, name: 'Large', price: '14.00' },
  ],
}

describe('MenuItemFormModal', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:mock-preview')
    createMenuItem.mockResolvedValue({ data: { id: 1 } })
    updateMenuItem.mockResolvedValue({ data: { ...existingMenuItem } })
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  async function mountModal(props = {}) {
    wrapper = mount(MenuItemFormModal, {
      props: { open: true, categories, ...props },
    })
    await flushPromises()
  }

  it('shows a validation error and does not call the API when name is missing', async () => {
    await mountModal()

    await submitForm()

    expect(document.body.textContent).toContain('Name is required.')
    expect(createMenuItem).not.toHaveBeenCalled()
  })

  it('shows a validation error when no category is selected', async () => {
    await mountModal()

    await setInput('#menu-item-name', 'New Item')
    await setInput('#menu-item-base-price', '9.99')
    await submitForm()

    expect(document.body.textContent).toContain('Category is required.')
    expect(createMenuItem).not.toHaveBeenCalled()
  })

  it('shows a validation error when base price is missing', async () => {
    await mountModal()

    await setInput('#menu-item-name', 'New Item')
    await setInput('#menu-item-category', '1')
    await submitForm()

    expect(document.body.textContent).toContain('Base price is required.')
    expect(createMenuItem).not.toHaveBeenCalled()
  })

  it('submits a create payload with base_price, category and availability defaulting to available', async () => {
    await mountModal()

    await fillValidForm()
    await submitForm()

    const payload = createMenuItem.mock.calls[0][0]
    expect(payload).toBeInstanceOf(FormData)
    expect(payload.get('name')).toBe('New Item')
    expect(payload.get('description')).toBe('A delicious item')
    expect(payload.get('base_price')).toBe('9.99')
    expect(payload.get('category_id')).toBe('1')
    expect(payload.get('is_available')).toBe('1')
    expect(payload.get('image')).toBeNull()
    expect([...payload.keys()].filter((k) => k.startsWith('variants'))).toEqual([])
    expect(toast.success).toHaveBeenCalledWith('Menu item created successfully')
    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('sends is_available 0 when the availability switch is turned off', async () => {
    await mountModal()

    expect(switchValue()).toBe('true')

    document.querySelector('[role="switch"]').click()
    await flushPromises()
    await fillValidForm()
    await submitForm()

    expect(createMenuItem.mock.calls[0][0].get('is_available')).toBe('0')
  })

  it('adds and submits variant rows as variants[i][name] and variants[i][price]', async () => {
    await mountModal()

    clickButton('Add variant')
    await flushPromises()

    await setInput('#variant-name-0', 'Small')
    await setInput('#variant-price-0', '8.00')

    clickButton('Add variant')
    await flushPromises()

    await setInput('#variant-name-1', 'Large')
    await setInput('#variant-price-1', '12.00')

    await fillValidForm()
    await submitForm()

    const payload = createMenuItem.mock.calls[0][0]
    expect(payload.get('variants[0][name]')).toBe('Small')
    expect(payload.get('variants[0][price]')).toBe('8')
    expect(payload.get('variants[1][name]')).toBe('Large')
    expect(payload.get('variants[1][price]')).toBe('12')
  })

  it('skips variant rows that have no name', async () => {
    await mountModal()

    clickButton('Add variant')
    await flushPromises()

    await fillValidForm()
    await submitForm()

    const payload = createMenuItem.mock.calls[0][0]
    expect([...payload.keys()].filter((k) => k.startsWith('variants'))).toEqual([])
  })

  it('removes a variant row so it is not submitted', async () => {
    await mountModal({ menuItem: existingMenuItem })

    const removeButtons = [...document.querySelectorAll('button')].filter((b) =>
      b.getAttribute('aria-label')?.includes('Remove variant'),
    )
    expect(removeButtons).toHaveLength(2)
    removeButtons[0].click()
    await flushPromises()

    await submitForm()

    const payload = updateMenuItem.mock.calls[0][1]
    expect([...payload.keys()].filter((k) => k.startsWith('variants'))).toEqual([
      'variants[0][name]',
      'variants[0][price]',
    ])
    expect(payload.get('variants[0][name]')).toBe('Large')
  })

  it('prefills the form and shows edit labels when editing', async () => {
    await mountModal({ menuItem: existingMenuItem })

    expect(document.body.textContent).toContain('Edit menu item')
    expect(document.body.textContent).toContain('Save changes')
    expect($('#menu-item-name').value).toBe('Chicken Curry')
    expect($('#menu-item-description').value).toBe('Spicy chicken dish')
    expect($('#menu-item-base-price').value).toBe('12.50')
    expect($('#menu-item-category').value).toBe('1')
    expect($('#variant-name-0').value).toBe('Regular')
    expect($('#variant-price-1').value).toBe('14.00')
  })

  it('submits an edit payload with variants replace-all and no image key by default', async () => {
    await mountModal({ menuItem: existingMenuItem })

    await submitForm()

    expect(updateMenuItem).toHaveBeenCalledTimes(1)
    const [id, payload] = updateMenuItem.mock.calls[0]
    expect(id).toBe(5)
    expect(payload).toBeInstanceOf(FormData)
    expect(payload.get('name')).toBe('Chicken Curry')
    expect(payload.get('base_price')).toBe('12.50')
    expect(payload.get('is_available')).toBe('1')
    expect(payload.get('image')).toBeNull()
    expect(payload.get('remove_image')).toBeNull()
    expect(payload.get('variants[0][name]')).toBe('Regular')
    expect(payload.get('variants[0][price]')).toBe('10.00')
    expect(payload.get('variants[1][name]')).toBe('Large')
    expect(payload.get('variants[1][price]')).toBe('14.00')
    expect(payload.get('remove_variants')).toBeNull()
    expect(toast.success).toHaveBeenCalledWith('Menu item updated successfully')
    expect(wrapper.emitted('saved')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('attaches the selected image file and shows a preview', async () => {
    await mountModal()

    const file = new File(['image-data'], 'photo.png', { type: 'image/png' })
    await setFile('#menu-item-image', file)
    await flushPromises()

    const preview = document.querySelector('img[alt="Image preview"]')
    expect(preview).not.toBeNull()
    expect(preview.getAttribute('src')).toBe('blob:mock-preview')

    await fillValidForm()
    await submitForm()

    expect(createMenuItem.mock.calls[0][0].get('image')).toEqual(file)
  })

  it('rejects an image larger than 2MB with a validation error', async () => {
    await mountModal()

    const bigFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', {
      type: 'image/png',
    })
    await setFile('#menu-item-image', bigFile)
    await flushPromises()

    expect(document.body.textContent).toContain('Image must be 2MB or smaller.')
    await fillValidForm()
    await submitForm()

    expect(createMenuItem.mock.calls[0][0].get('image')).toBeNull()
  })

  it('sends remove_variants when all variants are removed in edit mode', async () => {
    await mountModal({ menuItem: existingMenuItem })

    let removeButtons
    do {
      removeButtons = [...document.querySelectorAll('button')].filter((b) =>
        b.getAttribute('aria-label')?.includes('Remove variant'),
      )
      removeButtons[0]?.click()
      await flushPromises()
    } while (removeButtons.length > 0)

    await submitForm()

    const payload = updateMenuItem.mock.calls[0][1]
    expect([...payload.keys()].filter((k) => k.startsWith('variants'))).toEqual([])
    expect(payload.get('remove_variants')).toBe('1')
  })

  it('does not send remove_variants when creating', async () => {
    await mountModal()

    await fillValidForm()
    await submitForm()

    const payload = createMenuItem.mock.calls[0][0]
    expect(payload.get('remove_variants')).toBeNull()
  })

  it('sends remove_image when the current image is removed in edit mode', async () => {
    await mountModal({ menuItem: existingMenuItem })

    const removeImageButton = [...document.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === 'Remove image',
    )
    expect(removeImageButton).toBeTruthy()
    removeImageButton.click()
    await flushPromises()

    await submitForm()

    const payload = updateMenuItem.mock.calls[0][1]
    expect(payload.get('remove_image')).toBe('1')
  })

  it('notifies via toast on API errors and stays open', async () => {
    createMenuItem.mockRejectedValueOnce({
      response: {
        data: {
          message: 'The name has already been taken.',
          errors: { name: ['The name has already been taken.'] },
        },
      },
    })
    await mountModal()

    await fillValidForm()
    await submitForm()

    expect(toast.error).toHaveBeenCalledWith('The name has already been taken.')
    expect(wrapper.emitted('saved')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('emits close when the cancel button is clicked', async () => {
    await mountModal()

    clickButton('Cancel')
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})