import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: null | { username: string };
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: async (credentials) => {
    // TODO: Implement actual API call
    set({ isAuthenticated: true, user: { username: credentials.username } });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
}));