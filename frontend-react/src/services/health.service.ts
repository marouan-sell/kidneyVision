import { apiClient, API_URL } from "./client";
import { SystemHealth } from "../types";

/**
 * GET /system/health
 * Live telemetry check of Laravel, DB, Flask AI microservice, and deep learning model.
 */
export async function fetchSystemHealth(): Promise<SystemHealth> {
  try {
    const response = await apiClient.get('/system/health');
    return response.data.data;
  } catch (e: any) {
    console.error("Failed to fetch system health:", e);
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        laravel_api: { name: 'Laravel API', status: 'online' },
        database: { name: 'Database', status: 'offline', error: 'Connection failed' },
        ai_service: { name: 'AI / Flask Service', status: 'offline', model_status: 'unloaded', error: 'Service unreachable' },
      },
      system_info: {
        application: 'KidneyVision AI',
        version: '1.2.0-clinical',
        environment: 'development',
        frontend: 'React 18 + Vite + TypeScript',
        backend: 'Laravel',
        ai_runtime: 'Flask + TensorFlow',
        model_name: 'Kidney Stone Classifier (best_model.keras)',
        api_endpoint: API_URL,
      }
    };
  }
}
