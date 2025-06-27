import { ApiAdapter } from './api-adapter'
import { CacheManager } from './cache-manager'

export interface OrchestratorOptions {
  services: Record<string, ApiAdapter>
  cacheTTL?: number
}

export class ServiceOrchestrator {
  private services: Record<string, ApiAdapter>
  private cache: CacheManager

  constructor(options: OrchestratorOptions) {
    this.services = options.services
    this.cache = new CacheManager({ ttlSeconds: options.cacheTTL })
  }


  async executeWorkflow(
    workflowId: string,
    steps: Array<{ serviceKey: string; path: string; useCache?: boolean }>
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {}

    for (const step of steps) {
      const cacheKey = `${workflowId}:${step.serviceKey}:${step.path}`
      if (step.useCache) {
        const cached = this.cache.get<any>(cacheKey)
        if (cached !== undefined) {
          results[step.serviceKey] = cached
          continue
        }
      }

      const service = this.services[step.serviceKey]
      if (!service) throw new Error(`Service ${step.serviceKey} not found`)

      const data = await service.get<any>(step.path, step.useCache)
      results[step.serviceKey] = data
      if (step.useCache) this.cache.set(cacheKey, data)
    }

    return results
  }
}
