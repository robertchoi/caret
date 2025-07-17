// This script runs the tests defined in script.test.js using Node.js

// Import the necessary functions
const { parseMarkdown } = require('./script.js');
const { runTests } = require('./script.test.js');

// Make parseMarkdown globally available for the test script
global.parseMarkdown = parseMarkdown;

// Execute the tests
console.log('Starting Markdown Parser Tests...');
runTests();
