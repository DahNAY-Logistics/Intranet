import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { api } from '@/lib/api'
import { ErrorState } from '@/components/shared'
import { bannerStatuses } from 'core/constants'
import type { BannerStatus } from 'core/constants'
import type { BannersResponse } from 'core/types/banners'
import { useBannersStore } from '@/stores/banners-store'

import BannerCard from './BannerCard'
import BannerGrid from './BannerGrid'
import DeleteDialog from './DeleteDialog'
import EditDialog from './EditDialog'

type BannerTabProps = {
  status: BannerStatus
}

type ReorderItem = { id: number; displayOrder: number }

export default function BannerTab({ status }: BannerTabProps) {
  const queryClient = useQueryClient()
  const editingId = useBannersStore((state) => state.editingId)
  const setEditingId = useBannersStore((state) => state.setEditingId)
  const deleting = useBannersStore((state) => state.deleting)
  const setDeleting = useBannersStore((state) => state.setDeleting)
  const [activeId, setActiveId] = useState<number | null>(null)

  const queryKey = ['banners', status]

  const banners = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<BannersResponse>('/banners', { signal, params: { status } })
      return data
    },
  })

  const reorder = useMutation({
    mutationFn: async (items: ReorderItem[]) => {
      await api.patch('/banners/reorder', { items })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as number)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)

    const { active, over } = event
    if (!over || active.id === over.id || !banners.data) return

    const ids = banners.data.banners.map((banner) => banner.id)
    const oldIndex = ids.indexOf(active.id as number)
    const newIndex = ids.indexOf(over.id as number)
    const reorderedIds = arrayMove(ids, oldIndex, newIndex)
    const items = reorderedIds.map((id, index) => ({ id, displayOrder: index + 1 }))

    const previous = banners.data
    const orderById = new Map(items.map((item) => [item.id, item.displayOrder]))
    const reordered = [...previous.banners].sort(
      (a, b) => (orderById.get(a.id) ?? a.displayOrder) - (orderById.get(b.id) ?? b.displayOrder),
    )
    queryClient.setQueryData<BannersResponse>(queryKey, { banners: reordered })

    reorder.mutate(items, {
      onError: () => {
        queryClient.setQueryData(queryKey, previous)
      },
    })
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const isPublished = status === bannerStatuses.published
  const list = banners.data?.banners ?? []
  const activeBanner = list.find((banner) => banner.id === activeId) ?? null

  const grid = (
    <BannerGrid
      banners={list}
      isLoading={banners.isPending}
      sortable={isPublished}
      onEdit={(banner) => setEditingId(banner.id)}
      onDelete={(banner) => setDeleting(banner)}
      emptyMessage={isPublished ? 'No published banners yet.' : 'No archived banners.'}
    />
  )

  return (
    <div className="stack-4">
      {banners.isError ? (
        <ErrorState error={banners.error} fallback="Failed to load banners." />
      ) : isPublished ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={list.map((banner) => banner.id)} strategy={rectSortingStrategy}>
            {grid}
          </SortableContext>
          <DragOverlay>
            {activeBanner && (
              <div className="pointer-events-none shadow-lg">
                <BannerCard banner={activeBanner} onEdit={() => {}} onDelete={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        grid
      )}

      <EditDialog id={editingId} onOpenChange={(open) => !open && setEditingId(null)} />
      <DeleteDialog banner={deleting} onOpenChange={(open) => !open && setDeleting(null)} onDeleted={() => setDeleting(null)} />
    </div>
  )
}
