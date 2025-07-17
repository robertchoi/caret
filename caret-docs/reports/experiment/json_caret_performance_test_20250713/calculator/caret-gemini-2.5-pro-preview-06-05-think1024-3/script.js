const state = {
  displayValue: '0',
  firstOperand: null,
  waitingForSecondOperand: false,
  operator: null,
};

function updateDisplay() {
  const display = document.getElementById('display');
  display.textContent = state.displayValue;
}

function handleNumber(number) {
  if (state.waitingForSecondOperand) {
    state.displayValue = number;
    state.waitingForSecondOperand = false;
  } else {
    state.displayValue = state.displayValue === '0' ? number : state.displayValue + number;
  }
}

function handleOperator(nextOperator) {
  const inputValue = parseFloat(state.displayValue);

  if (state.operator && state.waitingForSecondOperand) {
    state.operator = nextOperator;
    return;
  }

  if (state.firstOperand === null) {
    state.firstOperand = inputValue;
  } else if (state.operator) {
    const result = performCalculation[state.operator](state.firstOperand, inputValue);
    state.displayValue = String(result);
    state.firstOperand = result;
  }

  state.waitingForSecondOperand = true;
  state.operator = nextOperator;
}

const performCalculation = {
  '/': (firstOperand, secondOperand) => {
    if (secondOperand === 0) {
      return '오류';
    }
    return firstOperand / secondOperand;
  },
  '*': (firstOperand, secondOperand) => firstOperand * secondOperand,
  '+': (firstOperand, secondOperand) => firstOperand + secondOperand,
  '-': (firstOperand, secondOperand) => firstOperand - secondOperand,
  '=': (firstOperand, secondOperand) => secondOperand,
};

function handleDecimal() {
    if (state.waitingForSecondOperand) {
        state.displayValue = '0.';
        state.waitingForSecondOperand = false;
        return;
    }
    if (!state.displayValue.includes('.')) {
        state.displayValue += '.';
    }
}


function resetCalculator() {
  state.displayValue = '0';
  state.firstOperand = null;
  state.waitingForSecondOperand = false;
  state.operator = null;
}

function handleInput(input) {
    if (input >= '0' && input <= '9') {
        handleNumber(input);
    } else if (input === '.') {
        handleDecimal();
    } else if (input === 'C') {
        resetCalculator();
    } else if (input in performCalculation) {
        handleOperator(input);
    }
    updateDisplay();
}


// Node.js 환경에서 실행하기 위한 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleInput,
    getState: () => state,
  };
}
