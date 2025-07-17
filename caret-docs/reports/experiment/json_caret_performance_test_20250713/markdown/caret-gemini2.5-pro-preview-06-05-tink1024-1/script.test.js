// Mocking DOM elements for testing in Node.js environment
const assert = require('assert');

// A simple test runner
function describe(description, fn) {
  console.log(description);
  fn();
}

function it(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
  } catch (error) {
    console.error(`  ✗ ${description}`);
    console.error(error);
    process.exit(1);
  }
}

// Function to be tested
const { parseMarkdown } = require('./script.js');

describe('Markdown Parser', () => {
  it('should convert # header to <h1>', () => {
    assert.strictEqual(parseMarkdown('# Header 1').trim(), '<h1>Header 1</h1>');
  });

  it('should convert ## header to <h2>', () => {
    assert.strictEqual(parseMarkdown('## Header 2').trim(), '<h2>Header 2</h2>');
  });

  it('should convert unordered list to <ul><li>', () => {
    const markdown = '- item 1\n- item 2';
    const html = '<ul><li>item 1</li><li>item 2</li></ul>';
    assert.strictEqual(parseMarkdown(markdown).replace(/\s/g, ''), html.replace(/\s/g, ''));
  });

  it('should convert ordered list to <ol><li>', () => {
    const markdown = '1. item 1\n2. item 2';
    const html = '<ol><li>item 1</li><li>item 2</li></ol>';
    assert.strictEqual(parseMarkdown(markdown).replace(/\s/g, ''), html.replace(/\s/g, ''));
  });

  it('should convert **bold** to <strong>', () => {
    assert.strictEqual(parseMarkdown('**bold text**').trim(), '<p><strong>bold text</strong></p>');
  });

  it('should convert *italic* to <em>', () => {
    assert.strictEqual(parseMarkdown('*italic text*').trim(), '<p><em>italic text</em></p>');
  });

  it('should handle a mix of elements', () => {
    const markdown = '# Title\n\n- list item 1\n- **bold** item';
    const expected = '<h1>Title</h1>\n<ul><li>list item 1</li><li><strong>bold</strong> item</li></ul>';
    assert.strictEqual(parseMarkdown(markdown).replace(/\n/g, ''), expected.replace(/\n/g, ''));
  });
});
