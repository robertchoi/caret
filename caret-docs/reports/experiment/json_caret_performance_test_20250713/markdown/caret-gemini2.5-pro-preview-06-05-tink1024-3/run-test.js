const { runTests } = require('./script.test.js');
const { parseMarkdown } = require('./script.js');

// 테스트 환경에서 parseMarkdown 함수를 전역적으로 사용할 수 있도록 설정
global.parseMarkdown = parseMarkdown;

console.log("Running tests for markdown parser...");
runTests();
