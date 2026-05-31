import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types";

export function useProducts(params?: { category?: string; q?: string }) {
  return useQuery<Product[]>({
    queryKey: ["products", params],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (params?.category) query.category = params.category;
      if (params?.q) query.q = params.q;
      const { data } = await api.get("/products/", { params: query });
      return data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}/`);
      return data;
    },
    enabled: !!id,
  });
}
