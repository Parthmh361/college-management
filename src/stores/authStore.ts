import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Alumni';
  department?: string;
  semester?: number;
  section?: string;
  studentId?: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      setUser: (user: User) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: !!token });
      },

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      logout: () => {
        const { clearAuth } = get();
        clearAuth();
        // Clear localStorage as well
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
