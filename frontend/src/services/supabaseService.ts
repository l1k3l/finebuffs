import { supabase } from '../lib/supabase';
import { Product, Transaction } from '../types';
import { performanceService } from './performanceService';

export class SupabaseService {
  // Direct product queries
  static async getProducts(): Promise<Product[]> {
    return performanceService.timeAsyncOperation(
      'fetch-products',
      'direct-supabase',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (error) {
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        return data || [];
      },
      true, // bust cache
      { table: 'products', operation: 'select-all' }
    ).then(result => result.result);
  }

  static async getProduct(id: string): Promise<Product> {
    return performanceService.timeAsyncOperation(
      'fetch-product-detail',
      'direct-supabase',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Product not found');
          }
          throw new Error(`Failed to fetch product: ${error.message}`);
        }

        return data;
      },
      true,
      { table: 'products', operation: 'select-single', productId: id }
    ).then(result => result.result);
  }

  // Direct transaction queries
  static async getTransactions(limit: number = 50, productId?: string): Promise<Transaction[]> {
    return performanceService.timeAsyncOperation(
      productId ? 'fetch-product-transactions' : 'fetch-all-transactions',
      'direct-supabase',
      async () => {
        let query = supabase
          .from('transaction_history')
          .select('*')
          .limit(limit);

        if (productId) {
          query = query.eq('product_id', productId);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch transactions: ${error.message}`);
        }

        return data || [];
      },
      true,
      { table: 'transaction_history', limit, productId }
    ).then(result => result.result);
  }

  // Direct low stock products query
  static async getLowStockProducts(): Promise<Product[]> {
    return performanceService.timeAsyncOperation(
      'fetch-low-stock-products',
      'direct-supabase',
      async () => {
        const { data, error } = await supabase
          .from('low_stock_products')
          .select('*');

        if (error) {
          throw new Error(`Failed to fetch low stock products: ${error.message}`);
        }

        return data || [];
      },
      true,
      { table: 'low_stock_products', operation: 'select-all' }
    ).then(result => result.result);
  }

  // Product search functionality
  static async searchProducts(searchTerm: string): Promise<Product[]> {
    if (!searchTerm.trim()) {
      return this.getProducts();
    }

    return performanceService.timeAsyncOperation(
      'search-products',
      'direct-supabase',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .order('name');

        if (error) {
          throw new Error(`Failed to search products: ${error.message}`);
        }

        return data || [];
      },
      true,
      { table: 'products', operation: 'search', searchTerm }
    ).then(result => result.result);
  }

  // Real-time subscriptions for live updates
  static subscribeToProducts(callback: (products: Product[]) => void) {
    const subscription = supabase
      .channel('products')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        async () => {
          // Refetch all products when any product changes
          try {
            const products = await this.getProducts();
            callback(products);
          } catch (error) {
            console.error('Error refetching products after update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  static subscribeToProductTransactions(productId: string, callback: (transactions: Transaction[]) => void) {
    const subscription = supabase
      .channel(`product-${productId}-transactions`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_transactions',
          filter: `product_id=eq.${productId}`
        },
        async () => {
          try {
            const transactions = await this.getTransactions(20, productId);
            callback(transactions);
          } catch (error) {
            console.error('Error refetching transactions after update:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Subscribe to all transaction changes for transaction history page
  static subscribeToAllTransactions(callback: (transactions: Transaction[]) => void) {
    const subscription = supabase
      .channel('all-transactions')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_transactions'
        },
        async () => {
          try {
            const transactions = await this.getTransactions(100);
            callback(transactions);
          } catch (error) {
            console.error('Error refetching transactions after new transaction:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Check if user is authenticated (helper method)
  static async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  // Get current user
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
    return user;
  }
}