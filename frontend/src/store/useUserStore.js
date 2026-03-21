import { create } from 'zustand';

const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({ currentUser: null }),
}));

export default useUserStore;
