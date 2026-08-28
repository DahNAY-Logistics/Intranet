import { create } from 'zustand'
import type { SortingState } from '@tanstack/react-table'
import { userStatuses } from 'core/constants'
import type { UserStatus } from 'core/constants'

type UsersTableStore = {
  page: number
  pageSize: number
  search: string
  sorting: SortingState
  statusFilter: UserStatus
  roleFilter: string[]
  departmentFilter: string[]
  designationFilter: string[]
  locationFilter: string[]
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearch: (search: string) => void
  setSorting: (updater: SortingState | ((old: SortingState) => SortingState)) => void
  setStatusFilter: (status: UserStatus) => void
  setRoleFilter: (values: string[]) => void
  setDepartmentFilter: (values: string[]) => void
  setDesignationFilter: (values: string[]) => void
  setLocationFilter: (values: string[]) => void
}

export const useUsersTableStore = create<UsersTableStore>()((set) => ({
  page: 1,
  pageSize: 10,
  search: '',
  sorting: [{ id: 'employeeId', desc: true }],
  statusFilter: userStatuses.active,
  roleFilter: [],
  departmentFilter: [],
  designationFilter: [],
  locationFilter: [],
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setSorting: (updater) =>
    set((state) => ({
      sorting: typeof updater === 'function' ? updater(state.sorting) : updater,
      page: 1,
    })),
  setStatusFilter: (statusFilter) => set({ statusFilter, page: 1 }),
  setRoleFilter: (roleFilter) => set({ roleFilter, page: 1 }),
  setDepartmentFilter: (departmentFilter) => set({ departmentFilter, page: 1 }),
  setDesignationFilter: (designationFilter) => set({ designationFilter, page: 1 }),
  setLocationFilter: (locationFilter) => set({ locationFilter, page: 1 }),
}))
