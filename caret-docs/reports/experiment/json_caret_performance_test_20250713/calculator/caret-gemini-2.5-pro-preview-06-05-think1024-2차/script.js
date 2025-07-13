const calculator = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => {
        if (b === 0) {
            throw new Error('0으로 나눌 수 없습니다.');
        }
        return a / b;
    }
};

// Node.js 환경에서 테스트하기 위해 module.exports를 사용합니다.
// 브라우저 환경에서는 module이 정의되어 있지 않으므로, 이를 확인하는 조건문을 추가합니다.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculator;
}

// --- 이하 코드는 브라우저 환경에서 실행될 UI 로직입니다. ---

// DOM 요소들이 로드된 후에 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    // `module`이 브라우저에서는 정의되지 않았으므로, UI 로직은 이 블록 안에서 안전하게 실행됩니다.
    if (typeof module === 'undefined' || !module.exports) {
        const display = document.querySelector('.calculator-screen');
        const keys = document.querySelector('.calculator-keys');

        let firstValue = null;
        let operator = null;
        let waitingForSecondValue = false;

        keys.addEventListener('click', e => {
            const key = e.target;
            const action = key.dataset.action;
            const keyContent = key.textContent;
            const displayedNum = display.value;

            if (!action) {
                if (displayedNum === '0' || waitingForSecondValue) {
                    display.value = keyContent;
                    waitingForSecondValue = false;
                } else {
                    display.value = displayedNum + keyContent;
                }
            }

            if (action === 'decimal') {
                if (!displayedNum.includes('.')) {
                    display.value = displayedNum + '.';
                }
            }

            if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
                if (firstValue === null) {
                    firstValue = parseFloat(displayedNum);
                } else if (operator) {
                    const result = calculate(firstValue, operator, parseFloat(displayedNum));
                    display.value = result;
                    firstValue = result;
                }
                operator = action;
                waitingForSecondValue = true;
            }

            if (action === 'clear') {
                firstValue = null;
                operator = null;
                waitingForSecondValue = false;
                display.value = '0';
            }

            if (action === 'calculate') {
                if (firstValue !== null && operator !== null) {
                    const secondValue = parseFloat(displayedNum);
                    const result = calculate(firstValue, operator, secondValue);
                    if (result === 'Error') {
                        display.value = 'Error';
                    } else {
                        display.value = result;
                    }
                    firstValue = null; // 연속 계산을 위해 null로 초기화하지 않음
                    operator = null;
                    waitingForSecondValue = true; // 결과값에 이어서 연산 가능하도록
                }
            }
        });

        function calculate(n1, op, n2) {
            if (op === 'add') return n1 + n2;
            if (op === 'subtract') return n1 - n2;
            if (op === 'multiply') return n1 * n2;
            if (op === 'divide') {
                if (n2 === 0) return 'Error';
                return n1 / n2;
            }
            return n2;
        }
    }
});
