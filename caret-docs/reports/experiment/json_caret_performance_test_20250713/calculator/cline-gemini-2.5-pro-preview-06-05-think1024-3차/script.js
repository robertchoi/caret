const calculator = {
  displayValue: '0',
  firstOperand: null,
  waitingForSecondOperand: false,
  operator: null,
};

function updateDisplay() {
  const display = document.querySelector('.calculator-screen');
  display.value = calculator.displayValue;
}

updateDisplay();

const keys = document.querySelector('.calculator-keys');
keys.addEventListener('click', (event) => {
  const { target } = event;
  if (!target.matches('button')) {
    return;
  }

  if (target.classList.contains('operator')) {
    handleOperator(target.value);
    updateDisplay();
    return;
  }

  if (target.classList.contains('decimal')) {
    inputDecimal(target.value);
    updateDisplay();
    return;
  }

  if (target.classList.contains('all-clear')) {
    resetCalculator();
    updateDisplay();
    return;
  }

  if (target.classList.contains('equal-sign')) {
    handleOperator(target.value);
    updateDisplay();
    return;
  }

  if (target.classList.contains('toggle-sign')) {
    toggleSign();
    updateDisplay();
    return;
  }

  if (target.classList.contains('percentage')) {
    getPercentage();
    updateDisplay();
    return;
  }

  inputDigit(target.value);
  updateDisplay();
});

function inputDigit(digit) {
  const { displayValue, waitingForSecondOperand } = calculator;

  if (waitingForSecondOperand === true) {
    calculator.displayValue = digit;
    calculator.waitingForSecondOperand = false;
  } else {
    calculator.displayValue = displayValue === '0' ? digit : displayValue + digit;
  }
}

function inputDecimal(dot) {
  if (calculator.waitingForSecondOperand === true) {
    calculator.displayValue = '0.';
    calculator.waitingForSecondOperand = false;
    return;
  }

  if (!calculator.displayValue.includes(dot)) {
    calculator.displayValue += dot;
  }
}

function handleOperator(nextOperator) {
  const { firstOperand, displayValue, operator } = calculator;
  const inputValue = parseFloat(displayValue);

  if (operator && calculator.waitingForSecondOperand) {
    calculator.operator = nextOperator;
    return;
  }

  if (firstOperand == null && !isNaN(inputValue)) {
    calculator.firstOperand = inputValue;
  } else if (operator) {
    const result = calculate(firstOperand, inputValue, operator);

    calculator.displayValue = `${parseFloat(result.toFixed(7))}`;
    calculator.firstOperand = result;
  }

  calculator.waitingForSecondOperand = true;
  calculator.operator = nextOperator;
}

function calculate(firstOperand, secondOperand, operator) {
  if (operator === '+') {
    return firstOperand + secondOperand;
  } else if (operator === '-') {
    return firstOperand - secondOperand;
  } else if (operator === '*') {
    return firstOperand * secondOperand;
  } else if (operator === '/') {
    if (secondOperand === 0) {
      return 'Error';
    }
    return firstOperand / secondOperand;
  }

  return secondOperand;
}

function resetCalculator() {
  calculator.displayValue = '0';
  calculator.firstOperand = null;
  calculator.waitingForSecondOperand = false;
  calculator.operator = null;
}

function toggleSign() {
    const { displayValue } = calculator;
    calculator.displayValue = (parseFloat(displayValue) * -1).toString();
}

function getPercentage() {
    const { displayValue } = calculator;
    calculator.displayValue = (parseFloat(displayValue) / 100).toString();
}

// For testing purposes
if (typeof module !== 'undefined' && module.exports) {
    global.calculate = (a, b, op) => calculate(parseFloat(a), parseFloat(b), op);
    global.clearCalculatorState = () => {
        resetCalculator();
        return {
            displayValue: calculator.displayValue,
            firstOperand: calculator.firstOperand,
            operator: calculator.operator,
            waitingForSecondOperand: calculator.waitingForSecondOperand
        };
    };
    global.toggleSign = (val) => {
        calculator.displayValue = val;
        toggleSign();
        return calculator.displayValue;
    };
    global.getPercentage = (val) => {
        calculator.displayValue = val;
        getPercentage();
        return calculator.displayValue;
    };
}
