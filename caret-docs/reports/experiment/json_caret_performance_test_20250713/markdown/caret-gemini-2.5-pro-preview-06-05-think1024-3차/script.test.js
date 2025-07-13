// 순수 자바스크립트 테스트 스위트

// 테스트 결과를 요약하기 위한 객체
const testSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
};

// 테스트를 정의하는 함수
function test(description, fn) {
    testSummary.total++;
    try {
        fn();
        testSummary.passed++;
        console.log(`✅ PASSED: ${description}`);
    } catch (error) {
        testSummary.failed++;
        testSummary.failures.push({ description, error: error.message });
        console.error(`❌ FAILED: ${description}`);
        console.error(error);
    }
}

// 단언(assertion) 함수
function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
            }
        }
    };
}

// --- 테스트 케이스 ---

// parseMarkdown 함수가 정의되었는지 확인 (실제 구현 전에 임시 함수)
let parseMarkdown = () => '';

// 테스트 실행 전 임시 함수 로드
try {
    // 실제 구현될 script.js의 parseMarkdown 함수를 가져오기 위함
    // 여기서는 임시 함수를 사용하고, 실제 파일이 생성되면 해당 함수를 사용하게 됨.
    // const { parseMarkdown: loadedParseMarkdown } = require('./script.js');
    // parseMarkdown = loadedParseMarkdown;
} catch (e) {
    console.log("script.js not found yet. Using mock parseMarkdown.");
}


test('헤더 h1 변환', () => {
    expect(parseMarkdown('# 제목 1')).toBe('<h1>제목 1</h1>');
});

test('헤더 h2 변환', () => {
    expect(parseMarkdown('## 제목 2')).toBe('<h2>제목 2</h2>');
});

test('굵은 글씨 변환', () => {
    expect(parseMarkdown('**굵은 글씨**')).toBe('<p><strong>굵은 글씨</strong></p>');
});

test('기울임 글씨 변환', () => {
    expect(parseMarkdown('*기울임 글씨*')).toBe('<p><em>기울임 글씨</em></p>');
});

test('순서 없는 목록 변환', () => {
    const markdown = `
- 항목 1
- 항목 2
`;
    const expected = '<ul><li>항목 1</li><li>항목 2</li></ul>';
    expect(parseMarkdown(markdown.trim())).toBe(expected);
});

test('순서 있는 목록 변환', () => {
    const markdown = `
1. 항목 1
2. 항목 2
`;
    const expected = '<ol><li>항목 1</li><li>항목 2</li></ol>';
    expect(parseMarkdown(markdown.trim())).toBe(expected);
});

test('인라인 코드 변환', () => {
    expect(parseMarkdown('`코드`')).toBe('<p><code>코드</code></p>');
});

test('코드 블록 변환', () => {
    const markdown = "```\nconst a = 1;\n```";
    const expected = '<pre><code>const a = 1;</code></pre>';
    expect(parseMarkdown(markdown)).toBe(expected);
});

test('링크 변환', () => {
    expect(parseMarkdown('[링크](http://example.com)')).toBe('<p><a href="http://example.com">링크</a></p>');
});

test('이미지 변환', () => {
    expect(parseMarkdown('![이미지](http://example.com/image.jpg)')).toBe('<p><img src="http://example.com/image.jpg" alt="이미지"></p>');
});


// --- 테스트 결과 출력 ---
function printTestSummary() {
    console.log("\n--- 테스트 요약 ---");
    console.log(`총 테스트: ${testSummary.total}`);
    console.log(`통과: ${testSummary.passed}`);
    console.log(`실패: ${testSummary.failed}`);

    if (testSummary.failed > 0) {
        console.log("\n--- 실패한 테스트 ---");
        testSummary.failures.forEach(({ description, error }) => {
            console.log(`- ${description}: ${error}`);
        });
    }
}

// 이 파일이 직접 실행될 때만 요약 출력
if (typeof window === 'undefined') {
    // Node.js 환경에서 실행될 때
    // 실제 script.js를 로드하기 위한 부분
    try {
        const fs = require('fs');
        const code = fs.readFileSync('./markdown/caret-gemini-2.5-pro-preview-06-05-think1024-3차/script.js', 'utf8');
        // Function 생성자로 전역 공간을 오염시키지 않고 함수 로드
        const loadedFunc = new Function(`${code}; return parseMarkdown;`);
        parseMarkdown = loadedFunc();

        // 실제 테스트 다시 실행
        testSummary.total = 0;
        testSummary.passed = 0;
        testSummary.failed = 0;
        testSummary.failures = [];

        console.log("\n--- 실제 코드로 테스트 실행 ---");
        test('헤더 h1 변환', () => { expect(parseMarkdown('# 제목 1')).toBe('<h1>제목 1</h1>'); });
        test('헤더 h2 변환', () => { expect(parseMarkdown('## 제목 2')).toBe('<h2>제목 2</h2>'); });
        test('굵은 글씨 변환', () => { expect(parseMarkdown('**굵은 글씨**')).toBe('<p><strong>굵은 글씨</strong></p>'); });
        test('기울임 글씨 변환', () => { expect(parseMarkdown('*기울임 글씨*')).toBe('<p><em>기울임 글씨</em></p>'); });
        test('순서 없는 목록 변환', () => { const md = `- 항목 1\n- 항목 2`; expect(parseMarkdown(md)).toBe('<ul><li>항목 1</li><li>항목 2</li></ul>'); });
        test('순서 있는 목록 변환', () => { const md = `1. 항목 1\n2. 항목 2`; expect(parseMarkdown(md)).toBe('<ol><li>항목 1</li><li>항목 2</li></ol>'); });
        test('인라인 코드 변환', () => { expect(parseMarkdown('`코드`')).toBe('<p><code>코드</code></p>'); });
        test('코드 블록 변환', () => { const md = "```\nconst a = 1;\n```"; expect(parseMarkdown(md)).toBe('<pre><code>const a = 1;</code></pre>'); });
        test('링크 변환', () => { expect(parseMarkdown('[링크](http://example.com)')).toBe('<p><a href="http://example.com">링크</a></p>'); });
        test('이미지 변환', () => { expect(parseMarkdown('![이미지](http://example.com/image.jpg)')).toBe('<p><img src="http://example.com/image.jpg" alt="이미지"></p>'); });

    } catch(e) {
        console.log("script.js를 찾을 수 없거나 로드할 수 없습니다. 임시 함수로 테스트 결과가 표시됩니다.");
    }

    printTestSummary();
}
