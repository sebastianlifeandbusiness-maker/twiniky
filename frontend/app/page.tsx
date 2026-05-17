import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-24 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Pruébatelo antes de comprarlo
      </h1>
      <p className="max-w-xl text-lg text-gray-500">
        Twiniky combina un marketplace de moda con un probador virtual 3D.
        Visualiza cómo te queda cada prenda antes de comprarla.
      </p>
      <div className="flex gap-4">
        <Link
          href="/marketplace"
          className="rounded-xl bg-black px-6 py-3 text-white font-semibold hover:bg-gray-800 transition"
        >
          Explorar moda
        </Link>
        <Link
          href="/tryon"
          className="rounded-xl border border-black px-6 py-3 font-semibold hover:bg-gray-50 transition"
        >
          Probador virtual
        </Link>
      </div>
    </section>
  );
}
