/**
 * Playwright Configuration - UWB Visualiser v4.0
 * Browser testing configuration for emergency services application
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // Global test timeout
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],
  
  // Global test setup
  globalSetup: '../tests/global-setup.js',
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8080',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Default viewport
    viewport: { width: 1280, height: 720 },
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 15000
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Emergency services specific settings
        contextOptions: {
          permissions: ['geolocation', 'notifications']
        }
      }
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          permissions: ['geolocation', 'notifications']
        }
      }
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          permissions: ['geolocation', 'notifications']
        }
      }
    },
    
    // Mobile testing for emergency responder tablets
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        contextOptions: {
          permissions: ['geolocation', 'notifications']
        }
      }
    },
    
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        contextOptions: {
          permissions: ['geolocation', 'notifications']
        }
      }
    },
    
    // Tablet testing for incident command
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        contextOptions: {
          permissions: ['geolocation', 'notifications']
        }
      }
    },
    
    // High contrast mode for accessibility
    {
      name: 'high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        contextOptions: {
          forcedColors: 'active',
          permissions: ['geolocation', 'notifications']
        }
      }
    }
  ],

  // Local development server
  webServer: {
    command: 'npm start',
    port: 8080,
    reuseExistingServer: true,
    timeout: 10000
  },
  
  // Test result output
  outputDir: 'test-results/artifacts',
  
  // Global teardown
  globalTeardown: '../tests/global-teardown.js'
});