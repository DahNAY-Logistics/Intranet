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
import { createResourceSchema, type CreateResourceInput } from 'core/schemas/resources'
import { resourceStatuses } from 'core/constants'
import { resourceMessages } from 'core/messages'
import type { ResourceResponse } from 'core/types/resources'
import type { CategoriesResponse } from 'core/types/categories'
import { useResourcesStore } from '@/stores/resources-store'

import MarkdownEditor from './MarkdownEditor'

type ResourceFormProps = {
  resource?: ResourceResponse
  onSuccess: () => void
}

const STATUS_OPTIONS = [
  { value: resourceStatuses.published, label: resourceStatuses.published },
  { value: resourceStatuses.archived, label: resourceStatuses.archived },
]

export default function ResourceForm({ resource, onSuccess }: ResourceFormProps) {
  const isEdit = resource !== undefined
  const queryClient = useQueryClient()
  const setCategoriesOpen = useResourcesStore((state) => state.setCategoriesOpen)

  const categories = useQuery({
    queryKey: ['resource-categories'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>('/resources/categories', { signal })
      return data
    },
  })

  const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<z.input<typeof createResourceSchema>, unknown, CreateResourceInput>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: resource
      ? {
          title: resource.title,
          excerpt: resource.excerpt,
          content: resource.content,
          url: resource.url ?? '',
          categoryId: resource.category.id,
          status: resource.status,
        }
      : { content: '' },
  })

  const saveResource = useMutation({
    mutationFn: async (values: CreateResourceInput) => {
      if (isEdit) {
        await api.put(`/resources/${resource.id}`, values)
        return
      }
      await api.post('/resources', values)
    },
    onSuccess: async (_result, values) => {
      await queryClient.invalidateQueries({ queryKey: ['resources'] })
      toast.success(isEdit ? resourceMessages.UPDATED(values.title) : resourceMessages.CREATED(values.title))
      onSuccess()
    },
  })

  const hasCategories = categories.isSuccess && categories.data.categories.length > 0

  return (
    <form onSubmit={handleSubmit((values) => saveResource.mutate(values))} className="stack-4" autoComplete="off" noValidate>
      {saveResource.isError && (
        <ErrorAlert
          error={saveResource.error}
          fallback={isEdit ? 'Failed to update resource.' : 'Failed to create resource.'}
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
          placeholder="Short summary shown on the resource"
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

      <div className="form-field">
        <Label htmlFor="url">URL</Label>
        <Input id="url" type="url" autoComplete="off" placeholder="https://example.com/page" {...register('url')} />
        <ErrorMessage message={errors.url?.message} />
      </div>

      <div className="form-field">
        <Label htmlFor="content">Content</Label>
        <Controller
          control={control}
          name="content"
          render={({ field }) => <MarkdownEditor initialValue={field.value} onChange={field.onChange} />}
        />
        <ErrorMessage message={errors.content?.message} />
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <Button type="submit" disabled={saveResource.isPending || !hasCategories || (isEdit && !isDirty)}>
          {isEdit
            ? saveResource.isPending
              ? 'Saving…'
              : 'Save Changes'
            : saveResource.isPending
              ? 'Creating…'
              : 'Create Resource'}
        </Button>
      </DialogFooter>
    </form>
  )
}
