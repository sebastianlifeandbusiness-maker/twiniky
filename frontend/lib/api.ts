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
  color?: string;
  occasions?: string[];
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

export interface TopProduct {
  name: string;
  quantity: number;
}

export interface SalesByMonth {
  month: string;
  total: number;
}

export interface BrandStats {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  top_products: TopProduct[];
  sales_by_month: SalesByMonth[];
}

export interface StockAlertBySize {
  size: string;
  count: number;
}

export interface ProductStockAlert {
  product_id: string;
  product_name: string;
  product_image: string | null;
  sizes_waiting: StockAlertBySize[];
  total_waiting: number;
}

export interface BrandProfilePayload {
  name?: string;
  description?: string;
  logo_url?: string;
}

export interface BrandCredentialsPayload {
  email?: string;
  current_password: string;
  new_password?: string;
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
  getStats: () =>
    brandsAxios.get<BrandStats>("/brands/me/stats"),
  getStockAlerts: () =>
    brandsAxios.get<ProductStockAlert[]>("/brands/me/stock-alerts"),
  updateProfile: (payload: BrandProfilePayload) =>
    brandsAxios.patch<Brand>("/brands/me/profile", payload),
  updateCredentials: (payload: BrandCredentialsPayload) =>
    brandsAxios.patch<Brand>("/brands/me/credentials", payload),
};

export const waitlistApi = {
  join: (email: string) =>
    api.post<{ message: string }>("/waitlist/", { email }),
};

export interface TryOnSelectionOut {
  zone: string;
  product_id: string | null;
  name: string | null;
  image_url: string | null;
  category: string | null;
  color: string | null;
  brand: string | null;
  price: string | null;
  selected_color: string | null;
}

export interface StockAlertOut {
  id: string;
  product_id: string;
  size: string;
  is_active: boolean;
  created_at: string;
  notified_at: string | null;
  product_name: string | null;
  product_image: string | null;
  product_brand: string | null;
}

export const stockAlertsApi = {
  list: () => api.get<StockAlertOut[]>("/stock-alerts/"),
  create: (productId: string, size: string) =>
    api.post<StockAlertOut>("/stock-alerts/", { product_id: productId, size }),
  delete: (alertId: string) => api.delete(`/stock-alerts/${alertId}`),
  createGuest: (email: string, productId: string, size: string) =>
    api.post<{ message: string; email: string }>("/stock-alerts/guest", {
      email,
      product_id: productId,
      size,
    }),
};

export const tryonSelectionsApi = {
  getSelections: () => api.get<TryOnSelectionOut[]>("/tryon/selections/"),
  updateSelection: (zone: string, productId: string, selectedColor?: string | null) =>
    api.put<TryOnSelectionOut>(`/tryon/selections/${zone}`, {
      product_id: productId,
      selected_color: selectedColor ?? null,
    }),
  deleteSelection: (zone: string) =>
    api.delete(`/tryon/selections/${zone}`),
};

export const brandTryonSelectionsApi = {
  getSelections: () => brandsAxios.get<TryOnSelectionOut[]>("/brands/me/tryon-selections"),
  updateSelection: (zone: string, productId: string, selectedColor?: string | null) =>
    brandsAxios.put<TryOnSelectionOut>(`/brands/me/tryon-selections/${zone}`, {
      product_id: productId,
      selected_color: selectedColor ?? null,
    }),
  deleteSelection: (zone: string) =>
    brandsAxios.delete(`/brands/me/tryon-selections/${zone}`),
};

export const favoritesApi = {
  list: () => api.get<import("@/types").Product[]>("/favorites/"),
  add: (productId: string) => api.post<{ message: string }>(`/favorites/${productId}`),
  remove: (productId: string) => api.delete(`/favorites/${productId}`),
};

export interface AvatarMeasurementsPayload {
  height: number;
  bust: number;
  waist: number;
  hips: number;
  shoulder_width: number;
  torso_length: number;
  leg_length: number;
  arm_length: number;
  arm_girth: number;
  thigh_girth: number;
  calf_girth: number;
  shoe_size: number;
}

export const avatarApi = {
  get: () => api.get<AvatarMeasurementsPayload>("/avatar/measurements"),
  save: (payload: AvatarMeasurementsPayload) =>
    api.post<AvatarMeasurementsPayload>("/avatar/measurements", payload),
};

export function measurementsToApi(m: import("@/types").Measurements): AvatarMeasurementsPayload {
  return {
    height: m.height,
    bust: m.bust,
    waist: m.waist,
    hips: m.hips,
    shoulder_width: m.shoulderWidth,
    torso_length: m.torsoLength,
    leg_length: m.legLength,
    arm_length: m.armLength,
    arm_girth: m.armGirth,
    thigh_girth: m.thighGirth,
    calf_girth: m.calfGirth,
    shoe_size: m.shoeSize,
  };
}

export function apiToMeasurements(p: AvatarMeasurementsPayload): import("@/types").Measurements {
  return {
    height: p.height,
    bust: p.bust,
    waist: p.waist,
    hips: p.hips,
    shoulderWidth: p.shoulder_width,
    torsoLength: p.torso_length,
    legLength: p.leg_length,
    armLength: p.arm_length,
    armGirth: p.arm_girth,
    thighGirth: p.thigh_girth,
    calfGirth: p.calf_girth,
    shoeSize: p.shoe_size,
  };
}