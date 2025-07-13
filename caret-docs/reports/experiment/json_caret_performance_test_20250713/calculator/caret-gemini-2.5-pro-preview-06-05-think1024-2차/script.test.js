// calculator.js의 함수들을 가져옵니다.
// 이 테스트 파일은 브라우저 환경이 아닌 Node.js 환경에서 실행될 것을 가정합니다.
// 따라서 실제 프로덕션 코드(script.js)와 테스트 대상(calculator)을 분리해야 합니다.
// 우선 script.js에 calculator 객체를 정의하고, module.exports를 통해 내보내는 구조로 만들겠습니다.

const calculator = require('./script.js');

// 테스트 케이스 정의
function runTests() {
    console.log('계산기 로직 테스트 시작...');

    // 덧셈 테스트
    console.assert(calculator.add(1, 2) === 3, '덧셈 테스트 실패: 1 + 2 !== 3');
    console.assert(calculator.add(-1, -1) === -2, '덧셈 테스트 실패: -1 + -1 !== -2');
    console.assert(calculator.add(1.5, 2.5) === 4, '덧셈 테스트 실패: 1.5 + 2.5 !== 4');

    // 뺄셈 테스트
    console.assert(calculator.subtract(5, 2) === 3, '뺄셈 테스트 실패: 5 - 2 !== 3');
    console.assert(calculator.subtract(2, 5) === -3, '뺄셈 테스트 실패: 2 - 5 !== -3');
    console.assert(calculator.subtract(5.5, 1.5) === 4, '뺄셈 테스트 실패: 5.5 - 1.5 !== 4');

    // 곱셈 테스트
    console.assert(calculator.multiply(3, 4) === 12, '곱셈 테스트 실패: 3 * 4 !== 12');
    console.assert(calculator.multiply(-3, 4) === -12, '곱셈 테스트 실패: -3 * 4 !== -12');
    console.assert(calculator.multiply(1.5, 2) === 3, '곱셈 테스트 실패: 1.5 * 2 !== 3');

    // 나눗셈 테스트
    console.assert(calculator.divide(10, 2) === 5, '나눗셈 테스트 실패: 10 / 2 !== 5');
    console.assert(calculator.divide(5, 2) === 2.5, '나눗셈 테스트 실패: 5 / 2 !== 2.5');

    // 0으로 나누기 테스트
    try {
        calculator.divide(5, 0);
    } catch (e) {
        console.assert(e.message === '0으로 나눌 수 없습니다.', '0으로 나누기 오류 메시지 테스트 실패');
    }

    console.log('계산기 로직 테스트 완료.');
}

// 테스트 실행
runTests();
