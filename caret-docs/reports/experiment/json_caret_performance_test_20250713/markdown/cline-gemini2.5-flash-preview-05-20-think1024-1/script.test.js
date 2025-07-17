const markdownToHtml = require('./script');

describe('markdownToHtml', () => {
    // Helper function to remove extra whitespace for consistent comparison
    const normalizeHtml = (html) => html.replace(/\s+/g, ' ').replace(/>\s*</g, '><').trim();

    test('should convert headers (h1, h2, h3)', () => {
        expect(normalizeHtml(markdownToHtml('# Header 1'))).toBe(normalizeHtml('<h1>Header 1</h1>'));
        expect(normalizeHtml(markdownToHtml('## Header 2'))).toBe(normalizeHtml('<h2>Header 2</h2>'));
        expect(normalizeHtml(markdownToHtml('### Header 3'))).toBe(normalizeHtml('<h3>Header 3</h3>'));
        expect(normalizeHtml(markdownToHtml('#### Header 4'))).toBe(normalizeHtml('<p>#### Header 4</p>')); // Only h1-h3 supported
    });

    test('should convert unordered lists', () => {
        const markdown = `- Item 1\n- Item 2\n* Item 3`;
        const html = `<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>`;
        expect(normalizeHtml(markdownToHtml(markdown))).toBe(normalizeHtml(html));
    });

    test('should convert ordered lists', () => {
        const markdown = `1. Item A\n2. Item B`;
        const html = `<ol><li>Item A</li><li>Item B</li></ol>`;
        expect(normalizeHtml(markdownToHtml(markdown))).toBe(normalizeHtml(html));
    });

    test('should convert emphasis (italic and bold)', () => {
        expect(normalizeHtml(markdownToHtml('*italic*'))).toBe(normalizeHtml('<em>italic</em>'));
        expect(normalizeHtml(markdownToHtml('_italic_'))).toBe(normalizeHtml('<em>italic</em>'));
        expect(normalizeHtml(markdownToHtml('**bold**'))).toBe(normalizeHtml('<strong>bold</strong>'));
        expect(normalizeHtml(markdownToHtml('__bold__'))).toBe(normalizeHtml('<strong>bold</strong>'));
    });

    test('should convert links', () => {
        expect(normalizeHtml(markdownToHtml('[Google](https://www.google.com)'))).toBe(normalizeHtml('<p><a href="https://www.google.com">Google</a></p>'));
    });

    test('should convert inline code', () => {
        expect(normalizeHtml(markdownToHtml('This is `inline code`.'))).toBe(normalizeHtml('<p>This is <code>inline code</code>.</p>'));
    });

    test('should convert code blocks', () => {
        const markdown = '```\nconsole.log("Hello");\n```';
        const html = '<pre><code>console.log("Hello");\n</code></pre>';
        expect(normalizeHtml(markdownToHtml(markdown))).toBe(normalizeHtml(html));
    });

    test('should convert paragraphs', () => {
        expect(normalizeHtml(markdownToHtml('This is a paragraph.'))).toBe(normalizeHtml('<p>This is a paragraph.</p>'));
        expect(normalizeHtml(markdownToHtml('First line.\nSecond line.'))).toBe(normalizeHtml('<p>First line.</p><p>Second line.</p>'));
    });

    test('should handle mixed markdown', () => {
        const markdown = `# My Title\n\nThis is a paragraph with *italic* and **bold** text.\n\n- List item 1\n- List item 2\n\n1. Ordered item A\n2. Ordered item B\n\nCheck out [Example](http://example.com).\n\n\`inline code example\`\n\n\`\`\`\nfunction test() {\n  return true;\n}\n\`\`\``;
        const html = `<h1>My Title</h1><p>This is a paragraph with <em>italic</em> and <strong>bold</strong> text.</p><ul><li>List item 1</li><li>List item 2</li></ul><ol><li>Ordered item A</li><li>Ordered item B</li></ol><p>Check out <a href="http://example.com">Example</a>.</p><p><code>inline code example</code></p><pre><code>function test() {\n  return true;\n}\n</code></pre>`;
        expect(normalizeHtml(markdownToHtml(markdown))).toBe(normalizeHtml(html));
    });

    test('should handle empty input', () => {
        expect(normalizeHtml(markdownToHtml(''))).toBe('');
    });

    test('should handle multiple paragraphs separated by multiple newlines', () => {
        const markdown = `Paragraph 1\n\n\nParagraph 2`;
        const html = `<p>Paragraph 1</p><p>Paragraph 2</p>`;
        expect(normalizeHtml(markdownToHtml(markdown))).toBe(normalizeHtml(html));
    });

    test('should handle markdown with leading/trailing spaces', () => {
        expect(normalizeHtml(markdownToHtml('  # Header 1  '))).toBe(normalizeHtml('<h1>Header 1</h1>'));
        expect(normalizeHtml(markdownToHtml('  *italic*  '))).toBe(normalizeHtml('<em>italic</em>'));
    });
});
