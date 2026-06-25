"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const product = searchParams.get("product");
  const emailParam = searchParams.get("email") ?? "";
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: "", email: emailParam, password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form.email, form.password, form.name);
      const { data } = await authApi.login(form.email, form.password);
      setAuth(null, data.access_token);
      // Usuario nuevo nunca tiene medidas: si viene de una prenda va directo a setup
      router.push(product ? `/avatar/setup?product=${product}` : "/marketplace");
    } catch (err) {
      const detail = err instanceof AxiosError ? err.response?.data?.detail : null;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg?.replace("Value error, ", "") ?? "Error al registrarse");
      } else {
        setError(typeof detail === "string" ? detail : "Error al registrarse");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            required
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            required
            minLength={8}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white rounded-lg py-2 font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link
            href={product ? `/login/comprador?product=${product}` : "/login"}
            className="underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
