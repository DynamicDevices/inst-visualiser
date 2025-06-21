/**
 * Global Test Teardown - UWB Visualiser v4.0
 * Cleans up testing environment after all tests complete
 */

const fs = require('fs').promises;
const path = require('path');

async function globalTeardown() {
    console.log('🧹 Starting global test teardown...');
    
    try {
        // Generate test summary report
        console.log('📊 Generating test summary...');
        
        const testResultsDir = 'test-results';
        
        // Check if test results directory exists
        try {
            await fs.access(testResultsDir);
            
            // Read test results if available
            const resultsPath = path.join(testResultsDir, 'results.json');
            
            try {
                const resultsData = await fs.readFile(resultsPath, 'utf8');
                const results = JSON.parse(resultsData);
                
                console.log('📈 Test Results Summary:');
                console.log(`├── Total tests: ${results.stats?.total || 'Unknown'}`);
                console.log(`├── Passed: ${results.stats?.passed || 'Unknown'}`);
                console.log(`├── Failed: ${results.stats?.failed || 'Unknown'}`);
                console.log(`├── Skipped: ${results.stats?.skipped || 'Unknown'}`);
                console.log(`└── Duration: ${results.stats?.duration || 'Unknown'}ms`);
                
            } catch (error) {
                console.log('📊 Test results file not found or unreadable');
            }
            
        } catch (error) {
            console.log('📊 Test results directory not found');
        }
        
        // Cleanup temporary files if needed
        console.log('🗂️ Cleaning up temporary test files...');
        
        const tempFiles = [
            'lighthouse-report.json',
            '.eslintcache',
            'coverage'
        ];
        
        for (const file of tempFiles) {
            try {
                await fs.access(file);
                await fs.rm(file, { recursive: true, force: true });
                console.log(`   ✅ Removed ${file}`);
            } catch (error) {
                // File doesn't exist, which is fine
            }
        }
        
        // Log final status
        console.log('✅ Global teardown completed successfully');
        
        // Performance summary if available
        try {
            const lighthouseReport = await fs.readFile('lighthouse-report.json', 'utf8');
            const report = JSON.parse(lighthouseReport);
            
            if (report.lhr?.categories) {
                const scores = report.lhr.categories;
                console.log('⚡ Performance Summary:');
                console.log(`├── Performance: ${Math.round(scores.performance?.score * 100) || 'N/A'}`);
                console.log(`├── Accessibility: ${Math.round(scores.accessibility?.score * 100) || 'N/A'}`);
                console.log(`├── Best Practices: ${Math.round(scores['best-practices']?.score * 100) || 'N/A'}`);
                console.log(`└── SEO: ${Math.round(scores.seo?.score * 100) || 'N/A'}`);
            }
        } catch (error) {
            // Lighthouse report not available
        }
        
    } catch (error) {
        console.error('❌ Global teardown error:', error.message);
        // Don't throw error to avoid failing the entire test suite
    }
    
    console.log('🏁 Test suite execution completed');
}

module.exports = globalTeardown;