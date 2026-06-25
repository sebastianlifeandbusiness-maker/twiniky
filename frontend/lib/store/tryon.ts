import { create } from "zustand";
import type { TryOnSelectionOut } from "@/lib/api";

export type ZoneId = "upper" | "lower" | "dress" | "shoes" | "accessories";

export interface ZoneGarment {
  productId: string;
  name: string;
  brand: string | null;
  imageUrl: string;
  category: string;
  color: string | null;
  price: string;
  overrideColor: string | null;
}

interface TryOnStore {
  garments: Partial<Record<ZoneId, ZoneGarment>>;
  setGarment: (zoneId: ZoneId, garment: ZoneGarment) => void;
  removeGarment: (zoneId: ZoneId) => void;
  setOverrideColor: (zoneId: ZoneId, color: string) => void;
  clearAll: () => void;
  loadFromServer: (selections: TryOnSelectionOut[]) => void;
}

export const useTryOnStore = create<TryOnStore>()((set, get) => ({
  garments: {},
  setGarment: (zoneId, garment) => {
    set((s) => ({ garments: { ...s.garments, [zoneId]: garment } }));
    import("@/lib/api").then(({ tryonSelectionsApi }) =>
      tryonSelectionsApi.updateSelection(zoneId, garment.productId, null).catch(() => {})
    );
  },
  removeGarment: (zoneId) => {
    set((s) => {
      const next = { ...s.garments };
      delete next[zoneId];
      return { garments: next };
    });
    import("@/lib/api").then(({ tryonSelectionsApi }) =>
      tryonSelectionsApi.deleteSelection(zoneId).catch(() => {})
    );
  },
  setOverrideColor: (zoneId, color) => {
    set((s) => {
      const g = s.garments[zoneId];
      if (!g) return s;
      return { garments: { ...s.garments, [zoneId]: { ...g, overrideColor: color } } };
    });
    const g = get().garments[zoneId];
    if (g) {
      import("@/lib/api").then(({ tryonSelectionsApi }) =>
        tryonSelectionsApi.updateSelection(zoneId, g.productId, color).catch(() => {})
      );
    }
  },
  clearAll: () => set({ garments: {} }),
  loadFromServer: (selections) => {
    const garments: Partial<Record<ZoneId, ZoneGarment>> = {};
    for (const sel of selections) {
      if (sel.product_id && sel.name && sel.category) {
        garments[sel.zone as ZoneId] = {
          productId: sel.product_id,
          name: sel.name,
          brand: sel.brand,
          imageUrl: sel.image_url ?? "",
          category: sel.category,
          color: sel.color,
          price: sel.price ?? "0",
          overrideColor: sel.selected_color,
        };
      }
    }
    set({ garments });
  },
}));

export const ZONES: Array<{
  id: ZoneId;
  label: string;
  categories: string[];
  hint: string;
  primaryCategory: string;
}> = [
  {
    id: "upper",
    label: "PARTE SUPERIOR",
    categories: ["Tops", "Chaquetas"],
    hint: "Tops · Camisetas · Chaquetas",
    primaryCategory: "Tops",
  },
  {
    id: "lower",
    label: "PARTE INFERIOR",
    categories: ["Pantalones"],
    hint: "Pantalones · Jeans · Shorts",
    primaryCategory: "Pantalones",
  },
  {
    id: "dress",
    label: "VESTIDOS",
    categories: ["Vestidos"],
    hint: "Vestidos · Jumpsuit",
    primaryCategory: "Vestidos",
  },
  {
    id: "shoes",
    label: "CALZADO",
    categories: ["Zapatos"],
    hint: "Zapatillas · Zapatos · Botas",
    primaryCategory: "Zapatos",
  },
  {
    id: "accessories",
    label: "ACCESORIOS",
    categories: ["Accesorios"],
    hint: "Bolsos · Gorros · Lentes",
    primaryCategory: "Accesorios",
  },
];

export function getZoneForCategory(category: string): ZoneId | null {
  if (["Tops", "Chaquetas"].includes(category)) return "upper";
  if (category === "Pantalones") return "lower";
  if (category === "Vestidos") return "dress";
  if (category === "Zapatos") return "shoes";
  if (category === "Accesorios") return "accessories";
  return null;
}
