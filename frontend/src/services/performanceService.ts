interface PerformanceMetric {
  id: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  timestamp: number;
  url?: string;
  method: 'direct-supabase' | 'backend-api' | 'page-load';
  networkInfo?: NetworkInformation;
  cacheStatus: 'cache-busted' | 'cached' | 'unknown';
  metadata?: Record<string, any>;
}

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 measurements
  private debugMode = process.env.NODE_ENV === 'development';

  // Start timing an operation
  startTiming(operation: string, method: 'direct-supabase' | 'backend-api' | 'page-load', metadata?: Record<string, any>): string {
    const id = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = performance.now();

    const metric: PerformanceMetric = {
      id,
      operation,
      startTime: now,
      timestamp: Date.now(),
      url: window.location.pathname,
      method,
      networkInfo: this.getNetworkInfo(),
      cacheStatus: 'unknown',
      metadata
    };

    this.metrics.push(metric);
    this.cleanup();

    if (this.debugMode) {
      console.log(`⏱️ Started timing: ${operation} (${method})`, { id, metadata });
    }

    return id;
  }

  // End timing an operation
  endTiming(id: string, cacheStatus: 'cache-busted' | 'cached' | 'unknown' = 'unknown', metadata?: Record<string, any>): number | null {
    const metric = this.metrics.find(m => m.id === id);
    if (!metric) {
      console.warn(`Performance metric not found: ${id}`);
      return null;
    }

    const now = performance.now();
    metric.endTime = now;
    metric.duration = now - metric.startTime;
    metric.cacheStatus = cacheStatus;

    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }

    if (this.debugMode) {
      console.log(`⏱️ Completed timing: ${metric.operation} (${metric.method})`, {
        duration: `${metric.duration.toFixed(2)}ms`,
        cacheStatus,
        metadata: metric.metadata
      });
    }

    return metric.duration;
  }

  // Time an async operation with automatic cache busting
  async timeAsyncOperation<T>(
    operation: string,
    method: 'direct-supabase' | 'backend-api',
    asyncFn: () => Promise<T>,
    bustCache = true,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {

    // Add cache busting parameters if requested
    const cacheStatus = bustCache ? 'cache-busted' : 'unknown';
    const fullMetadata = {
      ...metadata,
      cacheBusted: bustCache,
      timestamp: Date.now()
    };

    const id = this.startTiming(operation, method, fullMetadata);

    try {
      const result = await asyncFn();
      const duration = this.endTiming(id, cacheStatus, { success: true }) || 0;

      return { result, duration };
    } catch (error) {
      const duration = this.endTiming(id, cacheStatus, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }) || 0;

      throw error;
    }
  }

  // Get performance statistics
  getStats(operation?: string, method?: 'direct-supabase' | 'backend-api' | 'page-load'): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
    recent: number; // Last 10 measurements average
    successRate: number;
  } | null {
    let filteredMetrics = this.metrics.filter(m => m.duration !== undefined);

    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    if (method) {
      filteredMetrics = filteredMetrics.filter(m => m.method === method);
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration!).sort((a, b) => a - b);
    const successfulOps = filteredMetrics.filter(m => m.metadata?.success !== false);
    const recentMetrics = filteredMetrics.slice(-10);
    const recentDurations = recentMetrics.map(m => m.duration!);

    return {
      count: durations.length,
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p90: durations[Math.floor(durations.length * 0.9)],
      p95: durations[Math.floor(durations.length * 0.95)],
      recent: recentDurations.length > 0 ? recentDurations.reduce((sum, d) => sum + d, 0) / recentDurations.length : 0,
      successRate: successfulOps.length / filteredMetrics.length
    };
  }

  // Compare performance between methods
  comparePerformance(operation: string): {
    directSupabase: ReturnType<PerformanceService['getStats']>;
    backendApi: ReturnType<PerformanceService['getStats']>;
    improvement?: {
      avgSpeedup: number;
      percentImprovement: number;
    };
  } {
    const directStats = this.getStats(operation, 'direct-supabase');
    const apiStats = this.getStats(operation, 'backend-api');

    let improvement;
    if (directStats && apiStats) {
      const avgSpeedup = apiStats.avg / directStats.avg;
      const percentImprovement = ((apiStats.avg - directStats.avg) / apiStats.avg) * 100;
      improvement = { avgSpeedup, percentImprovement };
    }

    return {
      directSupabase: directStats,
      backendApi: apiStats,
      improvement
    };
  }

  // Get all operations that have been measured
  getOperations(): string[] {
    const operations = new Set(this.metrics.map(m => m.operation));
    return Array.from(operations);
  }

  // Export metrics for analysis
  exportMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    if (this.debugMode) {
      console.log('🧹 Performance metrics cleared');
    }
  }

  // Add cache busting parameters to URL
  addCacheBusting(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}&_r=${Math.random().toString(36).substr(2, 9)}`;
  }

  // Detect network conditions
  private getNetworkInfo(): NetworkInformation | undefined {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) return undefined;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  // Cleanup old metrics
  private cleanup(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Generate performance report
  generateReport(): string {
    const operations = this.getOperations();
    let report = '📊 Performance Report\n';
    report += '=' .repeat(50) + '\n\n';

    // Network info
    const networkInfo = this.getNetworkInfo();
    if (networkInfo) {
      report += `🌐 Network: ${networkInfo.effectiveType} (${networkInfo.downlink}Mbps, ${networkInfo.rtt}ms RTT)\n\n`;
    }

    operations.forEach(operation => {
      const comparison = this.comparePerformance(operation);
      report += `📈 ${operation.toUpperCase()}\n`;
      report += '-'.repeat(30) + '\n';

      if (comparison.directSupabase) {
        report += `Direct Supabase: ${comparison.directSupabase.avg.toFixed(2)}ms avg (${comparison.directSupabase.count} samples)\n`;
        report += `  P50: ${comparison.directSupabase.p50.toFixed(2)}ms | P90: ${comparison.directSupabase.p90.toFixed(2)}ms | P95: ${comparison.directSupabase.p95.toFixed(2)}ms\n`;
        report += `  Recent: ${comparison.directSupabase.recent.toFixed(2)}ms | Success: ${(comparison.directSupabase.successRate * 100).toFixed(1)}%\n`;
      }

      if (comparison.backendApi) {
        report += `Backend API: ${comparison.backendApi.avg.toFixed(2)}ms avg (${comparison.backendApi.count} samples)\n`;
        report += `  P50: ${comparison.backendApi.p50.toFixed(2)}ms | P90: ${comparison.backendApi.p90.toFixed(2)}ms | P95: ${comparison.backendApi.p95.toFixed(2)}ms\n`;
        report += `  Recent: ${comparison.backendApi.recent.toFixed(2)}ms | Success: ${(comparison.backendApi.successRate * 100).toFixed(1)}%\n`;
      }

      if (comparison.improvement) {
        report += `🚀 Improvement: ${comparison.improvement.avgSpeedup.toFixed(2)}x faster (${comparison.improvement.percentImprovement.toFixed(1)}% improvement)\n`;
      }

      report += '\n';
    });

    return report;
  }
}

// Create singleton instance
export const performanceService = new PerformanceService();

// Export performance timing hook for React components
export const usePerformanceTracking = () => {
  return {
    startTiming: performanceService.startTiming.bind(performanceService),
    endTiming: performanceService.endTiming.bind(performanceService),
    timeAsyncOperation: performanceService.timeAsyncOperation.bind(performanceService),
    getStats: performanceService.getStats.bind(performanceService),
    comparePerformance: performanceService.comparePerformance.bind(performanceService),
    generateReport: performanceService.generateReport.bind(performanceService),
    clearMetrics: performanceService.clearMetrics.bind(performanceService)
  };
};