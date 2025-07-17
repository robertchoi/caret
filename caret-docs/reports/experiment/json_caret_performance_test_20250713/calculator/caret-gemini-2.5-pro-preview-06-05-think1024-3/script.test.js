// 간단한 테스트 프레임워크
function describe(description, fn) {
  console.log(description);
  fn();
}

function it(description, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${description}`);
  } catch (error) {
    console.error(`  \x1b[31m✗\x1b[0m ${description}`);
    console.error(error);
    process.exit(1);
  }
}

function assertEquals(expected, actual) {
  if (expected !== actual) {
    throw new Error(`Expected ${expected} but got ${actual}`);
  }
}

// 테스트할 계산기 로직 임포트 (실제 파일 경로는 환경에 맞게 조정 필요)
// const { handleInput, getState } = require('./script.js');

// Node.js 환경에서 script.js의 DOM 의존성을 처리하기 위한 모의(mock) 객체
global.document = {
    getElementById: () => ({
        textContent: ''
    })
};

const calculator = require('./script.js');


describe('계산기 로직 테스트', () => {
  it('덧셈을 정확하게 계산해야 합니다', () => {
    calculator.handleInput('1');
    calculator.handleInput('+');
    calculator.handleInput('2');
    calculator.handleInput('=');
    assertEquals('3', calculator.getState().displayValue);
    calculator.handleInput('C');
  });

  it('뺄셈을 정확하게 계산해야 합니다', () => {
    calculator.handleInput('5');
    calculator.handleInput('-');
    calculator.handleInput('3');
    calculator.handleInput('=');
    assertEquals('2', calculator.getState().displayValue);
    calculator.handleInput('C');
  });

  it('곱셈을 정확하게 계산해야 합니다', () => {
    calculator.handleInput('4');
    calculator.handleInput('*');
    calculator.handleInput('3');
    calculator.handleInput('=');
    assertEquals('12', calculator.getState().displayValue);
    calculator.handleInput('C');
  });

  it('나눗셈을 정확하게 계산해야 합니다', () => {
    calculator.handleInput('10');
    calculator.handleInput('/');
    calculator.handleInput('2');
    calculator.handleInput('=');
    assertEquals('5', calculator.getState().displayValue);
    calculator.handleInput('C');
  });

  it('0으로 나누면 "오류"를 표시해야 합니다', () => {
    calculator.handleInput('5');
    calculator.handleInput('/');
    calculator.handleInput('0');
    calculator.handleInput('=');
    assertEquals('오류', calculator.getState().displayValue);
    calculator.handleInput('C');
  });

  it('연속적인 계산을 처리해야 합니다', () => {
    calculator.handleInput('2');
    calculator.handleInput('+');
    calculator.handleInput('3');
    calculator.handleInput('-');
    calculator.handleInput('1');
    calculator.handleInput('=');
    assertEquals('4', calculator.getState().displayValue);
    calculator.handleInput('C');
  });

  it('소수점 계산을 정확하게 처리해야 합니다', () => {
    calculator.handleInput('1.5');
    calculator.handleInput('+');
    calculator.handleInput('2.5');
    calculator.handleInput('=');
    assertEquals('4', calculator.getState().displayValue);
    calculator.handleInput('C');
  });

  it("'C' 버튼은 모든 상태를 초기화해야 합니다", () => {
    calculator.handleInput('1');
    calculator.handleInput('+');
    calculator.handleInput('2');
    calculator.handleInput('C');
    const state = calculator.getState();
    assertEquals('0', state.displayValue);
    assertEquals(null, state.firstOperand);
    assertEquals(null, state.operator);
    assertEquals(false, state.waitingForSecondOperand);
  });
});
