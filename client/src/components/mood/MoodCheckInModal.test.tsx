import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { MoodCheckInStatusResponse } from 'core/types/mood-check-ins'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import { useMoodStore } from '@/stores/mood-store'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

import MoodCheckInModal from './MoodCheckInModal'

const mockedGet = vi.mocked(api.get)
const mockedPost = vi.mocked(api.post)

function makeStatus(checkedIn: boolean): MoodCheckInStatusResponse {
  return { checkedIn }
}

beforeEach(() => {
  vi.resetAllMocks()
  useMoodStore.setState({ open: false })
})

describe('MoodCheckInModal', () => {
  it('stays closed when the employee already checked in today', async () => {
    mockedGet.mockResolvedValue({ data: makeStatus(true) })
    renderWithQueryClient(<MoodCheckInModal />)

    await waitFor(() => expect(mockedGet).toHaveBeenCalledWith('/mood-check-ins/status', expect.anything()))
    expect(screen.queryByText('How are you feeling today?')).not.toBeInTheDocument()
  })

  it('auto-opens with all five mood options when the employee has not checked in today', async () => {
    mockedGet.mockResolvedValue({ data: makeStatus(false) })
    renderWithQueryClient(<MoodCheckInModal />)

    expect(await screen.findByText('How are you feeling today?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Very Happy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Happy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Neutral' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sad' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Very Sad' })).toBeInTheDocument()
  })

  it('submits the picked mood and shows a thank-you message', async () => {
    mockedGet.mockResolvedValue({ data: makeStatus(false) })
    mockedPost.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    renderWithQueryClient(<MoodCheckInModal />)

    await user.click(await screen.findByRole('button', { name: 'Happy' }))

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/mood-check-ins', { mood: 'Happy' }))
    expect(await screen.findByText('Thanks for checking in!')).toBeInTheDocument()
  })

  it('disables the mood buttons while the submission is pending', async () => {
    mockedGet.mockResolvedValue({ data: makeStatus(false) })
    mockedPost.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderWithQueryClient(<MoodCheckInModal />)

    const happyButton = await screen.findByRole('button', { name: 'Happy' })
    await user.click(happyButton)

    expect(happyButton).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Neutral' })).toBeDisabled()
  })

  it('shows the server error message inline on failure', async () => {
    mockedGet.mockResolvedValue({ data: makeStatus(false) })
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'You have already checked in today.' } },
    })
    const user = userEvent.setup()
    renderWithQueryClient(<MoodCheckInModal />)

    await user.click(await screen.findByRole('button', { name: 'Sad' }))

    expect(await screen.findByText('You have already checked in today.')).toBeInTheDocument()
    expect(screen.queryByText('Thanks for checking in!')).not.toBeInTheDocument()
  })
})
