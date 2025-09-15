import { SupabaseService } from './supabaseService';
import { createApiClient } from '../lib/api';
import { performanceService } from './performanceService';

interface TestResult {
  method: 'direct-supabase' | 'backend-api';
  operation: string;
  measurements: number[];
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  min: number;
  max: number;
  successRate: number;
  errors: string[];
}

interface ComparisonResult {
  operation: string;
  directSupabase: TestResult;
  backendApi: TestResult;
  speedupFactor: number;
  percentImprovement: number;
  recommendedMethod: 'direct-supabase' | 'backend-api';
}

export class PerformanceTestRunner {
  private getAuthToken: () => Promise<string | null>;
  private apiClient: ReturnType<typeof createApiClient>;

  constructor(getAuthToken: () => Promise<string | null>) {
    this.getAuthToken = getAuthToken;
    this.apiClient = createApiClient(getAuthToken);
  }

  // Run a single test with multiple iterations
  private async runTest(
    operation: string,
    method: 'direct-supabase' | 'backend-api',
    testFunction: () => Promise<any>,
    iterations: number = 10
  ): Promise<TestResult> {
    const measurements: number[] = [];
    const errors: string[] = [];
    let successCount = 0;

    console.log(`🧪 Testing ${operation} with ${method} (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        await testFunction();
        const endTime = performance.now();
        const duration = endTime - startTime;

        measurements.push(duration);
        successCount++;

        // Add small delay between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        console.warn(`❌ Test ${i + 1} failed:`, error);
      }
    }

    const sortedMeasurements = measurements.sort((a, b) => a - b);
    const avg = measurements.reduce((sum, m) => sum + m, 0) / measurements.length || 0;

    return {
      method,
      operation,
      measurements,
      avg,
      p50: sortedMeasurements[Math.floor(sortedMeasurements.length * 0.5)] || 0,
      p90: sortedMeasurements[Math.floor(sortedMeasurements.length * 0.9)] || 0,
      p95: sortedMeasurements[Math.floor(sortedMeasurements.length * 0.95)] || 0,
      min: sortedMeasurements[0] || 0,
      max: sortedMeasurements[sortedMeasurements.length - 1] || 0,
      successRate: successCount / iterations,
      errors
    };
  }

  // Test product fetching
  async testProductFetching(iterations: number = 10): Promise<ComparisonResult> {
    console.log('📦 Testing product fetching...');

    // Test Direct Supabase
    const directResult = await this.runTest(
      'fetch-products',
      'direct-supabase',
      () => SupabaseService.getProducts(),
      iterations
    );

    // Test Backend API
    const backendResult = await this.runTest(
      'fetch-products',
      'backend-api',
      () => this.apiClient.getProducts(),
      iterations
    );

    const speedupFactor = backendResult.avg / directResult.avg;
    const percentImprovement = ((backendResult.avg - directResult.avg) / backendResult.avg) * 100;

    return {
      operation: 'fetch-products',
      directSupabase: directResult,
      backendApi: backendResult,
      speedupFactor,
      percentImprovement,
      recommendedMethod: speedupFactor > 1.1 ? 'direct-supabase' : 'backend-api'
    };
  }

  // Test single product fetching
  async testProductDetail(productId: string, iterations: number = 10): Promise<ComparisonResult> {
    console.log(`📋 Testing product detail fetching for ${productId}...`);

    // Test Direct Supabase
    const directResult = await this.runTest(
      'fetch-product-detail',
      'direct-supabase',
      () => SupabaseService.getProduct(productId),
      iterations
    );

    // Test Backend API
    const backendResult = await this.runTest(
      'fetch-product-detail',
      'backend-api',
      () => this.apiClient.getProduct(productId),
      iterations
    );

    const speedupFactor = backendResult.avg / directResult.avg;
    const percentImprovement = ((backendResult.avg - directResult.avg) / backendResult.avg) * 100;

    return {
      operation: 'fetch-product-detail',
      directSupabase: directResult,
      backendApi: backendResult,
      speedupFactor,
      percentImprovement,
      recommendedMethod: speedupFactor > 1.1 ? 'direct-supabase' : 'backend-api'
    };
  }

  // Test transaction fetching
  async testTransactionFetching(iterations: number = 10): Promise<ComparisonResult> {
    console.log('📊 Testing transaction fetching...');

    // Test Direct Supabase
    const directResult = await this.runTest(
      'fetch-transactions',
      'direct-supabase',
      () => SupabaseService.getTransactions(50),
      iterations
    );

    // Test Backend API
    const backendResult = await this.runTest(
      'fetch-transactions',
      'backend-api',
      () => this.apiClient.getTransactions(50),
      iterations
    );

    const speedupFactor = backendResult.avg / directResult.avg;
    const percentImprovement = ((backendResult.avg - directResult.avg) / backendResult.avg) * 100;

    return {
      operation: 'fetch-transactions',
      directSupabase: directResult,
      backendApi: backendResult,
      speedupFactor,
      percentImprovement,
      recommendedMethod: speedupFactor > 1.1 ? 'direct-supabase' : 'backend-api'
    };
  }

  // Test low stock products
  async testLowStockProducts(iterations: number = 10): Promise<ComparisonResult> {
    console.log('⚠️ Testing low stock products fetching...');

    // Test Direct Supabase
    const directResult = await this.runTest(
      'fetch-low-stock-products',
      'direct-supabase',
      () => SupabaseService.getLowStockProducts(),
      iterations
    );

    // Test Backend API
    const backendResult = await this.runTest(
      'fetch-low-stock-products',
      'backend-api',
      () => this.apiClient.getLowStockProducts(),
      iterations
    );

    const speedupFactor = backendResult.avg / directResult.avg;
    const percentImprovement = ((backendResult.avg - directResult.avg) / backendResult.avg) * 100;

    return {
      operation: 'fetch-low-stock-products',
      directSupabase: directResult,
      backendApi: backendResult,
      speedupFactor,
      percentImprovement,
      recommendedMethod: speedupFactor > 1.1 ? 'direct-supabase' : 'backend-api'
    };
  }

  // Run comprehensive test suite
  async runComprehensiveTest(productId?: string, iterations: number = 10): Promise<{
    results: ComparisonResult[];
    overallSummary: {
      avgSpeedupFactor: number;
      avgPercentImprovement: number;
      recommendedApproach: string;
      totalTestsRun: number;
      networkConditions?: any;
    };
  }> {
    console.log('🚀 Starting comprehensive performance test...');
    console.log(`📊 Running ${iterations} iterations per test`);

    // Clear previous metrics for clean results
    performanceService.clearMetrics();

    const results: ComparisonResult[] = [];

    try {
      // Run all tests
      results.push(await this.testProductFetching(iterations));
      results.push(await this.testTransactionFetching(iterations));
      results.push(await this.testLowStockProducts(iterations));

      // Test product detail if productId provided
      if (productId) {
        results.push(await this.testProductDetail(productId, iterations));
      }

      // Calculate overall statistics
      const speedupFactors = results.map(r => r.speedupFactor);
      const percentImprovements = results.map(r => r.percentImprovement);

      const avgSpeedupFactor = speedupFactors.reduce((sum, f) => sum + f, 0) / speedupFactors.length;
      const avgPercentImprovement = percentImprovements.reduce((sum, p) => sum + p, 0) / percentImprovements.length;

      const directWins = results.filter(r => r.recommendedMethod === 'direct-supabase').length;
      const recommendedApproach = directWins > results.length / 2 ? 'Direct Supabase' : 'Backend API';

      console.log('✅ Comprehensive test completed!');

      return {
        results,
        overallSummary: {
          avgSpeedupFactor,
          avgPercentImprovement,
          recommendedApproach,
          totalTestsRun: results.length * iterations,
          networkConditions: this.getNetworkInfo()
        }
      };

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  // Generate detailed report
  generateDetailedReport(testResults: {
    results: ComparisonResult[];
    overallSummary: any;
  }): string {
    const { results, overallSummary } = testResults;

    let report = '📊 PERFORMANCE COMPARISON REPORT\n';
    report += '='.repeat(60) + '\n\n';

    // Network conditions
    if (overallSummary.networkConditions) {
      const net = overallSummary.networkConditions;
      report += `🌐 Network Conditions:\n`;
      report += `   Type: ${net.effectiveType || 'Unknown'}\n`;
      report += `   Downlink: ${net.downlink || 'Unknown'}Mbps\n`;
      report += `   RTT: ${net.rtt || 'Unknown'}ms\n\n`;
    }

    // Individual test results
    results.forEach((result, index) => {
      report += `${index + 1}. ${result.operation.toUpperCase().replace(/-/g, ' ')}\n`;
      report += '-'.repeat(40) + '\n';

      report += `Direct Supabase:\n`;
      report += `  Average: ${result.directSupabase.avg.toFixed(2)}ms\n`;
      report += `  P50: ${result.directSupabase.p50.toFixed(2)}ms | P95: ${result.directSupabase.p95.toFixed(2)}ms\n`;
      report += `  Range: ${result.directSupabase.min.toFixed(2)}ms - ${result.directSupabase.max.toFixed(2)}ms\n`;
      report += `  Success Rate: ${(result.directSupabase.successRate * 100).toFixed(1)}%\n\n`;

      report += `Backend API:\n`;
      report += `  Average: ${result.backendApi.avg.toFixed(2)}ms\n`;
      report += `  P50: ${result.backendApi.p50.toFixed(2)}ms | P95: ${result.backendApi.p95.toFixed(2)}ms\n`;
      report += `  Range: ${result.backendApi.min.toFixed(2)}ms - ${result.backendApi.max.toFixed(2)}ms\n`;
      report += `  Success Rate: ${(result.backendApi.successRate * 100).toFixed(1)}%\n\n`;

      report += `🚀 Performance Improvement:\n`;
      report += `  Speedup Factor: ${result.speedupFactor.toFixed(2)}x\n`;
      report += `  Percent Improvement: ${result.percentImprovement.toFixed(1)}%\n`;
      report += `  Recommended: ${result.recommendedMethod}\n\n`;
    });

    // Overall summary
    report += '📈 OVERALL SUMMARY\n';
    report += '='.repeat(30) + '\n';
    report += `Average Speedup: ${overallSummary.avgSpeedupFactor.toFixed(2)}x\n`;
    report += `Average Improvement: ${overallSummary.avgPercentImprovement.toFixed(1)}%\n`;
    report += `Recommended Approach: ${overallSummary.recommendedApproach}\n`;
    report += `Total Tests Executed: ${overallSummary.totalTestsRun}\n\n`;

    return report;
  }

  // Get network information
  private getNetworkInfo(): any {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    } : null;
  }
}

// Export convenience function
export const createPerformanceTestRunner = (getAuthToken: () => Promise<string | null>) => {
  return new PerformanceTestRunner(getAuthToken);
};