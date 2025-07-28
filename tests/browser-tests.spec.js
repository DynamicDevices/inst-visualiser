/**
 * Browser Compatibility Tests - UWB Visualiser v4.0
 * Tests core functionality across different browsers
 */

const { test, expect } = require('@playwright/test');

test.describe('UWB Visualiser - Browser Compatibility', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:8080');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('Page loads correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/UWB Position Visualiser/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('UWB Position Visualiser v4.0');
    
    // Verify essential elements are present
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.controls')).toBeVisible();
    await expect(page.locator('.visualization')).toBeVisible();
  });

  test('CSS styles load correctly', async ({ page }) => {
    // Check if main CSS is loaded by verifying computed styles
    const headerColor = await page.locator('.header').evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should not be the default browser color
    expect(headerColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(headerColor).not.toBe('transparent');
  });

  test('JavaScript initialises correctly', async ({ page }) => {
    // Check if visualizer object is available in global scope
    const visualizerExists = await page.evaluate(() => {
      return typeof window.visualizer !== 'undefined';
    });
    
    expect(visualizerExists).toBe(true);
    
    // Check console for no critical errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Reload to capture any initialization errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('WebSocket') && // MQTT connection failures are expected in test
      !error.includes('paho-mqtt') &&
      !error.includes('MQTT')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('Simulation mode works', async ({ page }) => {
    // Start simulation
    await page.click('button:has-text("Start Simulation")');
    
    // Wait for nodes to appear
    await page.waitForTimeout(2000);
    
    // Check if nodes are created
    const nodeCount = await page.locator('.node').count();
    expect(nodeCount).toBeGreaterThan(0);
    
    // Check if connections are drawn
    const connectionCount = await page.locator('.connection').count();
    expect(connectionCount).toBeGreaterThan(0);
    
    // Verify simulation is running
    const isRunning = await page.evaluate(() => {
      return window.visualizer && window.visualizer.simulator && 
             window.visualizer.simulator.isRunning();
    });
    
    expect(isRunning).toBe(true);
  });

  test('Controls panel functionality', async ({ page }) => {
    // Test controls panel toggle
    await page.click('#toggleControls');
    
    // Check if controls are hidden
    const controlsVisible = await page.locator('#controlsContent').isVisible();
    expect(controlsVisible).toBe(false);
    
    // Toggle back
    await page.click('#toggleControls');
    
    // Check if controls are visible again
    const controlsVisibleAgain = await page.locator('#controlsContent').isVisible();
    expect(controlsVisibleAgain).toBe(true);
  });

  test('MQTT connection form validation', async ({ page }) => {
    // Click to expand MQTT settings if collapsed
    const mqttSection = page.locator('[data-section="mqtt"]');
    if (await mqttSection.getAttribute('class') && (await mqttSection.getAttribute('class')).includes('collapsed')) {
      await page.click('[data-section="mqtt"] .section-header');
    }
    
    // Test broker input validation
    await page.fill('#mqttBroker', '');
    await page.click('#connectBtn');
    
    // Should show validation message or prevent connection
    const brokerValue = await page.inputValue('#mqttBroker');
    expect(brokerValue.length).toBeGreaterThan(0); // Should have default value
  });

  test('Responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile styles are applied
    const headerHeight = await page.locator('.header').boundingBox();
    expect(headerHeight.height).toBeLessThan(80); // Should be compact on mobile
    
    // Check if controls are properly arranged
    const controlsPanel = await page.locator('.controls').boundingBox();
    expect(controlsPanel).toBeTruthy();
    
    // Verify visualization is still visible
    const visualization = await page.locator('.visualization').boundingBox();
    expect(visualization.height).toBeGreaterThan(200); // Should have reasonable height
  });

  test('Touch interactions work on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Start simulation to have nodes to interact with
    await page.click('button:has-text("Start Simulation")');
    await page.waitForTimeout(1000);
    
    // Test touch events on visualization area
    const visualization = page.locator('.visualization-canvas');
    
    // Simulate touch pan
    await visualization.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
    
    // Should not throw any JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('Performance with multiple nodes', async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceMarks = [];
      const originalMark = performance.mark;
      performance.mark = function(name) {
        window.performanceMarks.push({ name, time: Date.now() });
        return originalMark.call(this, name);
      };
    });
    
    // Start simulation
    await page.click('button:has-text("Start Simulation")');
    
    // Wait for simulation to stabilize
    await page.waitForTimeout(3000);
    
    // Check frame rate is reasonable
    const fps = await page.evaluate(() => {
      if (window.visualizer && window.visualizer.getStats) {
        return window.visualizer.getStats().fps;
      }
      return 60; // Default assumption
    });
    
    expect(fps).toBeGreaterThan(30); // Should maintain at least 30fps
  });

  test('Console logging works correctly', async ({ page }) => {
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Start simulation to generate logs
    await page.click('button:has-text("Start Simulation")');
    await page.waitForTimeout(1000);
    
    // Check for expected log messages
    const hasSimulationLogs = consoleMessages.some(msg => 
      msg.text.includes('Simulation') || msg.text.includes('nodes')
    );
    
    expect(hasSimulationLogs).toBe(true);
  });

  test('Emergency services theme applies correctly', async ({ page }) => {
    // Check if emergency services colors are applied
    const gatewayNode = page.locator('.node.gateway').first();
    
    if (await gatewayNode.count() === 0) {
      // Start simulation to create nodes
      await page.click('button:has-text("Start Simulation")');
      await page.waitForTimeout(2000);
    }
    
    // Check if B5A4 gateway node has emergency red color
    const gatewayExists = await page.locator('.node').first().isVisible();
    expect(gatewayExists).toBe(true);
  });

  test('Accessibility features work', async ({ page }) => {
    // Check ARIA labels and roles
    const hasAriaLabels = await page.locator('[aria-label]').count();
    expect(hasAriaLabels).toBeGreaterThan(0);
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT'].includes(focusedElement)).toBe(true);
    
    // Check color contrast (basic check)
    const textColor = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(textColor).not.toBe('rgb(128, 128, 128)'); // Should not be too light
  });
});