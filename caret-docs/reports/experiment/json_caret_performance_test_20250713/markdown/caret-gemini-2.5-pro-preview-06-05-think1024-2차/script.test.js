// Simple Test Framework
const tests = [];
let currentSuite = '';

function describe(suiteName, fn) {
    currentSuite = suiteName;
    fn();
}

function it(testName, fn) {
    tests.push({ suite: currentSuite, name: testName, testFn: fn });
}

function assertEquals(a, b) {
    if (a !== b) {
        throw new Error(`Assertion failed: "${a}" does not equal "${b}"`);
    }
}

// Run tests
function runTests() {
    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            test.testFn();
            results.push({ suite: test.suite, name: test.name, status: '✅' });
            passed++;
        } catch (e) {
            results.push({ suite: test.suite, name: test.name, status: '❌', error: e.message });
            failed++;
        }
    }
    return { results, passed, failed };
}


// Test suites for markdown parser
describe('Markdown Parser', () => {
    it('should correctly parse H1 headers', () => {
        assertEquals(parseMarkdown('# Header 1'), '<h1>Header 1</h1>');
    });

    it('should correctly parse H2 headers', () => {
        assertEquals(parseMarkdown('## Header 2'), '<h2>Header 2</h2>');
    });

    it('should correctly parse H6 headers', () => {
        assertEquals(parseMarkdown('###### Header 6'), '<h6>Header 6</h6>');
    });

    it('should correctly parse unordered lists', () => {
        const markdown = '* Item 1\n* Item 2';
        const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        assertEquals(parseMarkdown(markdown), html);
    });

    it('should correctly parse ordered lists', () => {
        const markdown = '1. First item\n2. Second item';
        const html = '<ol><li>First item</li><li>Second item</li></ol>';
        assertEquals(parseMarkdown(markdown), html);
    });

    it('should correctly parse bold text', () => {
        assertEquals(parseMarkdown('**bold text**'), '<p><strong>bold text</strong></p>');
    });

    it('should correctly parse italic text', () => {
        assertEquals(parseMarkdown('*italic text*'), '<p><em>italic text</em></p>');
    });

    it('should handle a mix of bold and italic', () => {
        assertEquals(parseMarkdown('This is **bold** and *italic*.'), '<p>This is <strong>bold</strong> and <em>italic</em>.</p>');
    });
    
    it('should handle multiple paragraphs', () => {
        const markdown = 'First paragraph.\n\nSecond paragraph.';
        const html = '<p>First paragraph.</p><p>Second paragraph.</p>';
        assertEquals(parseMarkdown(markdown), html);
    });

    it('should handle a mix of all elements', () => {
        const markdown = '# Title\n\n* List item 1\n* List item 2\n\nThis is a paragraph with **bold** and *italic*.\n\n1. Numbered item 1\n2. Numbered item 2';
        const html = '<h1>Title</h1><ul><li>List item 1</li><li>List item 2</li></ul><p>This is a paragraph with <strong>bold</strong> and <em>italic</em>.</p><ol><li>Numbered item 1</li><li>Numbered item 2</li></ol>';
        assertEquals(parseMarkdown(markdown), html);
    });
});

// This part is for potential execution in a test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { describe, it, assertEquals, runTests, tests };
}
