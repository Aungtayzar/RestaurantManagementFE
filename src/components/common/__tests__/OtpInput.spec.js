import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import OtpInput from '../OtpInput.vue'

describe('OtpInput', () => {
  function createWrapper(props = {}) {
    return mount(OtpInput, {
      props: { modelValue: '', 'onUpdate:modelValue': vi.fn(), length: 6, ...props },
    })
  }

  it('renders the correct number of inputs', () => {
    const wrapper = createWrapper()
    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(6)
  })

  it('focuses the first input on mount', async () => {
    const wrapper = createWrapper()
    const firstInput = wrapper.find('input')
    expect(firstInput.exists()).toBe(true)
    expect(firstInput.attributes('aria-label')).toBe('Digit 1 of 6')
  })

  it('emits update:modelValue when a digit is entered', async () => {
    const onUpdate = vi.fn()
    const wrapper = createWrapper({ 'onUpdate:modelValue': onUpdate })
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('1')
    await wrapper.vm.$nextTick()

    expect(onUpdate).toHaveBeenCalled()
  })

  it('advances to next input after entering a digit', async () => {
    const wrapper = createWrapper()
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('1')
    await wrapper.vm.$nextTick()

    expect(inputs[1].attributes('aria-label')).toBe('Digit 2 of 6')
  })

  it('goes back to previous input on backspace', async () => {
    const wrapper = createWrapper({ modelValue: '12' })
    const inputs = wrapper.findAll('input')

    await inputs[1].trigger('keydown', { key: 'Backspace' })
    await wrapper.vm.$nextTick()

    expect(inputs[0].attributes('aria-label')).toBe('Digit 1 of 6')
  })

  it('handles paste of full OTP', async () => {
    const onUpdate = vi.fn()
    const wrapper = createWrapper({ 'onUpdate:modelValue': onUpdate })

    const pasteEvent = new Event('paste', { bubbles: true })
    pasteEvent.clipboardData = { getData: () => '123456' }
    await wrapper.find('input').element.dispatchEvent(pasteEvent)
    await wrapper.vm.$nextTick()

    expect(onUpdate).toHaveBeenCalledWith('123456')
  })

  it('filters non-numeric characters', async () => {
    const onUpdate = vi.fn()
    const wrapper = createWrapper({ 'onUpdate:modelValue': onUpdate })
    const inputs = wrapper.findAll('input')

    await inputs[0].setValue('a')
    await wrapper.vm.$nextTick()

    expect(onUpdate).not.toHaveBeenCalled()
  })
})
