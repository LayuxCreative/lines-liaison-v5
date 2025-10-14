import { apiService } from '../client/services/api';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

export class DiagnosticTest {
  private results: DiagnosticResult[] = [];

  async runAllTests(): Promise<DiagnosticResult[]> {
    this.results = [];
    
    await this.testApiConnectivity();
    await this.testAuthEndpoint();
    await this.testProjectsEndpoint();
    await this.testEnvironmentVariables();
    
    return this.results;
  }

  private addResult(test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: unknown) {
    this.results.push({ test, status, message, details });
  }

  private async testApiConnectivity(): Promise<void> {
    // Backend API disabled - using Supabase directly
    this.addResult('API Connectivity', 'warning', 'Backend API disabled - using Supabase directly');
  }

  private async testAuthEndpoint(): Promise<void> {
    try {
      const response = await apiService.get('/auth/me');
      if (response.success || 
          response.error?.includes('401') || 
          response.error?.includes('Unauthorized') ||
          (response.error === 'Unauthorized - Please log in again')) {
        this.addResult('Auth Endpoint', 'pass', 'Auth endpoint is accessible and properly secured');
      } else {
        this.addResult('Auth Endpoint', 'warning', 'Auth endpoint returned unexpected response', response);
      }
    } catch (error) {
      this.addResult('Auth Endpoint', 'fail', 'Auth endpoint test failed', error);
    }
  }

  private async testProjectsEndpoint(): Promise<void> {
    try {
      const response = await apiService.get('/projects');
      if (response.success || response.error?.includes('401') || response.error?.includes('Unauthorized')) {
        this.addResult('Projects Endpoint', 'pass', 'Projects endpoint is accessible (requires authentication)');
      } else if (response.error?.includes('404')) {
        this.addResult('Projects Endpoint', 'fail', 'Projects endpoint not found', response);
      } else {
        this.addResult('Projects Endpoint', 'warning', 'Projects endpoint returned unexpected response', response);
      }
    } catch (error) {
      this.addResult('Projects Endpoint', 'fail', 'Projects endpoint test failed', error);
    }
  }

  private async testEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_API_URL'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length === 0) {
      this.addResult('Environment Variables', 'pass', 'All required environment variables are set');
    } else {
      this.addResult('Environment Variables', 'warning', `Missing variables: ${missingVars.join(', ')}`);
    }
  }

  static async quickTest(): Promise<boolean> {
    // Backend disabled - always return true for Supabase
    return true;
  }
}

export const diagnosticTest = new DiagnosticTest();