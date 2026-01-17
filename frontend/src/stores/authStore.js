import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,

      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setIsLoading: (value) => set({ isLoading: value }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      reset: () => set({ isAuthenticated: false, user: null, token: null, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useAuthStore;