const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  logger.info(`Donation processor API running on port ${PORT}`);
});

const shutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
