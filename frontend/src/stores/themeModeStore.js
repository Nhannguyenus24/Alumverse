import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeModeStore = create(
  persist(
    (set) => ({
      mode: 'light',
      toggleMode: () => set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
      setMode: (mode) => set({ mode: mode === 'dark' ? 'dark' : 'light' }),
    }),
    {
      name: 'theme-mode-storage',
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);

export default useThemeModeStore;
