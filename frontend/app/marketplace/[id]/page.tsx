import { TryOnButton } from "@/components/tryon/TryOnButton";

interface Props {
  params: { id: string };
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image / 3D preview */}
        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
          <span className="text-gray-400">Imagen del producto</span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Nombre del producto</h1>
          <p className="text-2xl font-semibold">$0.00</p>
          <p className="text-gray-500">Descripción del producto...</p>

          <TryOnButton productId={params.id} />

          <button className="w-full rounded-xl bg-black py-3 text-white font-semibold hover:bg-gray-800 transition">
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
