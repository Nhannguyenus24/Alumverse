import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  user: null,
  token: null,
  verificationLevel: null,
  loading: false,
  error: null,
};

const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (payload) => set((state) => ({
        ...state,
        ...payload,
        loading: false,
        error: null,
      })),

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setVerificationLevel: (verificationLevel) => set({ verificationLevel }),

      setLoading: (loading) => set((state) => ({
        loading,
        error: loading ? null : state.error,
      })),

      setError: (error) => set({ error, loading: false }),

      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        verificationLevel: state.verificationLevel,
      }),
    }
  )
);

export default useAuthStore;
