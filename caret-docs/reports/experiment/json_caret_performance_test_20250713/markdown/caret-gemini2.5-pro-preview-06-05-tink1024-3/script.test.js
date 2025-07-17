// script.test.js

// 테스트를 위한 간단한 assert 함수
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// 테스트 스위트
function runTests() {
    try {
        // 헤더 테스트
        test("Converts headers correctly", () => {
            assert(parseMarkdown("# Header 1") === "<h1>Header 1</h1>", "H1 conversion failed");
            assert(parseMarkdown("## Header 2") === "<h2>Header 2</h2>", "H2 conversion failed");
            assert(parseMarkdown("### Header 3") === "<h3>Header 3</h3>", "H3 conversion failed");
            assert(parseMarkdown("#### Header 4") === "<h4>Header 4</h4>", "H4 conversion failed");
            assert(parseMarkdown("##### Header 5") === "<h5>Header 5</h5>", "H5 conversion failed");
            assert(parseMarkdown("###### Header 6") === "<h6>Header 6</h6>", "H6 conversion failed");
        });

        // 강조 테스트
        test("Converts emphasis correctly", () => {
            assert(parseMarkdown("**bold text**") === "<p><strong>bold text</strong></p>", "Bold conversion failed");
            assert(parseMarkdown("__bold text__") === "<p><strong>bold text</strong></p>", "Bold (underscore) conversion failed");
            assert(parseMarkdown("*italic text*") === "<p><em>italic text</em></p>", "Italic conversion failed");
            assert(parseMarkdown("_italic text_") === "<p><em>italic text</em></p>", "Italic (underscore) conversion failed");
        });

        // 순서 없는 목록 테스트
        test("Converts unordered lists correctly", () => {
            const markdown = "* Item 1\n* Item 2";
            const expected = "<ul><li>Item 1</li><li>Item 2</li></ul>";
            assert(parseMarkdown(markdown) === expected, "Unordered list conversion failed");
        });

        // 순서 있는 목록 테스트
        test("Converts ordered lists correctly", () => {
            const markdown = "1. Item 1\n2. Item 2";
            const expected = "<ol><li>Item 1</li><li>Item 2</li></ol>";
            assert(parseMarkdown(markdown) === expected, "Ordered list conversion failed");
        });
        
        // 코드 블록 테스트
        test("Converts code blocks correctly", () => {
            const markdown = "```\nconst x = 1;\n```";
            const expected = "<pre><code>const x = 1;\n</code></pre>";
            assert(parseMarkdown(markdown) === expected, "Code block conversion failed");
        });

        // 인용구 테스트
        test("Converts blockquotes correctly", () => {
            const markdown = "> This is a quote";
            const expected = "<blockquote><p>This is a quote</p></blockquote>";
            assert(parseMarkdown(markdown) === expected, "Blockquote conversion failed");
        });

        // 복합 테스트
        test("Converts a mix of markdown correctly", () => {
            const markdown = "# Title\n\n* List item 1\n* List item 2\n\n**Bold and *italic***";
            const expected = "<h1>Title</h1><ul><li>List item 1</li><li>List item 2</li></ul><p><strong>Bold and <em>italic</em></strong></p>";
            assert(parseMarkdown(markdown) === expected, "Complex markdown conversion failed");
        });

        console.log("All tests passed! ✨");

    } catch (e) {
        console.error("Test failed: ", e.message);
    }
}

// 테스트 실행을 위한 래퍼 함수
function test(name, fn) {
    try {
        fn();
        console.log(`✅ Test passed: ${name}`);
    } catch (e) {
        console.error(`❌ Test failed: ${name}`);
        throw e;
    }
}

// `parseMarkdown` 함수가 아직 없으므로, 테스트 실행을 위해 임시로 정의합니다.
// 실제 구현은 script.js 파일에서 이루어집니다.
function parseMarkdown(markdown) {
    // 이 함수는 script.js에서 구현될 것입니다.
    // 테스트를 위해 임시로 window에 있는 함수를 사용하거나,
    // Node.js 환경이라면 require를 사용해야 합니다.
    // 지금은 테스트 파일이므로, 실제 구현이 있다고 가정합니다.
    if (typeof window !== 'undefined' && window.parseMarkdown) {
        return window.parseMarkdown(markdown);
    }
    // Node.js 환경 테스트를 위한 임시 처리
    if (typeof require !== 'undefined') {
        const { parseMarkdown } = require('./script.js');
        return parseMarkdown(markdown);
    }
    return "";
}

// Node.js 환경에서 직접 실행될 경우 테스트를 실행합니다.
if (typeof module !== 'undefined' && module.exports) {
    // 이 파일이 직접 실행되었을 때만 테스트를 실행하기 위함
    if (require.main === module) {
        // 실제 parseMarkdown 함수를 script.js에서 가져와야 합니다.
        // 지금은 파일이 없으므로, 테스트 실행은 script.js 구현 후 가능합니다.
        console.log("Running tests for markdown parser...");
        // runTests(); // script.js 구현 후 주석 해제
    }
    module.exports = { runTests }; // 다른 파일에서 import하여 사용할 수 있도록
}
