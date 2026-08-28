import { create } from 'zustand'

import { bannerStatuses } from 'core/constants'
import type { BannerStatus } from 'core/constants'
import type { BannerResponse } from 'core/types/banners'

type BannersStore = {
  status: BannerStatus
  setStatus: (status: BannerStatus) => void
  editingId: number | null
  setEditingId: (id: number | null) => void
  deleting: BannerResponse | null
  setDeleting: (banner: BannerResponse | null) => void
  categoriesOpen: boolean
  setCategoriesOpen: (open: boolean) => void
}

export const useBannersStore = create<BannersStore>()((set) => ({
  status: bannerStatuses.published,
  setStatus: (status) => set({ status }),
  editingId: null,
  setEditingId: (editingId) => set({ editingId }),
  deleting: null,
  setDeleting: (deleting) => set({ deleting }),
  categoriesOpen: false,
  setCategoriesOpen: (categoriesOpen) => set({ categoriesOpen }),
}))
