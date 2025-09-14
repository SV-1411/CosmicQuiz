// Performance optimization utilities for high-traffic scenarios
import { supabase } from './supabase'

// Connection pooling and rate limiting
class ConnectionManager {
  constructor() {
    this.requestQueue = []
    this.activeRequests = 0
    this.maxConcurrentRequests = 10
    this.rateLimitDelay = 100 // ms between requests
    this.lastRequestTime = 0
  }

  async executeQuery(queryFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ queryFn, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
      return
    }

    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      setTimeout(() => this.processQueue(), this.rateLimitDelay - timeSinceLastRequest)
      return
    }

    const { queryFn, resolve, reject } = this.requestQueue.shift()
    this.activeRequests++
    this.lastRequestTime = Date.now()

    try {
      const result = await queryFn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.activeRequests--
      // Process next item after a small delay
      setTimeout(() => this.processQueue(), this.rateLimitDelay)
    }
  }
}

export const connectionManager = new ConnectionManager()

// Pagination utilities
export const PAGINATION_LIMITS = {
  PARTICIPANTS: 50,
  LEADERBOARD: 100,
  QUESTIONS: 20
}

export async function getPaginatedParticipants(sessionId, page = 0, limit = PAGINATION_LIMITS.PARTICIPANTS) {
  return connectionManager.executeQuery(async () => {
    const { data, error, count } = await supabase
      .from('participants')
      .select('*', { count: 'exact' })
      .eq('quiz_session_id', sessionId)
      .order('joined_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    return { data: data || [], error, totalCount: count, hasMore: count > (page + 1) * limit }
  })
}

export async function getPaginatedLeaderboard(sessionId, page = 0, limit = PAGINATION_LIMITS.LEADERBOARD) {
  return connectionManager.executeQuery(async () => {
    const { data, error, count } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact' })
      .eq('quiz_session_id', sessionId)
      .order('total_score', { ascending: false })
      .order('updated_at', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1)

    return { data: data || [], error, totalCount: count, hasMore: count > (page + 1) * limit }
  })
}

// Debounced updates to prevent excessive API calls
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Memory management for realtime subscriptions
export class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map()
    this.maxSubscriptions = 5
  }

  addSubscription(key, subscription) {
    // Remove oldest subscription if at limit
    if (this.subscriptions.size >= this.maxSubscriptions) {
      const oldestKey = this.subscriptions.keys().next().value
      const oldestSub = this.subscriptions.get(oldestKey)
      oldestSub?.unsubscribe()
      this.subscriptions.delete(oldestKey)
    }

    this.subscriptions.set(key, subscription)
  }

  removeSubscription(key) {
    const subscription = this.subscriptions.get(key)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(key)
    }
  }

  cleanup() {
    this.subscriptions.forEach(sub => sub?.unsubscribe())
    this.subscriptions.clear()
  }
}

// Error retry logic with exponential backoff
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Batch operations for bulk updates
export async function batchUpdateParticipants(updates) {
  const batchSize = 10
  const batches = []
  
  for (let i = 0; i < updates.length; i += batchSize) {
    batches.push(updates.slice(i, i + batchSize))
  }

  const results = []
  for (const batch of batches) {
    const batchPromises = batch.map(update => 
      connectionManager.executeQuery(() => 
        supabase.from('participants').update(update.data).eq('id', update.id)
      )
    )
    
    const batchResults = await Promise.allSettled(batchPromises)
    results.push(...batchResults)
  }

  return results
}
