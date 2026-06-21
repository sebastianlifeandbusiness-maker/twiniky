import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types";

export function useProducts(params?: { category?: string; q?: string; limit?: number }) {
  return useQuery<Product[]>({
    queryKey: ["products", params],
    queryFn: async () => {
      const query: Record<string, string | number> = {};
      if (params?.category) query.category = params.category;
      if (params?.q)        query.q        = params.q;
      if (params?.limit)    query.limit    = params.limit;
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
