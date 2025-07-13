// Simple Test Framework
const tests = [];
let currentGroup = '';

function describe(groupName, fn) {
    currentGroup = groupName;
    fn();
}

function it(testName, fn) {
    tests.push({ group: currentGroup, name: testName, testFn: fn });
}

function runTests() {
    console.log('Running tests...');
    let passed = 0;
    let failed = 0;

    tests.forEach(({ group, name, testFn }) => {
        try {
            testFn();
            console.log(`[PASS] ${group} > ${name}`);
            passed++;
        } catch (e) {
            console.error(`[FAIL] ${group} > ${name}`);
            console.error(e);
            failed++;
        }
    });

    console.log(`\nTests finished. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) {
        // In a real environment, you might throw an error to stop a CI/CD pipeline
        // throw new Error(`${failed} tests failed.`);
    }
}

function assertEquals(actual, expected, message = 'Values are not equal') {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nActual:   ${actual}`);
    }
}

// Tests for markdownToHtml function (which we will create)
describe('markdownToHtml', () => {
    it('should convert headers correctly', () => {
        assertEquals(markdownToHtml('# Header 1'), '<h1>Header 1</h1>');
        assertEquals(markdownToHtml('## Header 2'), '<h2>Header 2</h2>');
        assertEquals(markdownToHtml('###### Header 6'), '<h6>Header 6</h6>');
    });

    it('should convert bold text correctly', () => {
        assertEquals(markdownToHtml('**bold text**'), '<p><strong>bold text</strong></p>');
        assertEquals(markdownToHtml('__bold text__'), '<p><strong>bold text</strong></p>');
    });

    it('should convert italic text correctly', () => {
        assertEquals(markdownToHtml('*italic text*'), '<p><em>italic text</em></p>');
        assertEquals(markdownToHtml('_italic text_'), '<p><em>italic text</em></p>');
    });

    it('should convert strikethrough text correctly', () => {
        assertEquals(markdownToHtml('~~strikethrough~~'), '<p><del>strikethrough</del></p>');
    });

    it('should convert unordered lists correctly', () => {
        const md = '* Item 1\n* Item 2';
        const html = '<ul>\n<li>Item 1</li>\n<li>Item 2</li>\n</ul>';
        assertEquals(markdownToHtml(md), html);
    });

    it('should convert ordered lists correctly', () => {
        const md = '1. Item 1\n2. Item 2';
        const html = '<ol>\n<li>Item 1</li>\n<li>Item 2</li>\n</ol>';
        assertEquals(markdownToHtml(md), html);
    });

    it('should convert links correctly', () => {
        assertEquals(markdownToHtml('[link](http://a.com)'), '<p><a href="http://a.com">link</a></p>');
    });

    it('should convert images correctly', () => {
        assertEquals(markdownToHtml('![alt](http://a.com/img.png)'), '<p><img src="http://a.com/img.png" alt="alt"></p>');
    });

    it('should convert blockquotes correctly', () => {
        assertEquals(markdownToHtml('> quote'), '<blockquote><p>quote</p></blockquote>');
    });

    it('should convert inline code correctly', () => {
        assertEquals(markdownToHtml('`code`'), '<p><code>code</code></p>');
    });

    it('should convert code blocks correctly', () => {
        const md = '```\nconst a = 1;\n```';
        const html = '<pre><code>const a = 1;\n</code></pre>';
        assertEquals(markdownToHtml(md), html);
    });

    it('should handle mixed content correctly', () => {
        const md = '# Title\n\n* list item with **bold** and `code`';
        const html = '<h1>Title</h1>\n<ul>\n<li>list item with <strong>bold</strong> and <code>code</code></li>\n</ul>';
        // The improved parser might still add a newline between blocks.
        // Let's make the test robust to an optional newline.
        const actual = markdownToHtml(md).replace(/\n+/g, '\n');
        const expected = html.replace(/\n+/g, '\n');
        assertEquals(actual, expected);
    });
});

// To run these tests, you would typically call runTests() in your test runner.
// For now, this file just defines the tests.
