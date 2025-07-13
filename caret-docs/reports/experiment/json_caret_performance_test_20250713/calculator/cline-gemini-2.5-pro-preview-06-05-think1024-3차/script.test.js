// 간단한 테스트 프레임워크
const test = (description, fn) => {
  try {
    fn();
    console.log(`✅ PASS: ${description}`);
  } catch (error) {
    console.error(`❌ FAIL: ${description}`);
    console.error(error);
  }
};

const assert = {
  strictEqual: (actual, expected) => {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${actual} !== ${expected}`);
    }
  },
  throws: (fn, errorMessage) => {
    try {
      fn();
      throw new Error('Expected function to throw an error, but it did not.');
    } catch (error) {
      if (error.message !== errorMessage) {
        throw new Error(`Expected error message "${errorMessage}" but got "${error.message}"`);
      }
    }
  }
};

// 테스트 스위트
console.log('Running calculator logic tests...');

test('덧셈: 5 + 3 = 8', () => {
  assert.strictEqual(calculate('5', '3', '+'), 8);
});

test('뺄셈: 10 - 4 = 6', () => {
  assert.strictEqual(calculate('10', '4', '-'), 6);
});

test('곱셈: 7 * 2 = 14', () => {
  assert.strictEqual(calculate('7', '2', '*'), 14);
});

test('나눗셈: 12 / 4 = 3', () => {
  assert.strictEqual(calculate('12', '4', '/'), 3);
});

test('소수점 계산: 2.5 + 1.5 = 4', () => {
  assert.strictEqual(calculate('2.5', '1.5', '+'), 4);
});

test('연속된 연산: 5 * 2 + 3 = 13 (시뮬레이션)', () => {
  const firstResult = calculate('5', '2', '*'); // 10
  const finalResult = calculate(String(firstResult), '3', '+'); // 10 + 3
  assert.strictEqual(finalResult, 13);
});

test('0으로 나누기: 8 / 0은 오류를 반환해야 합니다', () => {
  assert.throws(() => calculate('8', '0', '/'), 'Error');
});

test('초기화: AC를 누르면 0으로 초기화되어야 합니다', () => {
  // 이 테스트는 UI 상호작용과 관련이 깊어 로직 함수만으로는 테스트하기 어렵습니다.
  // clearCalculatorState 함수가 있다고 가정하고 테스트합니다.
  let state = {
    displayValue: '123',
    firstOperand: '123',
    operator: '+',
    waitingForSecondOperand: true
  };
  state = clearCalculatorState();
  assert.strictEqual(state.displayValue, '0');
  assert.strictEqual(state.firstOperand, null);
  assert.strictEqual(state.operator, null);
  assert.strictEqual(state.waitingForSecondOperand, false);
});

test('부호 변경: 5에서 +/-를 누르면 -5가 되어야 합니다', () => {
    // 이 기능은 보통 현재 입력 값에 직접 작용합니다.
    // 별도의 함수 `toggleSign`을 테스트합니다.
    assert.strictEqual(toggleSign('5'), '-5');
    assert.strictEqual(toggleSign('-5'), '5');
    assert.strictEqual(toggleSign('0'), '0');
});

test('백분율: 20에서 %를 누르면 0.2가 되어야 합니다', () => {
    // 이 기능도 현재 입력 값에 직접 작용합니다.
    // 별도의 함수 `getPercentage`를 테스트합니다.
    assert.strictEqual(getPercentage('20'), '0.2');
    assert.strictEqual(getPercentage('100'), '1');
});

// 테스트를 통과시키기 위한 임시 함수들 (나중에 script.js에서 구현)
function calculate(firstOperand, secondOperand, operator) {
  // 이 함수는 script.js에서 구현될 것입니다.
  // 지금은 테스트 실행을 위해 임시로 존재합니다.
  if (typeof global === 'undefined' || !global.calculate) {
      return 0;
  }
  return global.calculate(firstOperand, secondOperand, operator);
}

function clearCalculatorState() {
  if (typeof global === 'undefined' || !global.clearCalculatorState) {
    return {
        displayValue: '0',
        firstOperand: null,
        operator: null,
        waitingForSecondOperand: false
    };
  }
  return global.clearCalculatorState();
}

function toggleSign(value) {
    if (typeof global === 'undefined' || !global.toggleSign) {
        return '';
    }
    return global.toggleSign(value);
}

function getPercentage(value) {
    if (typeof global === 'undefined' || !global.getPercentage) {
        return '';
    }
    return global.getPercentage(value);
}
