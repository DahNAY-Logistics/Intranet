import { create } from 'zustand'

type MoodStore = {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useMoodStore = create<MoodStore>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
