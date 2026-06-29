import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { useTryOnStore } from "./tryon";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        useTryOnStore.getState().clearAll();
        localStorage.setItem("token", token);
        set({ user, token });
      },
      setToken: (token) => {
        localStorage.setItem("token", token);
        set({ token });
      },
      logout: () => {
        useTryOnStore.getState().clearAll();
        localStorage.removeItem("token");
        set({ user: null, token: null });
      },
    }),
    { name: "twiniky-auth" }
  )
);
