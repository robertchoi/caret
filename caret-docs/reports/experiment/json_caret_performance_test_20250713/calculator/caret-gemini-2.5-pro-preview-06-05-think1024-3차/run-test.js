const { calculate } = require('./script.js');

// script.test.js의 테스트 코드를 여기에 가져와서 실행합니다.
// Jest와 같은 테스트 프레임워크의 describe, test, expect를 간단히 구현합니다.

let failures = 0;
let passes = 0;

function describe(description, fn) {
  console.log(description);
  fn();
}

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passes++;
  } catch (error) {
    console.error(`  ✗ ${description}`);
    console.error(error);
    failures++;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`테스트 실패: 예상 값 ${expected}, 실제 값 ${actual}`);
      }
    },
    toBeNaN: () => {
      if (!isNaN(actual)) {
        throw new Error(`테스트 실패: ${actual}은 NaN이 아닙니다.`);
      }
    }
  };
}

// --- script.test.js의 테스트 케이스 ---

describe('계산기 핵심 로직 테스트', () => {

  test('덧셈 기능을 정확히 수행해야 합니다.', () => {
    const result = calculate('5', '+', '3');
    expect(result).toBe(8);
  });

  test('뺄셈 기능을 정확히 수행해야 합니다.', () => {
    const result = calculate('10', '-', '4');
    expect(result).toBe(6);
  });

  test('곱셈 기능을 정확히 수행해야 합니다.', () => {
    const result = calculate('7', '*', '6');
    expect(result).toBe(42);
  });

  test('나눗셈 기능을 정확히 수행해야 합니다.', () => {
    const result = calculate('8', '/', '2');
    expect(result).toBe(4);
  });

  test('소수점 계산을 정확히 수행해야 합니다.', () => {
    const result = calculate('2.5', '+', '1.5');
    expect(result).toBe(4);
  });

  test('0으로 나누려고 할 때 "Error"를 반환해야 합니다.', () => {
    const result = calculate('5', '/', '0');
    expect(result).toBe('Error');
  });

  test('잘못된 입력값이 들어왔을 때를 처리해야 합니다.', () => {
    const result = calculate('a', '+', 'b');
    expect(isNaN(result)).toBe(true);
  });
});

console.log(`\n테스트 결과: ${passes} 통과, ${failures} 실패`);

if (failures > 0) {
    process.exit(1); // 실패 시 종료 코드 1
}
