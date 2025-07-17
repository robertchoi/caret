const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Get the directory of the current script
const currentDir = __dirname;

// --- Load script.js in a sandboxed context ---
const scriptContent = fs.readFileSync(path.join(currentDir, 'script.js'), 'utf8');

// Create a sandbox with a mock document object
const sandbox = {
    module: {},
    document: {
        addEventListener: () => {}, // Mock function, does nothing
    },
    // Add other browser-specific globals if needed
};

vm.createContext(sandbox);
vm.runInContext(scriptContent, sandbox);
const { parseMarkdown } = sandbox.module.exports;


// --- Load and run test.js in the current context ---
const testContent = fs.readFileSync(path.join(currentDir, 'script.test.js'), 'utf8');

// Make parseMarkdown globally available for the test script
global.parseMarkdown = parseMarkdown;

// Remove the 'process.exit(1)' from the test file content before evaluating
const modifiedTestContent = testContent.replace(/process.exit\(1\);/g, 'throw new Error("Test suite failed");');


// Execute the modified test script
try {
    eval(modifiedTestContent);
    console.log('\nAll tests executed successfully.');
} catch (e) {
    console.error('\nOne or more tests failed.');
    console.error(e.message);
}
