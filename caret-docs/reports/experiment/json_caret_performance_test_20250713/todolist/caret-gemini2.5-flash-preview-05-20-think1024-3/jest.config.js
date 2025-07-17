// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    // script.js 파일이 CommonJS 모듈로 내보내지도록 설정
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
};
