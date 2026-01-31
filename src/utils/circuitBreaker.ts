/**
 * Circuit Breaker pattern implementation to handle failing API services gracefully.
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitOptions {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms to wait before trying again (HALF_OPEN)
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly options: CircuitOptions;

  constructor(options: CircuitOptions = { failureThreshold: 3, resetTimeout: 30000 }) {
    this.options = options;
  }

  public async execute<T>(action: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        console.warn('Circuit is OPEN. Serving fallback.');
        return fallback();
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      console.error('Action failed in Circuit Breaker:', error);
      return fallback();
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`Circuit Breaker TRIPPED! State: OPEN. (Failures: ${this.failureCount})`);
    }
  }

  public getStatus() {
    return {
      state: this.state,
      failures: this.failureCount
    };
  }
}

// Export singleton instance for global use if needed, but classes allow multiple instances per service
export const apiCircuitBreaker = new CircuitBreaker();
