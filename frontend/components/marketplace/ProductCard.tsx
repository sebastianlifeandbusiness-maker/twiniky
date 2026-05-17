import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  return (
    <Link href={`/marketplace/${product.id}`} className="group rounded-2xl border overflow-hidden hover:shadow-md transition">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.image_urls[0] && (
          <Image
            src={product.image_urls[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{product.brand}</p>
        <h3 className="font-semibold mt-1 truncate">{product.name}</h3>
        <p className="text-lg font-bold mt-1">${Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  );
}
