const calculate = require('./script.js');

// 테스트 유틸리티
const assert = {
    strictEqual: (actual, expected, message) => {
        if (actual !== expected) {
            throw new Error(message || `Failed: ${actual} !== ${expected}`);
        }
    }
};

// 테스트 스위트
const describe = (name, fn) => {
    console.log(`\n--- ${name} ---`);
    try {
        fn();
        console.log(`✅ All tests in "${name}" passed!`);
    } catch (error) {
        console.error(`❌ Test failed in "${name}":`, error.message);
    }
};

const it = (name, fn) => {
    try {
        fn();
        console.log(`  ✔ ${name}`);
    } catch (error) {
        console.error(`  ✖ ${name}`);
        throw error; // Re-throw to fail the suite
    }
};


// --- 계산기 로직 테스트 ---
describe('Calculator Logic', () => {

    it('should perform addition correctly', () => {
        assert.strictEqual(calculate(5, '+', 3), 8, '5 + 3 should be 8');
    });

    it('should perform subtraction correctly', () => {
        assert.strictEqual(calculate(10, '-', 4), 6, '10 - 4 should be 6');
    });

    it('should perform multiplication correctly', () => {
        assert.strictEqual(calculate(7, '*', 2), 14, '7 * 2 should be 14');
    });

    it('should perform division correctly', () => {
        assert.strictEqual(calculate(12, '/', 4), 3, '12 / 4 should be 3');
    });

    it('should handle decimal calculations', () => {
        assert.strictEqual(calculate(1.5, '+', 2.5), 4, '1.5 + 2.5 should be 4');
    });

    it('should return "Error" when dividing by zero', () => {
        assert.strictEqual(calculate(5, '/', 0), 'Error', 'Division by zero should return "Error"');
    });
});

// 테스트 실행 (브라우저 콘솔 또는 Node.js 환경에서 확인)
// 이 파일은 UI와 직접 상호작용하지 않고 순수 로직만 테스트합니다.
console.log('Running calculator logic tests...');
// describe 함수가 자체적으로 실행되므로 별도 호출은 필요 없습니다.
