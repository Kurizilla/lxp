import { Request, Response, Router } from 'express';

/**
 * Health check response interface
 */
interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

/**
 * Health controller - provides health check endpoint
 */
export class HealthController {
  public router: Router;

  constructor() {
    this.router = Router();
    this.init_routes();
  }

  /**
   * Initialize routes for health controller
   */
  private init_routes(): void {
    this.router.get('/health', this.get_health.bind(this));
  }

  /**
   * GET /health - Health check endpoint
   * Returns the current health status of the service
   */
  public get_health(_req: Request, res: Response): void {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    res.status(200).json(response);
  }
}

export const health_controller = new HealthController();
