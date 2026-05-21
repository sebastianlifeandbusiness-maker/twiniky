import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types";

export function useProducts(params?: { category?: string; q?: string }) {
  return useQuery<Product[]>({
    queryKey: ["products", params],
    queryFn: async () => {
      const { data } = await api.get("/products", { params });
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
