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

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setVerificationLevel: (verificationLevel) => set({ verificationLevel }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
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
