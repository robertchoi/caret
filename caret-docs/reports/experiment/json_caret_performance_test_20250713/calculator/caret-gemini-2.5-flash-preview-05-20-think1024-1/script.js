// calculator/caret-gemini-2.5-flash-preview-05-20-think1024-1/script.js

const calculator = (function() {
    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let resetDisplay = false;

    function updateDisplay() {
        const display = document.querySelector('.calculator-display');
        if (display) {
            display.textContent = currentInput;
        }
    }

    function clear() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        resetDisplay = false;
        updateDisplay();
    }

    function appendNumber(number) {
        if (resetDisplay) {
            currentInput = number;
            resetDisplay = false;
        } else {
            if (currentInput === '0' && number !== '.') {
                currentInput = number;
            } else if (number === '.' && currentInput.includes('.')) {
                // 이미 소수점이 있으면 추가하지 않음
                return;
            } else {
                currentInput += number;
            }
        }
        updateDisplay();
    }

    function setOperator(op) {
        if (operator !== null && !resetDisplay) {
            // 연속 연산 처리: 이전 연산 결과를 계산
            calculate();
        }
        previousInput = currentInput;
        operator = op;
        resetDisplay = true;
    }

    function calculate(num1, op, num2) {
        let result;
        const prev = parseFloat(num1 || previousInput);
        const current = parseFloat(num2 || currentInput);

        if (isNaN(prev) || isNaN(current)) {
            return "Error";
        }

        switch (op || operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    currentInput = "Error"; // 0으로 나누는 경우 "Error"로 설정
                    operator = null;
                    resetDisplay = true;
                    updateDisplay();
                    return "Error"; // 테스트를 위해 "Error" 반환
                }
                result = prev / current;
                break;
            default:
                return currentInput; // 연산자가 없으면 현재 입력값 반환
        }

        // 결과가 정수이면 정수로, 아니면 소수점 2자리까지 표시
        if (result % 1 === 0) {
            currentInput = result.toString();
        } else {
            currentInput = parseFloat(result.toFixed(2)).toString();
        }
        
        operator = null;
        resetDisplay = true;
        updateDisplay();
        return currentInput; // 테스트를 위해 반환
    }

    function equals() {
        calculate();
    }

    // UI 이벤트 리스너 설정
    document.addEventListener('DOMContentLoaded', () => {
        updateDisplay(); // 초기 디스플레이 설정

        document.querySelectorAll('.number').forEach(button => {
            button.addEventListener('click', (e) => appendNumber(e.target.textContent));
        });

        document.querySelectorAll('.operator').forEach(button => {
            button.addEventListener('click', (e) => setOperator(e.target.textContent));
        });

        document.querySelector('.clear').addEventListener('click', clear);
        document.querySelector('.equals').addEventListener('click', equals);
    });

    return {
        clear,
        appendNumber,
        setOperator,
        calculate, // 테스트를 위해 calculate 함수 노출
        equals,
        getCurrentInput: () => currentInput // 테스트를 위해 현재 입력값 노출
    };
})();

// 테스트 환경에서 calculator 객체를 전역으로 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculator;
} else {
    window.calculator = calculator;
}
