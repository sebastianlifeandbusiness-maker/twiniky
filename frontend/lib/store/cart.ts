import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

export interface CartItem {
  product: Product;
  size: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, size: string | null) => void;
  removeItem: (productId: string, size: string | null) => void;
  updateQuantity: (productId: string, size: string | null, qty: number) => void;
  clearCart: () => void;
}

function key(productId: string, size: string | null) {
  return `${productId}::${size ?? "—"}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, size) =>
        set((state) => {
          const k = key(product.id, size);
          const exists = state.items.find((i) => key(i.product.id, i.size) === k);
          if (exists) {
            return {
              items: state.items.map((i) =>
                key(i.product.id, i.size) === k
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, size, quantity: 1 }] };
        }),

      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => key(i.product.id, i.size) !== key(productId, size)
          ),
        })),

      updateQuantity: (productId, size, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter(
                  (i) => key(i.product.id, i.size) !== key(productId, size)
                )
              : state.items.map((i) =>
                  key(i.product.id, i.size) === key(productId, size)
                    ? { ...i, quantity: qty }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: "twiniky-cart" }
  )
);

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
