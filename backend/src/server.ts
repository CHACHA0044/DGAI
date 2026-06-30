import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap() {
  try {
    // Connect to database before accepting requests
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log('\n🛡️  Deadline Guardian AI — Backend');
      console.log(`🚀  Server running at http://0.0.0.0:${env.PORT}`);
      console.log(`🌍  Environment: ${env.NODE_ENV}`);
      console.log(`🤖  AI model: ${env.GEMINI_MODEL}`);
      console.log(`📊  Health: http://0.0.0.0:${env.PORT}/health\n`);
    });

    // ── Graceful shutdown ─────────────────────────────────────
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('✅  Server closed. Goodbye.');
        process.exit(0);
      });

      // Force exit if shutdown takes too long
      setTimeout(() => {
        console.error('⚠️  Forced exit after 10s shutdown timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
  }
}

void bootstrap();
