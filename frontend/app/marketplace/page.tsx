"use client";

import { useProducts } from "@/lib/hooks/useProducts";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductFilters } from "@/components/marketplace/ProductFilters";

export default function MarketplacePage() {
  const { data: products, isLoading } = useProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
      <div className="flex gap-8">
        <aside className="w-64 shrink-0">
          <ProductFilters />
        </aside>
        <div className="flex-1">
          {isLoading ? (
            <p>Cargando productos...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
