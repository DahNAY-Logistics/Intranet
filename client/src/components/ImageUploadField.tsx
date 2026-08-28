import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { UploadCloud, X } from 'lucide-react'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import ErrorAlert from '@/components/ErrorAlert'
import { attachmentLimits, bannerImageConstraints } from 'core/constants'
import { bannerMessages } from 'core/messages'
import type { AttachmentResponse } from 'core/types/attachments'

type ImageUploadFieldProps = {
  value: number | null
  onChange: (attachmentId: number | null) => void
  previewUrl?: string | null
}

const maxFileSizeMb = attachmentLimits.maxFileSizeBytes / (1024 * 1024)

const requirementText = `JPEG, PNG, or WebP, up to ${maxFileSizeMb}MB, at least ${bannerImageConstraints.minWidthPx}px wide, landscape orientation`

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      reject(new Error('unreadable'))
      URL.revokeObjectURL(url)
    }
    image.src = url
  })
}

function validateDimensions({ width, height }: { width: number; height: number }): string | null {
  if (width < bannerImageConstraints.minWidthPx) {
    return bannerMessages.IMAGE_DIMENSIONS_INVALID(bannerImageConstraints.minWidthPx)
  }

  if (width / height < bannerImageConstraints.minAspectRatio) {
    return bannerMessages.IMAGE_ASPECT_RATIO_INVALID
  }

  return null
}

export default function ImageUploadField({ onChange, previewUrl }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<AttachmentResponse>('/attachments', formData, {
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100))
        },
      })
      return data
    },
    onSuccess: (attachment) => {
      onChange(attachment.id)
      setLocalPreview(attachment.url)
    },
  })

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setLocalError(null)
    onChange(null)
    setLocalPreview(null)

    if (!(attachmentLimits.allowedMimeTypes as readonly string[]).includes(file.type)) {
      setLocalError(bannerMessages.INVALID_IMAGE_TYPE)
      return
    }

    if (file.size > attachmentLimits.maxFileSizeBytes) {
      setLocalError(bannerMessages.IMAGE_TOO_LARGE)
      return
    }

    let dimensions: { width: number; height: number }
    try {
      dimensions = await readImageDimensions(file)
    } catch {
      setLocalError(bannerMessages.IMAGE_UNREADABLE)
      return
    }

    const dimensionError = validateDimensions(dimensions)
    if (dimensionError) {
      setLocalError(dimensionError)
      return
    }

    setProgress(0)
    upload.mutate(file)
  }

  const preview = localPreview ?? previewUrl ?? null

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={attachmentLimits.allowedMimeTypes.join(',')}
        className="hidden"
        onChange={handleFileChange}
        data-testid="banner-image-input"
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img src={preview} alt="Banner preview" className="aspect-7/2 w-full object-cover" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => {
              onChange(null)
              setLocalPreview(null)
              inputRef.current?.click()
            }}
          >
            <X />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud />
          {upload.isPending ? `Uploading… ${progress}%` : 'Upload banner image'}
        </Button>
      )}

      <p className="meta-text">{requirementText}</p>

      {localError && <ErrorAlert fallback={localError} />}
      {upload.isError && <ErrorAlert error={upload.error} fallback="Failed to upload image." />}
    </div>
  )
}
