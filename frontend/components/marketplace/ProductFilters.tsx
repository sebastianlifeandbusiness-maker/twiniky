"use client";

const CATEGORIES = ["Tops", "Pantalones", "Vestidos", "Zapatos", "Accesorios"];

export function ProductFilters() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-semibold mb-3">Categoría</h3>
        <ul className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <li key={cat}>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="rounded" />
                {cat}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold mb-3">Precio</h3>
        <input type="range" min={0} max={1000} className="w-full" />
      </div>
    </div>
  );
}
