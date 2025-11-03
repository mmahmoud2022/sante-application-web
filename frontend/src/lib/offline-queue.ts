/**
 * Offline Queue Utility
 * Queues API requests when offline and syncs when back online
 */

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private readonly STORAGE_KEY = 'offline-queue';
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const queue = JSON.parse(stored) as QueuedRequest[];
        // Filter out old requests
        const now = Date.now();
        this.queue = queue.filter(
          req => now - req.timestamp < this.MAX_AGE_MS
        );
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Add a request to the queue
   */
  add(url: string, options: RequestInit): void {
    // Don't queue GET requests
    if (!options.method || options.method.toUpperCase() === 'GET') {
      return;
    }

    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      url,
      options,
      timestamp: Date.now(),
    };

    this.queue.push(request);

    // Limit queue size
    if (this.queue.length > this.MAX_QUEUE_SIZE) {
      this.queue.shift();
    }

    this.saveToStorage();
  }

  /**
   * Flush the queue - attempt to send all queued requests
   */
  async flush(): Promise<{ success: number; failed: number }> {
    if (this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    const requests = [...this.queue];
    this.queue = [];

    for (const request of requests) {
      try {
        const response = await fetch(request.url, request.options);
        if (response.ok) {
          success++;
        } else {
          failed++;
          // Re-queue failed requests if they might succeed later
          if (response.status >= 500) {
            this.queue.push(request);
          }
        }
      } catch (error) {
        failed++;
        // Re-queue on network error
        this.queue.push(request);
        console.error('Failed to sync request:', error);
      }
    }

    this.saveToStorage();
    return { success, failed };
  }

  /**
   * Get the current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

/**
 * Enhanced fetch that automatically queues requests when offline
 */
export async function offlineFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // If offline, queue the request
    if (!navigator.onLine) {
      offlineQueue.add(url, options);
      throw new Error('Request queued for offline sync');
    }
    throw error;
  }
}
