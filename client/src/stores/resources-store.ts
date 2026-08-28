import { create } from 'zustand'

import type { ResourceResponse } from 'core/types/resources'

type ResourcesStore = {
  page: number
  pageSize: number
  statusFilter: string[]
  categoryFilter: string[]
  sortOrder: 'asc' | 'desc'
  editingId: number | null
  setEditingId: (id: number | null) => void
  deleting: ResourceResponse | null
  setDeleting: (resource: ResourceResponse | null) => void
  categoriesOpen: boolean
  setCategoriesOpen: (open: boolean) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setStatusFilter: (values: string[]) => void
  setCategoryFilter: (values: string[]) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
}

export const useResourcesStore = create<ResourcesStore>()((set) => ({
  page: 1,
  pageSize: 10,
  statusFilter: [],
  categoryFilter: [],
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
  setSortOrder: (sortOrder) => set({ sortOrder, page: 1 }),
}))
