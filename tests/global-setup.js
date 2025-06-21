/**
 * Global Test Setup - UWB Visualiser v4.0
 * Prepares testing environment for emergency services application
 */

const { chromium } = require('@playwright/test');

async function globalSetup() {
    console.log('🚀 Setting up global test environment...');
    
    // Launch browser for setup
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Test if server is accessible
        console.log('🌐 Testing server accessibility...');
        await page.goto('http://localhost:8080', { timeout: 10000 });
        
        // Wait for critical resources to load
        await page.waitForLoadState('networkidle');
        
        // Verify essential elements exist
        const headerExists = await page.locator('.header').count();
        const visualizationExists = await page.locator('.visualization').count();
        
        if (headerExists === 0 || visualizationExists === 0) {
            throw new Error('Essential UI elements not found');
        }
        
        console.log('✅ Server and application ready for testing');
        
        // Pre-warm any caches or setup test data if needed
        console.log('📊 Pre-warming application state...');
        
        // Test basic JavaScript functionality
        const jsError = await page.evaluate(() => {
            try {
                // Test if core objects are available
                if (typeof window.visualizer === 'undefined') {
                    return 'Visualizer not initialized';
                }
                return null;
            } catch (error) {
                return error.message;
            }
        });
        
        if (jsError) {
            console.warn(`⚠️ JavaScript setup warning: ${jsError}`);
        }
        
        console.log('🎯 Global setup completed successfully');
        
    } catch (error) {
        console.error('❌ Global setup failed:', error.message);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }
}

module.exports = globalSetup;