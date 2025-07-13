function runTests() {
    const testResults = [];

    // 테스트 케이스 함수
    function test(description, testFunction) {
        try {
            testFunction();
            testResults.push({ description, success: true });
        } catch (error) {
            testResults.push({ description, success: false, error: error.message });
        }
    }

    // 단언 함수
    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected "${expected}" but got "${actual}"`);
        }
    }

    // 테스트 스위트: 마크다운 변환 로직
    test("h1 헤더를 변환해야 합니다.", () => {
        assertEqual(parseMarkdown("# Hello"), "<h1>Hello</h1>");
    });

    test("h2 헤더를 변환해야 합니다.", () => {
        assertEqual(parseMarkdown("## World"), "<h2>World</h2>");
    });

    test("h3 헤더를 변환해야 합니다.", () => {
        assertEqual(parseMarkdown("### Test"), "<h3>Test</h3>");
    });

    test("순서 없는 목록을 변환해야 합니다.", () => {
        const markdown = "* Item 1\n* Item 2";
        const expected = "<ul><li>Item 1</li><li>Item 2</li></ul>";
        assertEqual(parseMarkdown(markdown), expected);
    });
    
    test("순서 없는 목록을 변환해야 합니다. (-)", () => {
        const markdown = "- Item 1\n- Item 2";
        const expected = "<ul><li>Item 1</li><li>Item 2</li></ul>";
        assertEqual(parseMarkdown(markdown), expected);
    });

    test("순서 있는 목록을 변환해야 합니다.", () => {
        const markdown = "1. First\n2. Second";
        const expected = "<ol><li>First</li><li>Second</li></ol>";
        assertEqual(parseMarkdown(markdown), expected);
    });

    test("굵은 텍스트를 변환해야 합니다.", () => {
        assertEqual(parseMarkdown("**bold text**"), "<p><strong>bold text</strong></p>");
    });

    test("기울임꼴 텍스트를 변환해야 합니다.", () => {
        assertEqual(parseMarkdown("*italic text*"), "<p><em>italic text</em></p>");
    });

    test("복합적인 마크다운을 변환해야 합니다.", () => {
        const markdown = "## Title\n* List item 1\n* **Bold** list item 2";
        const expected = "<h2>Title</h2><ul><li>List item 1</li><li><strong>Bold</strong> list item 2</li></ul>";
        assertEqual(parseMarkdown(markdown), expected);
    });

    // 테스트 결과 출력
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '';
    testResults.forEach(result => {
        const resultEl = document.createElement('div');
        resultEl.textContent = `${result.description}: ${result.success ? 'PASS' : 'FAIL'}`;
        resultEl.style.color = result.success ? 'green' : 'red';
        if (!result.success) {
            const errorEl = document.createElement('pre');
            errorEl.textContent = result.error;
            errorEl.style.marginLeft = '20px';
            resultEl.appendChild(errorEl);
        }
        resultsDiv.appendChild(resultEl);
    });
}
