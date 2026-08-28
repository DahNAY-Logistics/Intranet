import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithQueryClient } from '@/test/render'
import { api } from '@/lib/api'
import type { AttachmentResponse } from 'core/types/attachments'

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}))

import ImageUploadField from './ImageUploadField'

const mockedPost = vi.mocked(api.post)

function mockImage({ width, height, shouldError = false }: { width?: number; height?: number; shouldError?: boolean }) {
  class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    naturalWidth = 0
    naturalHeight = 0

    set src(_value: string) {
      queueMicrotask(() => {
        if (shouldError) {
          this.onerror?.()
          return
        }
        this.naturalWidth = width ?? 0
        this.naturalHeight = height ?? 0
        this.onload?.()
      })
    }
  }

  vi.stubGlobal('Image', MockImage)
}

function makeFile({ name = 'banner.jpg', type = 'image/jpeg', size = 1024 }: Partial<{ name: string; type: string; size: number }> = {}) {
  const file = new File([new Uint8Array(size)], name, { type })
  return file
}

beforeEach(() => {
  vi.resetAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
})

async function uploadFile(file: File) {
  const user = userEvent.setup()
  renderWithQueryClient(<ImageUploadField value={null} onChange={vi.fn()} />)
  const input = screen.getByTestId('banner-image-input')
  await user.upload(input, file)
  return user
}

describe('ImageUploadField', () => {
  it('rejects a disallowed file type without calling the API', async () => {
    mockImage({ width: 1800, height: 720 })
    const user = userEvent.setup({ applyAccept: false })
    renderWithQueryClient(<ImageUploadField value={null} onChange={vi.fn()} />)
    const input = screen.getByTestId('banner-image-input')

    await user.upload(input, makeFile({ type: 'image/gif' }))

    expect(await screen.findByText('Only JPEG, PNG, or WebP images are allowed.')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('rejects an oversized file without calling the API', async () => {
    mockImage({ width: 1800, height: 720 })
    await uploadFile(makeFile({ size: 6 * 1024 * 1024 }))

    expect(await screen.findByText('Image exceeds the maximum upload size.')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('rejects a file narrower than the minimum width without calling the API', async () => {
    mockImage({ width: 400, height: 300 })
    await uploadFile(makeFile())

    expect(await screen.findByText('Image must be at least 800px wide.')).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('rejects a wide-enough but non-landscape file without calling the API', async () => {
    mockImage({ width: 900, height: 700 })
    await uploadFile(makeFile())

    expect(await screen.findByText(/must be landscape/)).toBeInTheDocument()
    expect(mockedPost).not.toHaveBeenCalled()
  })

  it('uploads a valid file and reports the new attachment id', async () => {
    mockImage({ width: 1800, height: 720 })
    const attachment: AttachmentResponse = { id: 1, url: 'http://blob/att-1.jpg', createdAt: '2026-01-01T00:00:00.000Z' }
    mockedPost.mockResolvedValue({ data: attachment })

    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithQueryClient(<ImageUploadField value={null} onChange={onChange} />)
    const input = screen.getByTestId('banner-image-input')
    await user.upload(input, makeFile())

    await waitFor(() => expect(mockedPost).toHaveBeenCalledWith('/attachments', expect.any(FormData), expect.anything()))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(1))
  })

  it('shows an upload error from the server', async () => {
    mockImage({ width: 1800, height: 720 })
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Image must be landscape (wider than it is tall) to fit the homepage slider.' } },
    })

    await uploadFile(makeFile())

    expect(await screen.findByText('Image must be landscape (wider than it is tall) to fit the homepage slider.')).toBeInTheDocument()
  })
})
