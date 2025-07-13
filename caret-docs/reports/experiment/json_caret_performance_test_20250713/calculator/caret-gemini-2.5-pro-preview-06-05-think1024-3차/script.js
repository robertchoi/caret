// TDD의 두 번째 단계: 테스트를 통과하기 위한 실제 코드 구현

/**
 * 두 숫자와 연산자를 받아 계산을 수행하는 함수
 * @param {string} firstOperand - 첫 번째 피연산자
 * @param {string} operator - 연산자 (+, -, *, /)
 * @param {string} secondOperand - 두 번째 피연산자
 * @returns {number|string} - 계산 결과 또는 오류 메시지
 */
function calculate(firstOperand, operator, secondOperand) {
  const first = parseFloat(firstOperand);
  const second = parseFloat(secondOperand);

  if (isNaN(first) || isNaN(second)) {
    return NaN; // 잘못된 입력값 처리
  }

  switch (operator) {
    case '+':
      return first + second;
    case '-':
      return first - second;
    case '*':
      return first * second;
    case '/':
      if (second === 0) {
        return 'Error'; // 0으로 나누기 오류 처리
      }
      return first / second;
    default:
      return NaN; // 지원하지 않는 연산자
  }
}

// UI와 상호작용하는 로직은 DOM이 로드된 후에 실행되도록 합니다.
document.addEventListener('DOMContentLoaded', () => {
  const display = document.querySelector('.calculator-screen');
  const keys = document.querySelector('.calculator-keys');

  let displayValue = '0';
  let firstOperand = null;
  let operator = null;
  let waitingForSecondOperand = false;

  function updateDisplay() {
    display.value = displayValue;
  }

  updateDisplay();

  keys.addEventListener('click', (event) => {
    const { target } = event;
    const { value } = target;

    if (!target.matches('button')) {
      return;
    }

    switch (value) {
      case '+':
      case '-':
      case '*':
      case '/':
        handleOperator(value);
        break;
      case '.':
        inputDecimal(value);
        break;
      case '=':
        handleEqualSign();
        break;
      case 'all-clear':
        resetCalculator();
        break;
      default:
        if (Number.isInteger(parseFloat(value))) {
          inputDigit(value);
        }
    }

    updateDisplay();
  });

  function inputDigit(digit) {
    if (waitingForSecondOperand) {
      displayValue = digit;
      waitingForSecondOperand = false;
    } else {
      displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
  }

  function inputDecimal(dot) {
    if (waitingForSecondOperand) {
        displayValue = '0.';
        waitingForSecondOperand = false;
        return
    }

    if (!displayValue.includes(dot)) {
      displayValue += dot;
    }
  }

  function handleOperator(nextOperator) {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondOperand)  {
      operator = nextOperator;
      return;
    }

    if (firstOperand === null && !isNaN(inputValue)) {
      firstOperand = inputValue;
    } else if (operator) {
      const result = calculate(firstOperand, operator, inputValue);
      displayValue = `${parseFloat(result.toFixed(7))}`;
      firstOperand = result;
    }

    waitingForSecondOperand = true;
    operator = nextOperator;
  }

  function handleEqualSign() {
    if (operator && !waitingForSecondOperand) {
        const inputValue = parseFloat(displayValue);
        const result = calculate(firstOperand, operator, inputValue);

        displayValue = `${parseFloat(result.toFixed(7))}`;
        firstOperand = null; // 연속 계산을 위해 이전 결과를 저장하지 않음 (요구사항에 따라 수정 가능)
        operator = null;
        waitingForSecondOperand = true; // 새로운 계산 시작을 위해
    }
  }

  function resetCalculator() {
    displayValue = '0';
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
  }
});

// 테스트 환경에서 사용하기 위해 함수를 내보냅니다.
// (브라우저 환경에서는 module.exports가 없으므로 조건부로 처리)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculate };
}
