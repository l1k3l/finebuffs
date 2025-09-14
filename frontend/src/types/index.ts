export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  stock_count: number;
  reorder_level: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  change_amount: number;
  notes?: string;
  product_name: string;
  product_sku: string;
  user_email: string;
}

export interface StockUpdate {
  product_id: string;
  change_amount: number;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
}