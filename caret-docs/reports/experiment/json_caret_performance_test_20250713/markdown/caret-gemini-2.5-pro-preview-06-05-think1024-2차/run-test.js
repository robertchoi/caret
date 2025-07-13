const { parseMarkdown } = require('./script.js');
const { describe, it, assertEquals, runTests, tests } = require('./script.test.js');

// Make parseMarkdown globally available for the tests
global.parseMarkdown = parseMarkdown;

const { results, passed, failed } = runTests();

console.log('--- Test Results ---');
results.forEach(result => {
    console.log(`[${result.status}] ${result.suite} > ${result.name}`);
    if (result.status === '❌') {
        console.error(`  => ${result.error}`);
    }
});
console.log('--------------------');
console.log(`Summary: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1); // Exit with error code if any test fails
}
