const calculator = {
    displayValue: '0',
    firstOperand: null,
    waitingForSecondOperand: false,
    operator: null,

    inputDigit(digit) {
        const { displayValue, waitingForSecondOperand } = this;

        if (waitingForSecondOperand === true) {
            this.displayValue = digit;
            this.waitingForSecondOperand = false;
        } else {
            this.displayValue = displayValue === '0' ? digit : displayValue + digit;
        }
    },

    inputDecimal() {
        if (this.waitingForSecondOperand) return;
        if (!this.displayValue.includes('.')) {
            this.displayValue += '.';
        }
    },

    setOperator(nextOperator) {
        const { firstOperand, displayValue, operator } = this;
        const inputValue = parseFloat(displayValue);

        if (operator && this.waitingForSecondOperand) {
            this.operator = nextOperator;
            return;
        }

        if (firstOperand == null) {
            this.firstOperand = inputValue;
        } else if (operator) {
            const result = this.performCalculation[operator](firstOperand, inputValue);
            this.displayValue = String(result);
            this.firstOperand = result;
        }

        this.waitingForSecondOperand = true;
        this.operator = nextOperator;
    },

    calculate() {
        const { firstOperand, displayValue, operator } = this;
        if (operator && !this.waitingForSecondOperand) {
            const secondOperand = parseFloat(displayValue);
            if (operator === '/' && secondOperand === 0) {
                this.displayValue = 'Error';
                this.firstOperand = null;
                this.waitingForSecondOperand = false;
                this.operator = null;
                return;
            }
            const result = this.performCalculation[operator](firstOperand, secondOperand);
            this.displayValue = String(result);
            this.firstOperand = result; // 연속 계산을 위해 결과를 저장
            this.operator = null; // 계산 후 연산자 초기화
            this.waitingForSecondOperand = true; // 다음 입력을 기다림
        }
    },

    clear() {
        this.displayValue = '0';
        this.firstOperand = null;
        this.waitingForSecondOperand = false;
        this.operator = null;
    },

    getDisplayValue() {
        return this.displayValue;
    },

    performCalculation: {
        '/': (firstOperand, secondOperand) => firstOperand / secondOperand,
        '*': (firstOperand, secondOperand) => firstOperand * secondOperand,
        '+': (firstOperand, secondOperand) => firstOperand + secondOperand,
        '-': (firstOperand, secondOperand) => firstOperand - secondOperand,
    },
};

// UI 로직 (HTML과 연결)
function setupUI() {
    const display = document.querySelector('.calculator-screen');
    const keys = document.querySelector('.calculator-keys');

    if (!keys || !display) return;

    keys.addEventListener('click', (event) => {
        const { target } = event;
        if (!target.matches('button')) {
            return;
        }

        if (target.classList.contains('operator')) {
            calculator.setOperator(target.value);
            updateDisplay();
            return;
        }

        if (target.classList.contains('decimal')) {
            calculator.inputDecimal(target.value);
            updateDisplay();
            return;
        }

        if (target.classList.contains('all-clear')) {
            calculator.clear();
            updateDisplay();
            return;
        }
        
        if (target.classList.contains('equal-sign')) {
            calculator.calculate();
            updateDisplay();
            return;
        }

        calculator.inputDigit(target.value);
        updateDisplay();
    });

    function updateDisplay() {
        display.value = calculator.getDisplayValue();
    }

    updateDisplay();
}

// DOM이 로드된 후 UI 설정
document.addEventListener('DOMContentLoaded', setupUI);
