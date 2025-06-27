import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'

// Define schema for configuration
const ConfigSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DB_HOST: z.string(),
  DB_PORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  REDIS_URL: z.string().optional(),
})

type Config = z.infer<typeof ConfigSchema>

export class SettingsManager {
  private config: Config

  constructor(envFilePath?: string) {
    const envPath = envFilePath ?? path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath)
      const lines = envContent.toString().split(/\r?\n/)
      lines.forEach((line) => {
        const [key, ...vals] = line.split('=')
        if (key) process.env[key] = vals.join('=')
      })
    }

    // Parse and validate env vars
    const parsed = ConfigSchema.safeParse(process.env)
    if (!parsed.success) {
      console.error('Configuration validation error:', parsed.error.format())
      process.exit(1)
    }

    this.config = parsed.data
  }

  // Get full config object
  getAll(): Config {
    return this.config
  }

  // Get specific config value
  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key]
  }
}

// Example usage:
// const settings = new SettingsManager()
// const port = settings.get('PORT') || 3000
// const env = settings.get('ENV')
