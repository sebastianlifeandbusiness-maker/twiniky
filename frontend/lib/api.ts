import axios from "axios";
import type { Brand, Product, User } from "@/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; token_type: string }>("/auth/login", { email, password }),
  register: (email: string, password: string, full_name?: string) =>
    api.post<User>("/auth/register", { email, password, full_name }),
};

export interface CheckoutItem {
  product_id: string;
  quantity: number;
  size: string | null;
}

export interface CheckoutPayload {
  items: CheckoutItem[];
  shipping_address: string;
}

export interface OrderOut {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  total_price: string;
  status: string;
  shipping_address: string | null;
  created_at: string;
}

export const checkoutApi = {
  submit: (payload: CheckoutPayload) => {
    const brandToken = typeof window !== "undefined" ? localStorage.getItem("brand_token") : null;
    return api.post<OrderOut[]>("/checkout/", payload, {
      headers: brandToken ? { "X-Brand-Token": brandToken } : {},
    });
  },
};

export interface BrandCreatePayload {
  name: string;
  email: string;
  password: string;
  logo_url?: string;
  description?: string;
}

export interface BrandLoginPayload {
  email: string;
  password: string;
}

export interface BrandTokenResponse {
  access_token: string;
  token_type: string;
  brand_id: string;
  brand_name: string;
}

export interface BrandProductPayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  sizes: string[];
  image_url?: string;
  stock?: number;
}

// Axios instance separada para marcas con su propio token
export const brandsAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

brandsAxios.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("brand_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface BrandOrderOut {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  size: string | null;
  total_price: string;
  status: string;
  shipping_address: string | null;
  created_at: string;
}

export const brandsApi = {
  register: (payload: BrandCreatePayload) =>
    api.post<Brand>("/brands/register", payload),
  login: (payload: BrandLoginPayload) =>
    api.post<BrandTokenResponse>("/brands/login", payload),
  getProducts: (brandId: string) =>
    brandsAxios.get<Product[]>(`/brands/${brandId}/products/`),
  addProduct: (brandId: string, payload: BrandProductPayload) =>
    brandsAxios.post<Product>(`/brands/${brandId}/products/`, payload),
  getOrders: (brandId: string) =>
    brandsAxios.get<BrandOrderOut[]>(`/brands/${brandId}/orders/`),
  getMe: () =>
    brandsAxios.get<Brand>("/brands/me"),
};