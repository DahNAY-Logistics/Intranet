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
import { createQuickLinkSchema, type CreateQuickLinkInput } from 'core/schemas/quick-links'
import { quickLinkStatuses } from 'core/constants'
import { quickLinkMessages } from 'core/messages'
import type { QuickLinkResponse } from 'core/types/quick-links'
import type { CategoriesResponse } from 'core/types/categories'
import { useQuickLinksStore } from '@/stores/quick-links-store'

type QuickLinkFormProps = {
  quickLink?: QuickLinkResponse
  onSuccess: () => void
}

const STATUS_OPTIONS = [
  { value: quickLinkStatuses.published, label: quickLinkStatuses.published },
  { value: quickLinkStatuses.archived, label: quickLinkStatuses.archived },
]

export default function QuickLinkForm({ quickLink, onSuccess }: QuickLinkFormProps) {
  const isEdit = quickLink !== undefined
  const queryClient = useQueryClient()
  const setCategoriesOpen = useQuickLinksStore((state) => state.setCategoriesOpen)

  const categories = useQuery({
    queryKey: ['quick-link-categories'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/quick-links/categories', { signal })
      return data
    },
  })

  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<z.input<typeof createQuickLinkSchema>, unknown, CreateQuickLinkInput>({
    resolver: zodResolver(createQuickLinkSchema),
    defaultValues: quickLink
      ? {
          title: quickLink.title,
          excerpt: quickLink.excerpt,
          url: quickLink.url,
          categoryId: quickLink.category.id,
          status: quickLink.status,
        }
      : {},
  })

  const saveQuickLink = useMutation({
    mutationFn: async (values: CreateQuickLinkInput) => {
      if (isEdit) {
        await api.put(`/quick-links/${quickLink.id}`, values)
        return
      }
      await api.post('/quick-links', values)
    },
    onSuccess: async (_result, values) => {
      await queryClient.invalidateQueries({ queryKey: ['quick-links'] })
      toast.success(isEdit ? quickLinkMessages.UPDATED(values.title) : quickLinkMessages.CREATED(values.title))
      onSuccess()
    },
  })

  const hasCategories = categories.isSuccess && categories.data.categories.length > 0

  return (
    <form onSubmit={handleSubmit((values) => saveQuickLink.mutate(values))} className="space-y-4" autoComplete="off" noValidate>
      {saveQuickLink.isError && (
        <ErrorAlert
          error={saveQuickLink.error}
          fallback={isEdit ? 'Failed to update quick link.' : 'Failed to create quick link.'}
        />
      )}

      <div className="form-field">
        <Label htmlFor="title">Title</Label>
        <Input id="title" autoComplete="off" placeholder="Employee handbook" {...register('title')} />
        <ErrorMessage message={errors.title?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          autoComplete="off"
          placeholder="Short summary shown on the quick link"
          {...register('excerpt')}
        />
        <ErrorMessage message={errors.excerpt?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="url">URL</Label>
        <Input id="url" type="url" autoComplete="off" placeholder="https://example.com/page" {...register('url')} />
        <ErrorMessage message={errors.url?.message} />
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
        <Button type="submit" disabled={saveQuickLink.isPending || !hasCategories || (isEdit && !isDirty)}>
          {isEdit
            ? saveQuickLink.isPending
              ? 'Saving…'
              : 'Save Changes'
            : saveQuickLink.isPending
              ? 'Creating…'
              : 'Create Quick Link'}
        </Button>
      </DialogFooter>
    </form>
  )
}
