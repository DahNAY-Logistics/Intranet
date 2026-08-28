import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarIcon, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'

import { api } from '@/lib/api'
import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import ErrorAlert from '@/components/ErrorAlert'
import ErrorMessage from '@/components/ErrorMessage'
import ImageUploadField from '@/components/ImageUploadField'
import { createBannerSchema, type CreateBannerInput } from 'core/schemas/banners'
import { bannerStatuses } from 'core/constants'
import { bannerMessages } from 'core/messages'
import type { BannerResponse } from 'core/types/banners'
import type { CategoriesResponse } from 'core/types/categories'
import { useBannersStore } from '@/stores/banners-store'

type BannerFormProps = {
  banner?: BannerResponse
  onSuccess: () => void
}

const STATUS_OPTIONS = [
  { value: bannerStatuses.published, label: bannerStatuses.published },
  { value: bannerStatuses.archived, label: bannerStatuses.archived },
]

export default function BannerForm({ banner, onSuccess }: BannerFormProps) {
  const isEdit = banner !== undefined
  const queryClient = useQueryClient()
  const setCategoriesOpen = useBannersStore((state) => state.setCategoriesOpen)

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/banners/categories', { signal })
      return data
    },
  })

  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<z.input<typeof createBannerSchema>, unknown, CreateBannerInput>({
    resolver: zodResolver(createBannerSchema),
    defaultValues: banner
      ? {
          title: banner.title,
          excerpt: banner.excerpt,
          categoryId: banner.category.id,
          attachmentId: banner.attachment.id,
          status: banner.status,
          startDate: new Date(banner.startDate),
          endDate: new Date(banner.endDate),
        }
      : {},
  })

  const saveBanner = useMutation({
    mutationFn: async (values: CreateBannerInput) => {
      if (isEdit) {
        await api.put(`/banners/${banner.id}`, values)
        return
      }
      await api.post('/banners', values)
    },
    onSuccess: async (_result, values) => {
      await queryClient.invalidateQueries({ queryKey: ['banners'] })
      toast.success(isEdit ? bannerMessages.UPDATED(values.title) : bannerMessages.CREATED(values.title))
      onSuccess()
    },
  })

  const hasCategories = categories.isSuccess && categories.data.categories.length > 0

  return (
    <form onSubmit={handleSubmit((values) => saveBanner.mutate(values))} className="space-y-4" autoComplete="off">
      {saveBanner.isError && (
        <ErrorAlert error={saveBanner.error} fallback={isEdit ? 'Failed to update banner.' : 'Failed to create banner.'} />
      )}

      <div className="form-field">
        <Label htmlFor="title">Title</Label>
        <Input id="title" autoComplete="off" placeholder="Summer sale kickoff" {...register('title')} />
        <ErrorMessage message={errors.title?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          autoComplete="off"
          placeholder="Short summary shown on the banner"
          {...register('excerpt')}
        />
        <ErrorMessage message={errors.excerpt?.message} />
      </div>

      <div className="form-grid-2">
        <div className="form-field">
          <Label htmlFor="category">Category</Label>

          {categories.isPending && <Skeleton className="skeleton-select" />}
          {categories.isError && <ErrorAlert error={categories.error} fallback="Failed to load categories." />}

          {categories.isSuccess && !hasCategories && (
            <EmptyState icon={Tag} message="No categories yet." compact>
              <Button type="button" variant="outline" size="sm" onClick={() => setCategoriesOpen(true)}>
                Add a category
              </Button>
            </EmptyState>
          )}

          {hasCategories && (
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value ?? null} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select the category">
                      {(value: number | null) =>
                        categories.data.categories.find((category) => category.id === value)?.name ??
                        'Select the category'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.data.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          <ErrorMessage message={errors.categoryId?.message} />
        </div>

        <div className="form-field">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <ErrorMessage message={errors.status?.message} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="form-field">
          <Label>Start Date</Label>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => {
              const value = field.value as Date | undefined
              return (
                <Popover>
                  <PopoverTrigger
                    render={<Button type="button" variant="outline" className="date-trigger-compact" />}
                  >
                    <CalendarIcon className="shrink-0" />
                    <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
                  </PopoverTrigger>
                  <PopoverContent className="popover-auto">
                    <Calendar mode="single" captionLayout="dropdown" selected={value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          <ErrorMessage message={errors.startDate?.message} />
        </div>

        <div className="form-field">
          <Label>End Date</Label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => {
              const value = field.value as Date | undefined
              return (
                <Popover>
                  <PopoverTrigger
                    render={<Button type="button" variant="outline" className="date-trigger-compact" />}
                  >
                    <CalendarIcon className="shrink-0" />
                    <span className="truncate">{value ? format(value, 'PPP') : 'Pick a date'}</span>
                  </PopoverTrigger>
                  <PopoverContent className="popover-auto">
                    <Calendar mode="single" captionLayout="dropdown" selected={value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          <ErrorMessage message={errors.endDate?.message} />
        </div>
      </div>

      <div className="form-field">
        <Label>Banner Image</Label>
        <Controller
          control={control}
          name="attachmentId"
          render={({ field }) => (
            <ImageUploadField value={(field.value as number | undefined) ?? null} onChange={(id) => field.onChange(id ?? undefined)} previewUrl={banner?.attachment.url} />
          )}
        />
        <ErrorMessage message={errors.attachmentId?.message} />
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={saveBanner.isPending || !hasCategories || (isEdit && !isDirty)}>
          {isEdit
            ? saveBanner.isPending
              ? 'Saving…'
              : 'Save Changes'
            : saveBanner.isPending
              ? 'Creating…'
              : 'Create Banner'}
        </Button>
      </DialogFooter>
    </form>
  )
}
