// Mockup for the main script's parseMarkdown function
// In a real testing environment (like Jest), you would import it.
// For this environment, we'll assume parseMarkdown is globally available
// or we will define a dummy version if needed.

function runTests() {
    const testResults = [];
    let successCount = 0;
    let failCount = 0;

    function test(description, testFunction) {
        try {
            testFunction();
            testResults.push({ description, status: '✅ PASSED' });
            successCount++;
        } catch (error) {
            testResults.push({ description, status: `❌ FAILED: ${error.message}` });
            failCount++;
        }
    }

    function assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: "${expected}", but got: "${actual}"`);
        }
    }

    // --- Test Cases ---

    test('should convert headers correctly', () => {
        assertEquals(parseMarkdown('# Header 1'), '<h1>Header 1</h1>', 'H1');
        assertEquals(parseMarkdown('## Header 2'), '<h2>Header 2</h2>', 'H2');
        assertEquals(parseMarkdown('### Header 3'), '<h3>Header 3</h3>', 'H3');
        assertEquals(parseMarkdown('#### Header 4'), '<h4>Header 4</h4>', 'H4');
        assertEquals(parseMarkdown('##### Header 5'), '<h5>Header 5</h5>', 'H5');
        assertEquals(parseMarkdown('###### Header 6'), '<h6>Header 6</h6>', 'H6');
    });

    test('should convert emphasis correctly', () => {
        assertEquals(parseMarkdown('**bold text**'), '<p><strong>bold text</strong></p>', 'Bold');
        assertEquals(parseMarkdown('__bold text__'), '<p><strong>bold text</strong></p>', 'Bold with underscore');
        assertEquals(parseMarkdown('*italic text*'), '<p><em>italic text</em></p>', 'Italic');
        assertEquals(parseMarkdown('_italic text_'), '<p><em>italic text</em></p>', 'Italic with underscore');
        assertEquals(parseMarkdown('~~strikethrough~~'), '<p><s>strikethrough</s></p>', 'Strikethrough');
    });

    test('should convert unordered lists correctly', () => {
        const markdown = '- Item 1\n- Item 2\n- Item 3';
        const expected = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
        assertEquals(parseMarkdown(markdown), expected, 'Unordered list with -');
    });
    
    test('should convert ordered lists correctly', () => {
        const markdown = '1. First item\n2. Second item\n3. Third item';
        const expected = '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>';
        assertEquals(parseMarkdown(markdown), expected, 'Ordered list');
    });

    test('should convert links correctly', () => {
        assertEquals(parseMarkdown('[Caret](https://www.careteditor.com)'), '<p><a href="https://www.careteditor.com">Caret</a></p>', 'Link');
    });

    test('should convert images correctly', () => {
        assertEquals(parseMarkdown('![Alt text](image.jpg)'), '<p><img src="image.jpg" alt="Alt text"></p>', 'Image');
    });

    test('should convert blockquotes correctly', () => {
        assertEquals(parseMarkdown('> This is a quote.'), '<blockquote><p>This is a quote.</p></blockquote>', 'Blockquote');
    });

    test('should convert inline code correctly', () => {
        assertEquals(parseMarkdown('`const x = 1;`'), '<p><code>const x = 1;</code></p>', 'Inline code');
    });

    test('should convert code blocks correctly', () => {
        const markdown = '```\nconst y = 2;\n```';
        const expected = '<pre><code>const y = 2;\n</code></pre>';
        assertEquals(parseMarkdown(markdown), expected, 'Code block');
    });

    test('should handle mixed emphasis correctly', () => {
        assertEquals(parseMarkdown('**bold and *italic***'), '<p><strong>bold and <em>italic</em></strong></p>', 'Mixed emphasis');
    });

    // --- Log Results ---
    console.log('--- Test Execution Summary ---');
    testResults.forEach(result => {
        console.log(`${result.status}: ${result.description}`);
    });
    console.log('------------------------------');
    console.log(`Total Tests: ${testResults.length}, Passed: ${successCount}, Failed: ${failCount}`);
    console.log('------------------------------');

    if (failCount > 0) {
        console.error('Some tests failed!');
    } else {
        console.log('All tests passed successfully! ✨');
    }
}

// To run tests in a standalone way without a browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runTests };
}
