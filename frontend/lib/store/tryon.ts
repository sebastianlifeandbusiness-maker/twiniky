import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

export const useTryOnStore = create<TryOnStore>()(
  persist(
    (set) => ({
      garments: {},
      setGarment: (zoneId, garment) =>
        set((s) => ({ garments: { ...s.garments, [zoneId]: garment } })),
      removeGarment: (zoneId) =>
        set((s) => {
          const next = { ...s.garments };
          delete next[zoneId];
          return { garments: next };
        }),
      setOverrideColor: (zoneId, color) =>
        set((s) => {
          const g = s.garments[zoneId];
          if (!g) return s;
          return { garments: { ...s.garments, [zoneId]: { ...g, overrideColor: color } } };
        }),
    }),
    { name: "twiniky-tryon" }
  )
);

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
