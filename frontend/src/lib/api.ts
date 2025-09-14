import { apiBaseUrl } from './supabase';
import { Product, Transaction, StockUpdate } from '../types';

class ApiClient {
  private baseUrl: string;
  private getAuthToken: () => Promise<string | null>;

  constructor(baseUrl: string, getAuthToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || 'Request failed');
    }

    return response.json();
  }

  // Product API
  async getProducts(): Promise<{ products: Product[] }> {
    return this.request('/products');
  }

  async getProduct(id: string): Promise<{ product: Product }> {
    return this.request(`/products/${id}`);
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ product: Product }> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(
    id: string,
    updates: Partial<Pick<Product, 'name' | 'description' | 'reorder_level'>>
  ): Promise<{ product: Product }> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Stock management API
  async updateStock(stockUpdate: StockUpdate): Promise<{ message: string; updated_product: Product }> {
    return this.request('/update-stock', {
      method: 'POST',
      body: JSON.stringify(stockUpdate),
    });
  }

  async getTransactions(limit: number = 50, productId?: string): Promise<{ transactions: Transaction[] }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (productId) {
      params.append('product_id', productId);
    }
    return this.request(`/transactions?${params}`);
  }

  async getLowStockProducts(): Promise<{ low_stock_products: Product[] }> {
    return this.request('/low-stock');
  }

  // QR Code API
  async getProductQRCode(id: string): Promise<{
    qr_code_data: string;
    qr_code_image: string;
    product: Product;
  }> {
    return this.request(`/products/${id}/qr-code`);
  }
}

export const createApiClient = (getAuthToken: () => Promise<string | null>) => {
  return new ApiClient(apiBaseUrl, getAuthToken);
};