export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_seller: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  brand_id: string | null;
  name: string;
  description: string | null;
  price: string;
  category: string;
  brand: string | null;
  sizes: string[];
  color: string | null;
  occasions: string[];
  image_urls: string[];
  model_3d_url: string | null;
  stock: number;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  total_price: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  shipping_address: string | null;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  email: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
}

export interface TryOnSession {
  session_id: string;
  product_id: string;
  status: "processing" | "ready" | "failed";
  result_url: string | null;
}

export interface Measurements {
  height:        number; // cm
  bust:          number; // cm
  waist:         number; // cm
  hips:          number; // cm
  armLength:     number; // cm — hombro a muñeca
  shoeSize:      number; // talla EU/CL (35–44)
  shoulderWidth: number; // cm — ancho de hombros
  torsoLength:   number; // cm — largo de torso (hombro a crotch)
  legLength:     number; // cm — largo de pierna (ingle a piso)
  armGirth:      number; // cm — contorno bíceps
  thighGirth:    number; // cm — contorno muslo
  calfGirth:     number; // cm — contorno pantorrilla
}
