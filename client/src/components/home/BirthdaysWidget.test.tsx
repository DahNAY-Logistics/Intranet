import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'

import { api } from '@/lib/api'
import { renderWithQueryClient } from '@/test/render'

import BirthdaysWidget from './BirthdaysWidget'

vi.mock('@/lib/api', () => ({ api: { get: vi.fn() } }))

const mockedGet = vi.mocked(api.get)

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-06-15T09:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('BirthdaysWidget', () => {
  it('requests the birthdays highlight', async () => {
    mockedGet.mockResolvedValue({ data: { birthdays: [] } })

    renderWithQueryClient(<BirthdaysWidget />)

    await waitFor(() =>
      expect(mockedGet).toHaveBeenCalledWith('/users/highlights/birthdays', expect.anything()),
    )
  })

  it("labels a person whose birthday is today", async () => {
    mockedGet.mockResolvedValue({
      data: { birthdays: [{ id: 'u1', name: 'Ada Lovelace', day: 15, month: 6, department: null }] },
    })

    renderWithQueryClient(<BirthdaysWidget />)

    expect(await screen.findByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('lists other birthdays in the month as chips without a today label', async () => {
    mockedGet.mockResolvedValue({
      data: {
        birthdays: [{ id: 'u2', name: 'Grace Hopper', day: 22, month: 6, department: { id: 1, name: 'Engineering' } }],
      },
    })

    renderWithQueryClient(<BirthdaysWidget />)

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.queryByText('Today')).not.toBeInTheDocument()
  })

  it('shows an empty message when nobody has a birthday', async () => {
    mockedGet.mockResolvedValue({ data: { birthdays: [] } })

    renderWithQueryClient(<BirthdaysWidget />)

    expect(await screen.findByText('No birthdays this month.')).toBeInTheDocument()
  })

  it('shows placeholders while loading', () => {
    mockedGet.mockReturnValue(new Promise(() => {}))

    renderWithQueryClient(<BirthdaysWidget />)

    expect(screen.queryByText('No birthdays this month.')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.sk-circle').length).toBeGreaterThan(0)
  })
})
