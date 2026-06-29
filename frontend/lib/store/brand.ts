import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Brand } from "@/types";

interface BrandSession {
  brand: Brand | null;
  token: string | null;
  setBrandSession: (brand: Brand, token: string) => void;
  setBrandToken: (token: string) => void;
  clearBrand: () => void;
  setBrand: (brand: Brand) => void;
}

export const useBrandStore = create<BrandSession>()(
  persist(
    (set) => ({
      brand: null,
      token: null,
      setBrandSession: (brand, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("brand_token", token);
        }
        set({ brand, token });
      },
      setBrandToken: (token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("brand_token", token);
        }
        set({ token });
      },
      clearBrand: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("brand_token");
        }
        set({ brand: null, token: null });
      },
      setBrand: (brand) => set({ brand }),
    }),
    {
      name: "brand-session",
    }
  )
);