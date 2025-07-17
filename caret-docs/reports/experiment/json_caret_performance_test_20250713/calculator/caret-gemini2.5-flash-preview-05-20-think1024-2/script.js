// 기본적인 산술 연산 함수들
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        return 'Error: Cannot divide by zero';
    }
    return a / b;
}

// 연산자에 따라 적절한 함수를 호출하는 operate 함수
function operate(operator, a, b) {
    switch (operator) {
        case '+':
            return add(a, b);
        case '-':
            return subtract(a, b);
        case '*':
            return multiply(a, b);
        case '/':
            return divide(a, b);
        default:
            return 'Error: Unknown operator';
    }
}

// Node.js 환경에서 테스트를 위해 함수들을 내보냅니다.
// 브라우저 환경에서는 이 부분이 필요 없습니다.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        add,
        subtract,
        multiply,
        divide,
        operate
    };
}
