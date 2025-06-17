#!/usr/bin/env node

/**
 * Caret 개발 빌드 및 테스트 통합 스크립트
 * 
 * 이 스크립트는 다음 작업을 수행합니다:
 * 1. 전체 빌드 (컴파일, webview 빌드)
 * 2. 테스트 실행 (단위 테스트, 통합 테스트)
 * 3. 테스트 실패 시 경고 표시
 * 4. 커버리지 리포트 생성 (선택적)
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

// chalk 5.x는 ESM only이므로 대신 간단한 색상 함수 사용
const colors = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

// 설정
const CONFIG = {
    showCoverage: process.argv.includes('--coverage'),
    verbose: process.argv.includes('--verbose'),
    skipWebview: process.argv.includes('--skip-webview'),
    failFast: process.argv.includes('--fail-fast')
};

// 유틸리티 함수
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    
    switch (type) {
        case 'success':
            console.log(colors.green(`✅ ${prefix} ${message}`));
            break;
        case 'error':
            console.log(colors.red(`❌ ${prefix} ${message}`));
            break;
        case 'warning':
            console.log(colors.yellow(`⚠️  ${prefix} ${message}`));
            break;
        case 'info':
            console.log(colors.blue(`ℹ️  ${prefix} ${message}`));
            break;
        default:
            console.log(`${prefix} ${message}`);
    }
}

function runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        log(`실행 중: ${command}`, 'info');
        
        const child = spawn(command, [], {
            shell: true,
            stdio: CONFIG.verbose ? 'inherit' : 'pipe',
            cwd: options.cwd || process.cwd(),
            ...options
        });

        let stdout = '';
        let stderr = '';

        if (!CONFIG.verbose) {
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject({ stdout, stderr, code, command });
            }
        });

        child.on('error', (error) => {
            reject({ error, command });
        });
    });
}

// 메인 빌드 및 테스트 함수
async function buildAndTest() {
    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    try {
        log('🚀 Caret 개발 빌드 및 테스트 시작', 'info');
        
        // 1. 타입 체크
        log('📝 TypeScript 타입 체크 중...', 'info');
        await runCommand('npm run check-types');
        log('TypeScript 타입 체크 완료', 'success');

        // 2. Lint 검사
        log('🔍 ESLint 검사 중...', 'info');
        await runCommand('npm run lint');
        log('ESLint 검사 완료', 'success');

        // 3. 백엔드 컴파일
        log('🔨 백엔드 컴파일 중...', 'info');
        await runCommand('npm run compile');
        log('백엔드 컴파일 완료', 'success');

        // 4. Webview 빌드 (선택적)
        if (!CONFIG.skipWebview) {
            log('🎨 Webview 빌드 중...', 'info');
            await runCommand('npm run build:webview');
            log('Webview 빌드 완료', 'success');

            // 4-1. Webview 테스트
            log('🧪 Webview 테스트 실행 중...', 'info');
            try {
                const webviewResult = await runCommand('npm run test:webview');
                // webview 테스트 결과 파싱
                const webviewOutput = webviewResult.stdout || '';
                const webviewMatch = webviewOutput.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
                if (webviewMatch) {
                    const webviewPassed = parseInt(webviewMatch[1]);
                    totalTests += webviewPassed;
                    passedTests += webviewPassed;
                    log(`Webview 테스트 완료: ${webviewPassed}개 통과`, 'success');
                }
            } catch (error) {
                const errorOutput = error.stderr || error.stdout || '';
                log(`Webview 테스트 실패: ${errorOutput}`, 'error');
                failedTests++;
                if (CONFIG.failFast) throw error;
            }
        }

        // 5. 단위 테스트
        log('🧪 단위 테스트 실행 중...', 'info');
        try {
            // Windows에서 환경변수 설정 문제 해결 - 절대 경로 사용
            const unitTestCmd = process.platform === 'win32' 
                ? `set TS_NODE_PROJECT=${process.cwd()}\\tsconfig.unit-test.json && npx mocha`
                : 'TS_NODE_PROJECT=./tsconfig.unit-test.json npx mocha';
            const unitResult = await runCommand(unitTestCmd);
            const unitOutput = unitResult.stdout || '';
            // Mocha 결과 파싱
            const unitMatch = unitOutput.match(/(\d+)\s+passing/);
            const unitFailMatch = unitOutput.match(/(\d+)\s+failing/);
            
            if (unitMatch) {
                const unitPassed = parseInt(unitMatch[1]);
                totalTests += unitPassed;
                passedTests += unitPassed;
            }
            if (unitFailMatch) {
                const unitFailed = parseInt(unitFailMatch[1]);
                failedTests += unitFailed;
                totalTests += unitFailed;
            }
            
            log(`단위 테스트 완료`, 'success');
        } catch (error) {
            const errorOutput = error.stderr || error.stdout || '';
            log(`단위 테스트 실패: ${errorOutput}`, 'error');
            failedTests++;
            if (CONFIG.failFast) throw error;
        }

        // 6. 통합 테스트
        log('🔗 통합 테스트 실행 중...', 'info');
        try {
            const integrationCommand = CONFIG.showCoverage ? 
                'npm run test:coverage' : 'npm run test:integration';
            
            const integrationResult = await runCommand(integrationCommand);
            const integrationOutput = integrationResult.stdout || '';
            
            // VSCode 테스트 결과 파싱
            const integrationMatch = integrationOutput.match(/(\d+)\s+passing/);
            const integrationFailMatch = integrationOutput.match(/(\d+)\s+failing/);
            
            if (integrationMatch) {
                const integrationPassed = parseInt(integrationMatch[1]);
                totalTests += integrationPassed;
                passedTests += integrationPassed;
            }
            if (integrationFailMatch) {
                const integrationFailed = parseInt(integrationFailMatch[1]);
                failedTests += integrationFailed;
                totalTests += integrationFailed;
            }

            // 커버리지 정보 추출
            if (CONFIG.showCoverage && integrationOutput.includes('Coverage summary')) {
                const coverageMatch = integrationOutput.match(/Statements\s*:\s*([\d.]+)%/);
                const functionMatch = integrationOutput.match(/Functions\s*:\s*([\d.]+)%/);
                
                if (coverageMatch && functionMatch) {
                    const statementCoverage = parseFloat(coverageMatch[1]);
                    const functionCoverage = parseFloat(functionMatch[1]);
                    
                    log(`📊 커버리지: Statements ${statementCoverage}%, Functions ${functionCoverage}%`, 'info');
                    
                    // 커버리지 경고
                    if (statementCoverage < 70) {
                        log(`Statement 커버리지가 70% 미만입니다 (${statementCoverage}%)`, 'warning');
                    }
                    if (functionCoverage < 50) {
                        log(`Function 커버리지가 50% 미만입니다 (${functionCoverage}%)`, 'warning');
                    }
                }
            }
            
            log(`통합 테스트 완료`, 'success');
        } catch (error) {
            const errorOutput = error.stderr || error.stdout || '';
            log(`통합 테스트 실패: ${errorOutput}`, 'error');
            failedTests++;
        }

        // 7. 결과 요약
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        log('', 'info');
        log('📋 빌드 및 테스트 결과 요약', 'info');
        log(`⏱️  총 소요 시간: ${duration}초`, 'info');
        log(`📊 총 테스트: ${totalTests}개`, 'info');
        log(`✅ 통과: ${passedTests}개`, 'success');
        
        if (failedTests > 0) {
            log(`❌ 실패: ${failedTests}개`, 'error');
            log('', 'info');
            log('🚨 테스트 실패가 있습니다! 다음 사항을 확인하세요:', 'warning');
            log('1. 실패한 테스트의 오류 메시지를 확인하세요', 'warning');
            log('2. 최근 코드 변경사항이 테스트에 영향을 주었는지 확인하세요', 'warning');
            log('3. 필요시 테스트 코드를 업데이트하세요', 'warning');
            log('4. --verbose 옵션으로 상세 로그를 확인하세요', 'warning');
            
            process.exit(1);
        } else {
            log('🎉 모든 빌드 및 테스트가 성공했습니다!', 'success');
            process.exit(0);
        }

    } catch (error) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        log('', 'info');
        log(`❌ 빌드 또는 테스트 실패 (${duration}초 경과)`, 'error');
        log(`실패한 명령어: ${error.command}`, 'error');
        
        if (error.stdout) {
            log('표준 출력:', 'info');
            console.log(error.stdout);
        }
        if (error.stderr) {
            log('표준 에러:', 'error');
            console.log(error.stderr);
        }
        
        process.exit(1);
    }
}

// 도움말 표시
function showHelp() {
    console.log(`
🥕 Caret 개발 빌드 및 테스트 도구

사용법:
  node scripts/dev-build-test.js [옵션]

옵션:
  --coverage       커버리지 리포트 생성
  --verbose        상세 로그 출력
  --skip-webview   Webview 빌드 및 테스트 건너뛰기
  --fail-fast      첫 번째 실패 시 즉시 중단
  --help           이 도움말 표시

예시:
  node scripts/dev-build-test.js
  node scripts/dev-build-test.js --coverage --verbose
  node scripts/dev-build-test.js --skip-webview --fail-fast
`);
}

// 메인 실행
if (process.argv.includes('--help')) {
    showHelp();
} else {
    buildAndTest().catch((error) => {
        console.error('예상치 못한 오류:', error);
        process.exit(1);
    });
} 