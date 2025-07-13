// script.test.js

// 테스트를 위한 간단한 assert 함수
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// 테스트 스위트
function runTests() {
    console.log("Running tests...");
    try {
        // 헤더 테스트
        assert(parseMarkdown('# Header 1') === '<h1>Header 1</h1>', 'Test Failed: H1');
        assert(parseMarkdown('## Header 2') === '<h2>Header 2</h2>', 'Test Failed: H2');
        assert(parseMarkdown('### Header 3') === '<h3>Header 3</h3>', 'Test Failed: H3');

        // 강조 테스트
        assert(parseMarkdown('**bold text**') === '<p><strong>bold text</strong></p>', 'Test Failed: Bold');
        assert(parseMarkdown('*italic text*') === '<p><em>italic text</em></p>', 'Test Failed: Italic');
        assert(parseMarkdown('__bold text__') === '<p><strong>bold text</strong></p>', 'Test Failed: Bold (underscore)');
        assert(parseMarkdown('_italic text_') === '<p><em>italic text</em></p>', 'Test Failed: Italic (underscore)');

        // 순서 없는 목록 테스트
        const unorderedListInput = `
* Item 1
* Item 2
* Item 3
`;
        const unorderedListOutput = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
        assert(parseMarkdown(unorderedListInput.trim()) === unorderedListOutput, 'Test Failed: Unordered List');

        // 순서 있는 목록 테스트
        const orderedListInput = `
1. First item
2. Second item
3. Third item
`;
        const orderedListOutput = '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>';
        assert(parseMarkdown(orderedListInput.trim()) === orderedListOutput, 'Test Failed: Ordered List');
        
        // 인용구 테스트
        assert(parseMarkdown('> blockquote') === '<blockquote><p>blockquote</p></blockquote>', 'Test Failed: Blockquote');

        // 수평선 테스트
        assert(parseMarkdown('---') === '<hr>', 'Test Failed: Horizontal Rule');
        
        // 복합 테스트
        assert(parseMarkdown('* **bold and italic**') === '<ul><li><strong>bold and italic</strong></li></ul>', 'Test Failed: Complex List');
        assert(parseMarkdown('# Title\n\n* list item') === '<h1>Title</h1><ul><li>list item</li></ul>', 'Test Failed: Title and List');

        console.log("All tests passed! ✨");
        return true;
    } catch (error) {
        console.error(error.message);
        return false;
    }
}

// 실제 구현 코드(parseMarkdown)가 script.js에 있을 것이므로, 여기서는 테스트 실행 함수만 정의합니다.
// 실제 브라우저 환경에서 테스트를 실행하기 위해 이 함수를 호출해야 합니다.
