// script.test.js

// 테스트를 위한 간단한 어설션(assertion) 함수
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`[FAIL] ${message}`);
    console.error(`  - Expected: ${expected}`);
    console.error(`  - Actual:   ${actual}`);
    return false;
  }
  console.log(`[PASS] ${message}`);
  return true;
}

// 테스트 스위트(suite)를 위한 함수
function describe(suiteName, fn) {
  console.log(`\n--- Running test suite: ${suiteName} ---`);
  fn();
}

// 개별 테스트 케이스(case)를 위한 함수
function it(testName, fn) {
  try {
    fn();
  } catch (e) {
    console.error(`[ERROR] in test: ${testName}`);
    console.error(e);
  }
}

// --- 테스트 시작 ---

// parseMarkdown 함수가 정의되기 전이므로, 테스트 실행 시점에는 존재해야 합니다.
// 실제 구현 파일(script.js)이 로드된 후 이 테스트가 실행된다고 가정합니다.

describe('parseMarkdown', () => {

  it('should convert headers correctly', () => {
    assertEqual(parseMarkdown('# Header 1'), '<h1>Header 1</h1>', 'H1 Header');
    assertEqual(parseMarkdown('## Header 2'), '<h2>Header 2</h2>', 'H2 Header');
    assertEqual(parseMarkdown('### Header 3'), '<h3>Header 3</h3>', 'H3 Header');
    assertEqual(parseMarkdown('#### Header 4'), '<h4>Header 4</h4>', 'H4 Header');
    assertEqual(parseMarkdown('##### Header 5'), '<h5>Header 5</h5>', 'H5 Header');
    assertEqual(parseMarkdown('###### Header 6'), '<h6>Header 6</h6>', 'H6 Header');
  });

  it('should convert bold text correctly', () => {
    assertEqual(parseMarkdown('**bold text**'), '<p><strong>bold text</strong></p>', 'Bold text with **');
    assertEqual(parseMarkdown('__bold text__'), '<p><strong>bold text</strong></p>', 'Bold text with __');
  });

  it('should convert italic text correctly', () => {
    assertEqual(parseMarkdown('*italic text*'), '<p><em>italic text</em></p>', 'Italic text with *');
    assertEqual(parseMarkdown('_italic text_'), '<p><em>italic text</em></p>', 'Italic text with _');
  });

  it('should convert strikethrough text correctly', () => {
    assertEqual(parseMarkdown('~~strikethrough~~'), '<p><del>strikethrough</del></p>', 'Strikethrough text');
  });

  it('should convert unordered lists correctly', () => {
    const markdown = '- Item 1\n- Item 2\n- Item 3';
    const expected = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
    assertEqual(parseMarkdown(markdown), expected, 'Unordered list with -');
  });

  it('should convert ordered lists correctly', () => {
    const markdown = '1. First item\n2. Second item\n3. Third item';
    const expected = '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>';
    assertEqual(parseMarkdown(markdown), expected, 'Ordered list');
  });

  it('should convert links correctly', () => {
    assertEqual(parseMarkdown('[Caret](https://www.caret.run/)'), '<p><a href="https://www.caret.run/">Caret</a></p>', 'Simple link');
  });

  it('should convert images correctly', () => {
    assertEqual(parseMarkdown('![Alt text](image.jpg)'), '<p><img src="image.jpg" alt="Alt text"></p>', 'Simple image');
  });

  it('should convert blockquotes correctly', () => {
    assertEqual(parseMarkdown('> This is a quote.'), '<blockquote><p>This is a quote.</p></blockquote>', 'Single line blockquote');
  });

  it('should convert inline code correctly', () => {
    assertEqual(parseMarkdown('`const x = 1;`'), '<p><code>const x = 1;</code></p>', 'Inline code');
  });
  
  it('should handle mixed content correctly', () => {
    const markdown = '# Title\n\n- **Bold** item\n- *Italic* item\n\n[Link](https://example.com)';
    const expected = '<h1>Title</h1><ul><li><strong>Bold</strong> item</li><li><em>Italic</em> item</li></ul><p><a href="https://example.com">Link</a></p>';
    assertEqual(parseMarkdown(markdown), expected, 'Mixed content');
  });

});
