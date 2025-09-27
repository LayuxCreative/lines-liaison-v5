import { test, expect, Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface PageResult {
  url: string;
  status: number;
  title: string;
  hasContent: boolean;
  consoleErrors: string[];
  screenshot?: string;
  error?: string;
}

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001';

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

// Pages to test
const PAGES_TO_TEST = [
  { path: '/', name: 'Home', requiresAuth: false },
  { path: '/services', name: 'Services', requiresAuth: false },
  { path: '/about', name: 'About', requiresAuth: false },
  { path: '/contact', name: 'Contact', requiresAuth: false },
  { path: '/login', name: 'Login', requiresAuth: false },
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/dashboard/projects', name: 'Projects', requiresAuth: true },
  { path: '/dashboard/create-project', name: 'Create Project', requiresAuth: true },
  { path: '/dashboard/files', name: 'Files', requiresAuth: true },
  { path: '/dashboard/communication', name: 'Communication', requiresAuth: true },
  { path: '/dashboard/reports', name: 'Reports', requiresAuth: true },
  { path: '/dashboard/invoices', name: 'Invoices', requiresAuth: true },
  { path: '/dashboard/contracts', name: 'Contracts', requiresAuth: true },
  { path: '/dashboard/tasks', name: 'Tasks', requiresAuth: true },
  { path: '/dashboard/profile', name: 'Profile', requiresAuth: true },
  { path: '/dashboard/settings', name: 'Settings', requiresAuth: true }
];

test.describe('Frontend Pages Diagnostic', () => {
  let results: PageResult[] = [];

  test.beforeAll(async () => {
    // Create artifacts directory
    try {
      mkdirSync(join(process.cwd(), 'artifacts', 'diag'), { recursive: true });
    } catch (error) {
      console.log('Artifacts directory already exists');
    }
  });

  test.afterAll(async () => {
    // Generate report
    const report = generateReport(results);
    const reportPath = join(process.cwd(), 'artifacts', 'diag', 'FRONTEND_REPORT.md');
    writeFileSync(reportPath, report);
    console.log(`Report generated: ${reportPath}`);
  });

  test('Health check - Backend API', async ({ request }) => {
    try {
      const response = await request.get(`${BACKEND_URL}/api/health`);
      expect(response.status()).toBe(200);
      console.log('✅ Backend API is running');
    } catch (error) {
      console.log('❌ Backend API is not accessible');
      throw error;
    }
  });

  test('Health check - Frontend Server', async ({ page }) => {
    try {
      await page.goto(FRONTEND_URL);
      expect(page.url()).toContain('localhost:5173');
      console.log('✅ Frontend server is running');
    } catch (error) {
      console.log('❌ Frontend server is not accessible');
      throw error;
    }
  });

  test('Test all public pages', async ({ page }) => {
    const publicPages = PAGES_TO_TEST.filter(p => !p.requiresAuth);
    
    for (const pageInfo of publicPages) {
      const result = await testPage(page, pageInfo.path, pageInfo.name);
      results.push(result);
    }
  });

  test('Test authenticated pages', async ({ page }) => {
    // First login
    const loginSuccess = await performLogin(page);
    if (!loginSuccess) {
      console.log('❌ Login failed, skipping authenticated pages');
      return;
    }

    const authPages = PAGES_TO_TEST.filter(p => p.requiresAuth);
    
    for (const pageInfo of authPages) {
      const result = await testPage(page, pageInfo.path, pageInfo.name);
      results.push(result);
    }
  });
});

async function performLogin(page: Page): Promise<boolean> {
  try {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed - not redirected to dashboard');
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error);
    return false;
  }
}

async function testPage(page: Page, path: string, name: string): Promise<PageResult> {
  const url = `${FRONTEND_URL}${path}`;
  const consoleErrors: string[] = [];
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log(`Testing: ${name} (${path})`);
    
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    const status = response?.status() || 0;
    
    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    
    // Check for main content indicators
    const hasContent = await checkForContent(page);
    
    // Take screenshot
    const screenshotPath = `artifacts/diag/screenshot-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    const result: PageResult = {
      url,
      status,
      title,
      hasContent,
      consoleErrors: [...consoleErrors],
      screenshot: screenshotPath
    };
    
    console.log(`  Status: ${status}, Content: ${hasContent ? '✅' : '❌'}, Errors: ${consoleErrors.length}`);
    
    return result;
    
  } catch (error) {
    console.log(`  ❌ Error: ${error}`);
    
    return {
      url,
      status: 0,
      title: '',
      hasContent: false,
      consoleErrors: [...consoleErrors],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkForContent(page: Page): Promise<boolean> {
  try {
    // Check for common content indicators
    const indicators = [
      'main',
      '[role="main"]',
      '.dashboard',
      '.content',
      'h1, h2, h3',
      '.project-card',
      '.task-item',
      'form',
      '.loading',
      '.spinner'
    ];
    
    for (const selector of indicators) {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          return true;
        }
      }
    }
    
    // Check if page has meaningful text content
    const bodyText = await page.textContent('body');
    if (bodyText && bodyText.trim().length > 100) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

function generateReport(results: PageResult[]): string {
  const now = new Date().toISOString();
  const totalPages = results.length;
  const successfulPages = results.filter(r => r.status === 200 && r.hasContent).length;
  const failedPages = results.filter(r => r.status !== 200 || !r.hasContent);
  const successRate = totalPages > 0 ? (successfulPages / totalPages * 100).toFixed(1) : '0';
  
  let report = `# Frontend Diagnostic Report

Generated: ${now}

## Summary
- **Total Pages Tested**: ${totalPages}
- **Successful Pages**: ${successfulPages}
- **Failed Pages**: ${failedPages.length}
- **Success Rate**: ${successRate}%

## Results

### ✅ Successful Pages
`;

  results.filter(r => r.status === 200 && r.hasContent).forEach(result => {
    report += `- **${result.url}**
  - Status: ${result.status}
  - Title: "${result.title}"
  - Console Errors: ${result.consoleErrors.length}
  - Screenshot: ${result.screenshot}

`;
  });

  report += `
### ❌ Failed Pages
`;

  failedPages.forEach(result => {
    report += `- **${result.url}**
  - Status: ${result.status}
  - Title: "${result.title}"
  - Has Content: ${result.hasContent}
  - Console Errors: ${result.consoleErrors.length}
  - Error: ${result.error || 'N/A'}
  - Screenshot: ${result.screenshot}
`;

    if (result.consoleErrors.length > 0) {
      report += `  - Console Errors:\n`;
      result.consoleErrors.forEach(error => {
        report += `    - ${error}\n`;
      });
    }
    report += '\n';
  });

  report += `
## Recommendations

### Critical Issues
${failedPages.length > 0 ? failedPages.map(r => `- Fix ${r.url}: ${r.error || 'Page not loading properly'}`).join('\n') : '- No critical issues found'}

### Console Errors
${results.some(r => r.consoleErrors.length > 0) ? 
  results.filter(r => r.consoleErrors.length > 0).map(r => 
    `- ${r.url}: ${r.consoleErrors.length} errors`
  ).join('\n') : 
  '- No console errors found'}

### Next Steps
1. Fix pages with status codes other than 200
2. Ensure all pages have meaningful content
3. Resolve console errors
4. Add proper error boundaries
5. Implement loading states
`;

  return report;
}