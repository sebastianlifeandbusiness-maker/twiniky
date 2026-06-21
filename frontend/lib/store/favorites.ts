import { create } from "zustand";

interface FavoritesState {
  ids: string[];
  setAll: (ids: string[]) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()((set) => ({
  ids: [],
  setAll: (ids) => set({ ids }),
  add: (id) => set((s) => ({ ids: [...s.ids, id] })),
  remove: (id) => set((s) => ({ ids: s.ids.filter((i) => i !== id) })),
}));
