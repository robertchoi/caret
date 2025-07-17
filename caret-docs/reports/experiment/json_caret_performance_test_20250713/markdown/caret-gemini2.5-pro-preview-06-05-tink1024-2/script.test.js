// 가상 테스트 환경 설정
const assert = {
    strictEqual: (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message} - Expected "${expected}", but got "${actual}"`);
        }
    }
};

// 테스트 스위트 정의
function describe(suiteName, fn) {
    console.log(`\nRunning suite: ${suiteName}`);
    try {
        fn();
        console.log(`Suite passed: ${suiteName}`);
    } catch (error) {
        console.error(`Suite failed: ${suiteName}`);
        console.error(error);
        process.exit(1); // 실패 시 프로세스 종료
    }
}

function it(testName, fn) {
    try {
        fn();
        console.log(`  ✔ ${testName}`);
    } catch (error) {
        console.error(`  ✖ ${testName}`);
        throw error; // 에러를 다시 던져서 describe 블록에서 잡도록 함
    }
}

// 실제 파서 함수를 가져옵니다. (아직 구현되지 않았으므로, 테스트 실행 시점에는 필요)
// const { parseMarkdown } = require('./script.js');
// Node.js 환경이 아니므로, 테스트 파일 내에 함수를 직접 포함하거나,
// HTML에서 script.js를 로드한 후 브라우저 콘솔에서 실행해야 합니다.
// 여기서는 테스트를 위해 script.js에 있을 parseMarkdown 함수를 가정하고 진행합니다.

// --- 테스트 케이스 ---

describe('Markdown Parser', () => {

    it('should correctly parse H1 headers', () => {
        assert.strictEqual(parseMarkdown('# Hello World'), '<h1>Hello World</h1>', 'H1 Header');
    });

    it('should correctly parse H2 headers', () => {
        assert.strictEqual(parseMarkdown('## Hello World'), '<h2>Hello World</h2>', 'H2 Header');
    });

    it('should correctly parse H6 headers', () => {
        assert.strictEqual(parseMarkdown('###### Hello World'), '<h6>Hello World</h6>', 'H6 Header');
    });

    it('should correctly parse bold text with **', () => {
        assert.strictEqual(parseMarkdown('This is **bold** text.'), '<p>This is <strong>bold</strong> text.</p>', 'Bold text with **');
    });

    it('should correctly parse bold text with __', () => {
        assert.strictEqual(parseMarkdown('This is __bold__ text.'), '<p>This is <strong>bold</strong> text.</p>', 'Bold text with __');
    });

    it('should correctly parse italic text with *', () => {
        assert.strictEqual(parseMarkdown('This is *italic* text.'), '<p>This is <em>italic</em> text.</p>', 'Italic text with *');
    });

    it('should correctly parse italic text with _', () => {
        assert.strictEqual(parseMarkdown('This is _italic_ text.'), '<p>This is <em>italic</em> text.</p>', 'Italic text with _');
    });

    it('should correctly parse strikethrough text', () => {
        assert.strictEqual(parseMarkdown('This is ~~strikethrough~~ text.'), '<p>This is <del>strikethrough</del> text.</p>', 'Strikethrough text');
    });

    it('should correctly parse an unordered list', () => {
        const markdown = `- Item 1\n- Item 2\n- Item 3`;
        const expected = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
        assert.strictEqual(parseMarkdown(markdown), expected, 'Unordered list');
    });

    it('should correctly parse an ordered list', () => {
        const markdown = `1. Item 1\n2. Item 2\n3. Item 3`;
        const expected = '<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>';
        assert.strictEqual(parseMarkdown(markdown), expected, 'Ordered list');
    });

    it('should correctly parse a blockquote', () => {
        assert.strictEqual(parseMarkdown('> This is a quote.'), '<blockquote><p>This is a quote.</p></blockquote>', 'Blockquote');
    });

    it('should correctly parse a code block', () => {
        const markdown = "```\nconst x = 1;\nconsole.log(x);\n```";
        const expected = '<pre><code>const x = 1;\nconsole.log(x);</code></pre>';
        assert.strictEqual(parseMarkdown(markdown), expected, 'Code block');
    });

    it('should handle a mix of elements', () => {
        const markdown = `# Title\n\n- **Bold** item\n- *Italic* item\n\n> A quote.`;
        const expected = '<h1>Title</h1><ul><li><strong>Bold</strong> item</li><li><em>Italic</em> item</li></ul><blockquote><p>A quote.</p></blockquote>';
        assert.strictEqual(parseMarkdown(markdown), expected, 'Mixed elements');
    });
});

// Node.js 환경에서 실행하기 위한 모듈 export (브라우저에서는 불필요)
// if (typeof module !== 'undefined') {
//     module.exports = { describe, it, assert };
// }
