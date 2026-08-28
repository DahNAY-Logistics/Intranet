import { create } from 'zustand'

type UsersAdminStore = {
  departmentsOpen: boolean
  setDepartmentsOpen: (open: boolean) => void
  designationsOpen: boolean
  setDesignationsOpen: (open: boolean) => void
  locationsOpen: boolean
  setLocationsOpen: (open: boolean) => void
}

export const useUsersAdminStore = create<UsersAdminStore>()((set) => ({
  departmentsOpen: false,
  setDepartmentsOpen: (departmentsOpen) => set({ departmentsOpen }),
  designationsOpen: false,
  setDesignationsOpen: (designationsOpen) => set({ designationsOpen }),
  locationsOpen: false,
  setLocationsOpen: (locationsOpen) => set({ locationsOpen }),
}))
