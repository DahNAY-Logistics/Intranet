import { create } from 'zustand'

import type { EventResponse } from 'core/types/events'

type EventsStore = {
  page: number
  pageSize: number
  statusFilter: string[]
  categoryFilter: string[]
  modeFilter: string[]
  sortOrder: 'asc' | 'desc'
  editingId: number | null
  setEditingId: (id: number | null) => void
  deleting: EventResponse | null
  setDeleting: (event: EventResponse | null) => void
  categoriesOpen: boolean
  setCategoriesOpen: (open: boolean) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setStatusFilter: (values: string[]) => void
  setCategoryFilter: (values: string[]) => void
  setModeFilter: (values: string[]) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
}

export const useEventsStore = create<EventsStore>()((set) => ({
  page: 1,
  pageSize: 10,
  statusFilter: [],
  categoryFilter: [],
  modeFilter: [],
  sortOrder: 'desc',
  editingId: null,
  setEditingId: (editingId) => set({ editingId }),
  deleting: null,
  setDeleting: (deleting) => set({ deleting }),
  categoriesOpen: false,
  setCategoriesOpen: (categoriesOpen) => set({ categoriesOpen }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter, page: 1 }),
  setModeFilter: (modeFilter) => set({ modeFilter, page: 1 }),
  setSortOrder: (sortOrder) => set({ sortOrder, page: 1 }),
}))
