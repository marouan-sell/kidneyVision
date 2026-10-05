/**
 * System Health and Telemetry Types
 */

export interface ServiceHealthItem {
  name: string;
  status: 'online' | 'connected' | 'offline' | 'degraded';
  version?: string;
  php_version?: string;
  environment?: string;
  driver?: string;
  endpoint?: string;
  model_status?: 'loaded' | 'unloaded';
  model_version?: string;
  error?: string | null;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: {
    laravel_api: ServiceHealthItem;
    database: ServiceHealthItem;
    ai_service: ServiceHealthItem;
  };
  system_info: {
    application: string;
    version: string;
    environment: string;
    frontend: string;
    backend: string;
    ai_runtime: string;
    model_name: string;
    api_endpoint: string;
  };
}
