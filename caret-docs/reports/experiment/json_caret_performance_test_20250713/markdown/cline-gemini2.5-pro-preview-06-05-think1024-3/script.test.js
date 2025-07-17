const { parseMarkdown } = require('./script.js');

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
    } catch (error) {
        console.error(`✗ ${name}`);
        console.error(error);
        process.exit(1);
    }
}

function assertEquals(actual, expected) {
    if (actual !== expected) {
        throw new Error(`Assertion failed: ${actual} is not equal to ${expected}`);
    }
}

test('should parse headers correctly', () => {
    assertEquals(parseMarkdown('# Header 1'), '<h1>Header 1</h1>');
    assertEquals(parseMarkdown('## Header 2'), '<h2>Header 2</h2>');
    assertEquals(parseMarkdown('### Header 3'), '<h3>Header 3</h3>');
});

test('should parse unordered lists correctly', () => {
    const markdown = '- Item 1\n- Item 2';
    const expected = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    assertEquals(parseMarkdown(markdown), expected);
});

test('should parse emphasis correctly', () => {
    assertEquals(parseMarkdown('**bold text**'), '<p><strong>bold text</strong></p>');
    assertEquals(parseMarkdown('*italic text*'), '<p><em>italic text</em></p>');
});

test('should handle mixed content correctly', () => {
    const markdown = '# Title\n\n- **Bold** item\n- *Italic* item';
    const expected = '<h1>Title</h1><ul><li><strong>Bold</strong> item</li><li><em>Italic</em> item</li></ul>';
    assertEquals(parseMarkdown(markdown), expected);
});

console.log('All tests passed!');
