// data-repository.ts
// Generic repository for CRUD operations with caching and database

import { DBClient } from "./db-client"
import { CacheManager } from "./cache-manager"

export interface Entity {
  id: string
  [key: string]: any
}

export interface RepositoryOptions {
  cacheTTL?: number // seconds
}

export class DataRepository<T extends Entity> {
  private db: DBClient
  private cache: CacheManager
  private tableName: string

  constructor(
    tableName: string,
    dbClient: DBClient,
    options?: RepositoryOptions
  ) {
    this.tableName = tableName
    this.db = dbClient
    this.cache = new CacheManager({ ttlSeconds: options?.cacheTTL })
  }

  // Get entity by ID, caches result
  async getById(id: string): Promise<T | null> {
    const cacheKey = `${this.tableName}:${id}`
    const cached = this.cache.get<T>(cacheKey)
    if (cached) return cached

    const result = await this.db.query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`,
      [id]
    )
    const entity = result.rows[0] ?? null
    if (entity) this.cache.set(cacheKey, entity)
    return entity
  }

  // Create a new entity
  async create(data: Omit<T, "id">): Promise<T> {
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ")

    const query = `INSERT INTO ${this.tableName}(${fields.join(", ")}) VALUES(${placeholders}) RETURNING *`
    const result = await this.db.query<T>(query, values)
    const entity = result.rows[0]
    if (entity) this.cache.set(`${this.tableName}:${entity.id}`, entity)
    return entity
  }

  // Update an existing entity
  async update(id: string, data: Partial<Omit<T, "id">>): Promise<T | null> {
    const fields = Object.keys(data)
    if (fields.length === 0) return this.getById(id)

    const values = Object.values(data)
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ")
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`

    const result = await this.db.query<T>(query, [...values, id])
    const entity = result.rows[0] ?? null
    if (entity) this.cache.set(`${this.tableName}:${id}`, entity)
    return entity
  }

  // Delete entity by ID
  async delete(id: string): Promise<boolean> {
    await this.db.query(`DELETE FROM ${this.tableName} WHERE id = $1`, [id])
    this.cache.delete(`${this.tableName}:${id}`)
    return true
  }

  // Clear entire table and cache
  async clearAll(): Promise<void> {
    await this.db.query(`TRUNCATE ${this.tableName}`)
    this.cache.clear()
  }
}
