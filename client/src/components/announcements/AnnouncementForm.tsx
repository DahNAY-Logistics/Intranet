import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Tag } from 'lucide-react'
import type { z } from 'zod'

import { api } from '@/lib/api'
import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import ErrorAlert from '@/components/ErrorAlert'
import ErrorMessage from '@/components/ErrorMessage'
import { createAnnouncementSchema, type CreateAnnouncementInput } from 'core/schemas/announcements'
import { announcementStatuses } from 'core/constants'
import { announcementMessages } from 'core/messages'
import type { AnnouncementResponse } from 'core/types/announcements'
import type { CategoriesResponse } from 'core/types/categories'
import { useAnnouncementsStore } from '@/stores/announcements-store'

type AnnouncementFormProps = {
  announcement?: AnnouncementResponse
  onSuccess: () => void
}

const STATUS_OPTIONS = [
  { value: announcementStatuses.published, label: announcementStatuses.published },
  { value: announcementStatuses.archived, label: announcementStatuses.archived },
]

export default function AnnouncementForm({ announcement, onSuccess }: AnnouncementFormProps) {
  const isEdit = announcement !== undefined
  const queryClient = useQueryClient()
  const setCategoriesOpen = useAnnouncementsStore((state) => state.setCategoriesOpen)

  const categories = useQuery({
    queryKey: ['announcement-categories'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/announcements/categories', { signal })
      return data
    },
  })

  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<z.input<typeof createAnnouncementSchema>, unknown, CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: announcement
      ? {
          title: announcement.title,
          excerpt: announcement.excerpt,
          categoryId: announcement.category.id,
          status: announcement.status,
        }
      : {},
  })

  const saveAnnouncement = useMutation({
    mutationFn: async (values: CreateAnnouncementInput) => {
      if (isEdit) {
        await api.put(`/announcements/${announcement.id}`, values)
        return
      }
      await api.post('/announcements', values)
    },
    onSuccess: async (_result, values) => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast.success(isEdit ? announcementMessages.UPDATED(values.title) : announcementMessages.CREATED(values.title))
      onSuccess()
    },
  })

  const hasCategories = categories.isSuccess && categories.data.categories.length > 0

  return (
    <form onSubmit={handleSubmit((values) => saveAnnouncement.mutate(values))} className="space-y-4" autoComplete="off">
      {saveAnnouncement.isError && (
        <ErrorAlert
          error={saveAnnouncement.error}
          fallback={isEdit ? 'Failed to update announcement.' : 'Failed to create announcement.'}
        />
      )}

      <div className="form-field">
        <Label htmlFor="title">Title</Label>
        <Input id="title" autoComplete="off" placeholder="Q3 town hall recap" {...register('title')} />
        <ErrorMessage message={errors.title?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          autoComplete="off"
          placeholder="Short summary shown on the announcement"
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

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={saveAnnouncement.isPending || !hasCategories || (isEdit && !isDirty)}>
          {isEdit
            ? saveAnnouncement.isPending
              ? 'Saving…'
              : 'Save Changes'
            : saveAnnouncement.isPending
              ? 'Creating…'
              : 'Create Announcement'}
        </Button>
      </DialogFooter>
    </form>
  )
}
