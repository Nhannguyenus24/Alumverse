import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  user: null,
  token: null,
  verificationLevel: null,
  mustChangePassword: false,
  sessionExpired: false,
};

const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,

      setAuth: (payload) => set((state) => ({
        ...state,
        ...payload,
        sessionExpired: false,
      })),

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setVerificationLevel: (verificationLevel) => set({ verificationLevel }),
      setMustChangePassword: (mustChangePassword) => set({ mustChangePassword }),
      setSessionExpired: (sessionExpired) => set({ sessionExpired }),

      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        verificationLevel: state.verificationLevel,
        mustChangePassword: state.mustChangePassword,
      }),
    }
  )
);

export default useAuthStore;
