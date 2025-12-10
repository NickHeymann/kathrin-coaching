/**
 * Jest Configuration
 */
module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'middleware/**/*.js',
        'routes/**/*.js',
        'services/**/*.js',
        '!**/node_modules/**'
    ],
    testMatch: ['**/__tests__/**/*.test.js'],
    verbose: true
};
