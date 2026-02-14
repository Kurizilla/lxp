import express, { Application, Request, Response, NextFunction } from 'express';
import { health_controller } from './controllers/health_controller';

/**
 * Express application setup
 */
export function create_app(): Application {
  const app: Application = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/', health_controller.router);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
