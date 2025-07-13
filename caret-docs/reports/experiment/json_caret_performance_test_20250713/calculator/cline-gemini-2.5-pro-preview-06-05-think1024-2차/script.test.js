// script.test.js

// 테스트를 위한 간단한 Assert 함수
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// 테스트 스위트
function runTests() {
    const testResults = [];
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            testResults.push({ name, passed: true });
            passed++;
        } catch (e) {
            testResults.push({ name, passed: false, error: e.message });
            failed++;
        }
    }

    // --- 테스트 케이스 ---

    test("덧셈: 1 + 2 = 3", () => {
        assert(add(1, 2) === 3, "1 + 2 should be 3");
    });

    test("뺄셈: 5 - 3 = 2", () => {
        assert(subtract(5, 3) === 2, "5 - 3 should be 2");
    });

    test("곱셈: 4 * 3 = 12", () => {
        assert(multiply(4, 3) === 12, "4 * 3 should be 12");
    });

    test("나눗셈: 10 / 2 = 5", () => {
        assert(divide(10, 2) === 5, "10 / 2 should be 5");
    });

    test("0으로 나누기: 오류를 반환해야 함", () => {
        assert(divide(5, 0) === 'Error', "Division by zero should return 'Error'");
    });

    test("소수점 덧셈: 0.1 + 0.2 = 0.3", () => {
        // 부동소수점 오차를 고려하여 근사치 비교
        assert(Math.abs(add(0.1, 0.2) - 0.3) < 1e-9, "0.1 + 0.2 should be close to 0.3");
    });

    test("음수 뺄셈: 3 - 5 = -2", () => {
        assert(subtract(3, 5) === -2, "3 - 5 should be -2");
    });

    // --- 테스트 결과 출력 ---
    console.log("--- Calculator Logic Test Results ---");
    testResults.forEach(result => {
        if (result.passed) {
            console.log(`✅ PASSED: ${result.name}`);
        } else {
            console.error(`❌ FAILED: ${result.name}`);
            console.error(`   Error: ${result.error}`);
        }
    });
    console.log("-----------------------------------");
    console.log(`Summary: ${passed} passed, ${failed} failed.`);

    if (failed > 0) {
        console.error("Some tests failed!");
    } else {
        console.log("All tests passed! 🎉");
    }
}

// 실제 로직 파일이 로드된 후 테스트 실행
// 이 파일은 브라우저 환경에서 test-runner.html을 통해 실행될 것입니다.
