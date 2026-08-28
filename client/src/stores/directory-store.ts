import { create } from 'zustand'

type DirectoryStore = {
  departmentFilter: string[]
  designationFilter: string[]
  locationFilter: string[]
  setDepartmentFilter: (values: string[]) => void
  setDesignationFilter: (values: string[]) => void
  setLocationFilter: (values: string[]) => void
  resetFilters: () => void
}

export const useDirectoryStore = create<DirectoryStore>()((set) => ({
  departmentFilter: [],
  designationFilter: [],
  locationFilter: [],
  setDepartmentFilter: (departmentFilter) => set({ departmentFilter }),
  setDesignationFilter: (designationFilter) => set({ designationFilter }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
  resetFilters: () => set({ departmentFilter: [], designationFilter: [], locationFilter: [] }),
}))
