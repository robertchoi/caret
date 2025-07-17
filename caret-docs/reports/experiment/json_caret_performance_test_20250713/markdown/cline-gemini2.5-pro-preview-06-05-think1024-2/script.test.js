const { parseMarkdown } = require('./script');

// 테스트 스위트: 마크다운 파서
describe('Markdown Parser', () => {

  // 테스트 케이스: 헤더
  test('should correctly parse headers (h1 to h6)', () => {
    expect(parseMarkdown('# Header 1')).toBe('<h1>Header 1</h1>');
    expect(parseMarkdown('## Header 2')).toBe('<h2>Header 2</h2>');
    expect(parseMarkdown('### Header 3')).toBe('<h3>Header 3</h3>');
    expect(parseMarkdown('#### Header 4')).toBe('<h4>Header 4</h4>');
    expect(parseMarkdown('##### Header 5')).toBe('<h5>Header 5</h5>');
    expect(parseMarkdown('###### Header 6')).toBe('<h6>Header 6</h6>');
  });

  // 테스트 케이스: 강조
  test('should correctly parse emphasis (bold and italic)', () => {
    expect(parseMarkdown('**bold text**')).toBe('<p><strong>bold text</strong></p>');
    expect(parseMarkdown('__bold text__')).toBe('<p><strong>bold text</strong></p>');
    expect(parseMarkdown('*italic text*')).toBe('<p><em>italic text</em></p>');
    expect(parseMarkdown('_italic text_')).toBe('<p><em>italic text</em></p>');
    expect(parseMarkdown('**bold and *italic***')).toBe('<p><strong>bold and <em>italic</em></strong></p>');
  });

  // 테스트 케이스: 순서 없는 목록
  test('should correctly parse unordered lists', () => {
    const markdown = `
* Item 1
* Item 2
* Item 3
`;
    const expected = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
    expect(parseMarkdown(markdown.trim())).toBe(expected);
  });

  // 테스트 케이스: 순서 있는 목록
  test('should correctly parse ordered lists', () => {
    const markdown = `
1. First item
2. Second item
3. Third item
`;
    const expected = '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>';
    expect(parseMarkdown(markdown.trim())).toBe(expected);
  });

  // 테스트 케이스: 링크
  test('should correctly parse links', () => {
    expect(parseMarkdown('[Visit Google](https://www.google.com)'))
      .toBe('<p><a href="https://www.google.com">Visit Google</a></p>');
  });

  // 테스트 케이스: 이미지
  test('should correctly parse images', () => {
    expect(parseMarkdown('![Alt text](/path/to/image.jpg)'))
      .toBe('<p><img src="/path/to/image.jpg" alt="Alt text"></p>');
  });

  // 테스트 케이스: 인용문
  test('should correctly parse blockquotes', () => {
    const markdown = `
> This is a blockquote.
> It can span multiple lines.
`;
    const expected = '<blockquote><p>This is a blockquote.</p><p>It can span multiple lines.</p></blockquote>';
    expect(parseMarkdown(markdown.trim())).toBe(expected);
  });

  // 테스트 케이스: 코드 블록
  test('should correctly parse code blocks', () => {
    const markdown = "```javascript\nconst x = 1;\nconsole.log(x);\n```";
    const expected = '<pre><code>const x = 1;\nconsole.log(x);</code></pre>';
    expect(parseMarkdown(markdown)).toBe(expected);
  });

  // 테스트 케이스: 수평선
  test('should correctly parse horizontal rules', () => {
    expect(parseMarkdown('---')).toBe('<hr>');
    expect(parseMarkdown('***')).toBe('<hr>');
    expect(parseMarkdown('___')).toBe('<hr>');
  });

  // 테스트 케이스: 복합적인 내용
  test('should handle a mix of markdown elements', () => {
    const markdown = `
# Main Title
## Subtitle

This is a paragraph with **bold** and *italic* text.

* List item 1
* List item 2

[This is a link](https://example.com).
`;
    const expected = '<h1>Main Title</h1><h2>Subtitle</h2><p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>List item 1</li><li>List item 2</li></ul><p><a href="https://example.com">This is a link</a>.</p>';
    expect(parseMarkdown(markdown.trim())).toBe(expected);
  });

  // 테스트 케이스: 일반 텍스트
  test('should wrap plain text in a paragraph tag', () => {
    expect(parseMarkdown('This is a simple paragraph.'))
      .toBe('<p>This is a simple paragraph.</p>');
  });
});
