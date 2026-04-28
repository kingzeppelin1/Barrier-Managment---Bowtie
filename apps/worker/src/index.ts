const env = process.env.NODE_ENV ?? 'development';

console.log(`worker ready (env=${env})`);

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`worker shutting down (signal=${signal})`);
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
