import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorAlert from '@/components/ErrorAlert'
import ErrorMessage from '@/components/ErrorMessage'
import { createCategorySchema, type CreateCategoryInput } from 'core/schemas/categories'
import { categoryMessages } from 'core/messages'
import type { CategoriesResponse, CategoryListItem } from 'core/types/categories'

import EmptyState from './EmptyState'

async function refreshCategories(queryClient: QueryClient, queryKey: unknown[]) {
  await queryClient.cancelQueries({ queryKey })
  await queryClient.invalidateQueries({ queryKey })
}

function pluralizeEntityLabel(entityLabel: string) {
  const lower = entityLabel.toLowerCase()
  return lower.endsWith('y') ? `${lower.slice(0, -1)}ies` : `${lower}s`
}

type CategoryRowProps = {
  category: CategoryListItem
  basePath: string
  queryKey: unknown[]
  entityLabel: string
}

function CategoryRow({ category, basePath, queryKey, entityLabel }: CategoryRowProps) {
  const queryClient = useQueryClient()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(category.name)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!isRenaming) setRenameValue(category.name)
  }, [category.name, isRenaming])

  const rename = useMutation({
    mutationFn: async (name: string) => {
      await api.put(`${basePath}/${category.id}`, { name })
    },
    onSuccess: async (_data, name) => {
      toast.success(categoryMessages.UPDATED(entityLabel, name))
      setIsRenaming(false)
      await refreshCategories(queryClient, queryKey)
    },
  })

  const remove = useMutation({
    mutationFn: async () => {
      await api.delete(`${basePath}/${category.id}`)
    },
    onSuccess: async () => {
      toast.success(categoryMessages.DELETED(entityLabel, category.name))
      setConfirmingDelete(false)
      await refreshCategories(queryClient, queryKey)
    },
  })

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1.5" data-testid={`category-row-${category.id}`}>
        <Input
          autoFocus
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          className="h-7"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={rename.isPending || renameValue.trim() === '' || renameValue.trim() === category.name}
          onClick={() => rename.mutate(renameValue)}
        >
          <Check />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={rename.isPending}
          onClick={() => setIsRenaming(false)}
        >
          <X />
        </Button>
      </div>
    )
  }

  const inUse = category.count > 0

  return (
    <>
      <div className="row-between" data-testid={`category-row-${category.id}`}>
        <span className="flex items-baseline gap-1 text-sm">
          <span>{category.name}</span>
          <span className="text-muted-foreground">({category.count})</span>
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsRenaming(true)}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={inUse}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      {rename.isError && <ErrorAlert error={rename.error} fallback={`Failed to rename ${entityLabel.toLowerCase()}.`} />}

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete ${entityLabel.toLowerCase()} "${category.name}"?`}</AlertDialogTitle>
          </AlertDialogHeader>

          {remove.isError && <ErrorAlert error={remove.error} fallback={`Failed to delete ${entityLabel.toLowerCase()}.`} />}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type CreateCategoryFormProps = {
  basePath: string
  queryKey: unknown[]
  entityLabel: string
}

function CreateCategoryForm({ basePath, queryKey, entityLabel }: CreateCategoryFormProps) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<z.input<typeof createCategorySchema>, unknown, CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '' },
  })

  const create = useMutation({
    mutationFn: async (values: CreateCategoryInput) => {
      await api.post(basePath, values)
    },
    onSuccess: async (_data, values) => {
      toast.success(categoryMessages.CREATED(entityLabel, values.name))
      reset({ name: '' })
      await refreshCategories(queryClient, queryKey)
    },
  })

  const hasChange = watch('name').trim() !== ''

  return (
    <>
      <form
        onSubmit={handleSubmit((values) => create.mutate(values))}
        className="flex items-start gap-1.5"
        autoComplete="off"
      >
        <div className="flex-1 space-y-1">
          <Input placeholder={`New ${entityLabel.toLowerCase()} name`} autoComplete="off" {...register('name')} />
          <ErrorMessage message={errors.name?.message} />
        </div>
        <Button type="submit" size="icon" disabled={create.isPending || !hasChange}>
          <Plus />
        </Button>
      </form>

      {create.isError && <ErrorAlert error={create.error} fallback={`Failed to create ${entityLabel.toLowerCase()}.`} />}
    </>
  )
}

type CategoriesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  basePath: string
  queryKey: unknown[]
  title: string
  entityLabel: string
  description: string
}

export default function CategoriesDialog({
  open,
  onOpenChange,
  basePath,
  queryKey,
  title,
  entityLabel,
  description,
}: CategoriesDialogProps) {
  const categories = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<CategoriesResponse>(basePath, { signal })
      return data
    },
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <CreateCategoryForm key={String(open)} basePath={basePath} queryKey={queryKey} entityLabel={entityLabel} />

        <div className="space-y-2">
          {categories.isPending && (
            <>
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-full" />
            </>
          )}

          {categories.isError && (
            <ErrorAlert error={categories.error} fallback={`Failed to load ${pluralizeEntityLabel(entityLabel)}.`} />
          )}

          {categories.isSuccess && categories.data.categories.length === 0 && (
            <EmptyState icon={Tag} message={`No ${pluralizeEntityLabel(entityLabel)} yet.`} compact />
          )}

          {categories.isSuccess &&
            categories.data.categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                basePath={basePath}
                queryKey={queryKey}
                entityLabel={entityLabel}
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
