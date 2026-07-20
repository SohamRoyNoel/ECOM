export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'app_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ecommerce',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    ssl: process.env.DB_SSL === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtAbsoluteExpiresIn: process.env.JWT_ABSOLUTE_EXPIRES_IN || '12h',
    sessionInactivityTimeoutSeconds: parseInt(
      process.env.SESSION_INACTIVITY_TIMEOUT_SECONDS || '3600',
      10,
    ),
  },

  loginProtection: {
    ipMaxAttempts: parseInt(process.env.LOGIN_RATE_LIMIT_IP_MAX || '10', 10),
    ipWindowSeconds: parseInt(process.env.LOGIN_RATE_LIMIT_IP_WINDOW_SECONDS || '60', 10),
    lockoutMaxAttempts: parseInt(process.env.LOGIN_LOCKOUT_MAX_ATTEMPTS || '5', 10),
    lockoutWindowSeconds: parseInt(process.env.LOGIN_LOCKOUT_WINDOW_SECONDS || '900', 10),
    lockoutDurationSeconds: parseInt(process.env.LOGIN_LOCKOUT_DURATION_SECONDS || '900', 10),
  },

  seed: {
    demoUserPassword: process.env.SEED_DEMO_USER_PASSWORD || 'Password@2026',
    productCount: parseInt(process.env.SEED_PRODUCT_COUNT || '5000', 10),
  },
});
