#!/usr/bin/env node

/**
 * 🚧 [검증 필요] Caret Upstream Merge 검증 스크립트
 * 
 * ⚠️ 주의: 이 스크립트는 아직 검증되지 않은 계획 단계입니다.
 * 실제 사용 전 충분한 테스트가 필요합니다.
 * 
 * 기능:
 * 1. 빌드 시스템 검증 (TypeScript 컴파일, 웹뷰 빌드)
 * 2. 테스트 실행 (단위 테스트, 통합 테스트)
 * 3. 패키지 구조 검증
 * 4. VSCode Extension 동작 확인
 * 5. Caret 고유 기능 검증
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 출력을 위한 유틸리티
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description, options = {}) {
  try {
    log(`📋 ${description}...`, colors.blue);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    log(`✅ ${description} 완료`, colors.green);
    return result;
  } catch (error) {
    log(`❌ ${description} 실패: ${error.message}`, colors.red);
    if (options.required !== false) {
      throw error;
    }
    return null;
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}: ${filePath}`, colors.green);
    return true;
  } else {
    log(`❌ ${description} 누락: ${filePath}`, colors.red);
    return false;
  }
}

function verifyPhase1_ProjectStructure() {
  log('\n🏗️  Phase 1: 프로젝트 구조 검증', colors.magenta);
  
  const requiredFiles = [
    { path: 'package.json', desc: 'Package 설정' },
    { path: 'tsconfig.json', desc: 'TypeScript 설정' },
    { path: 'esbuild.js', desc: 'Build 설정' },
    { path: 'src/extension.ts', desc: 'Extension 진입점' },
    { path: 'webview-ui/package.json', desc: 'WebView Package' },
    { path: 'caret-src/extension.ts', desc: 'Caret Extension' }
  ];
  
  let allExists = true;
  for (const { path: filePath, desc } of requiredFiles) {
    if (!checkFileExists(filePath, desc)) {
      allExists = false;
    }
  }
  
  // JSON 파일 구문 검증
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    log(`✅ package.json 구문 검증: ${packageJson.name} v${packageJson.version}`, colors.green);
    
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    log(`✅ tsconfig.json 구문 검증 통과`, colors.green);
  } catch (error) {
    log(`❌ JSON 구문 오류: ${error.message}`, colors.red);
    allExists = false;
  }
  
  return allExists;
}

function verifyPhase2_Dependencies() {
  log('\n📦 Phase 2: 의존성 검증', colors.magenta);
  
  try {
    // 루트 의존성 설치
    execCommand('npm install', 'Root 의존성 설치');
    
    // WebView 의존성 설치
    execCommand('cd webview-ui && npm install', 'WebView 의존성 설치', { shell: true });
    
    // 의존성 보안 검사
    execCommand('npm audit --audit-level moderate', '보안 취약점 검사', { required: false });
    
    return true;
  } catch (error) {
    log(`❌ 의존성 설치 실패: ${error.message}`, colors.red);
    return false;
  }
}

function verifyPhase3_TypeScriptBuild() {
  log('\n🔧 Phase 3: TypeScript 빌드 검증', colors.magenta);
  
  try {
    // TypeScript 컴파일
    execCommand('npm run compile', 'TypeScript 컴파일');
    
    // 컴파일 결과 확인
    const distExists = checkFileExists('dist/extension.js', 'Extension 빌드 결과');
    
    return distExists;
  } catch (error) {
    log(`❌ TypeScript 빌드 실패: ${error.message}`, colors.red);
    return false;
  }
}

function verifyPhase4_WebViewBuild() {
  log('\n🌐 Phase 4: WebView 빌드 검증', colors.magenta);
  
  try {
    // WebView 빌드
    execCommand('npm run build:webview', 'WebView 빌드');
    
    // 빌드 결과 확인
    const webviewDistExists = checkFileExists('webview-ui/dist/index.js', 'WebView 빌드 결과');
    
    return webviewDistExists;
  } catch (error) {
    log(`❌ WebView 빌드 실패: ${error.message}`, colors.red);
    return false;
  }
}

function verifyPhase5_Testing() {
  log('\n🧪 Phase 5: 테스트 실행', colors.magenta);
  
  let testsPassed = true;
  
  try {
    // 단위 테스트 실행
    execCommand('npm run test', '단위 테스트', { required: false });
  } catch (error) {
    log('⚠️  일부 테스트 실패 (계속 진행)', colors.yellow);
    testsPassed = false;
  }
  
  try {
    // 린팅 검사
    execCommand('npm run lint', 'ESLint 검사', { required: false });
  } catch (error) {
    log('⚠️  린팅 오류 발견 (계속 진행)', colors.yellow);
    testsPassed = false;
  }
  
  return testsPassed;
}

function verifyPhase6_CaretSpecific() {
  log('\n🎯 Phase 6: Caret 고유 기능 검증', colors.magenta);
  
  const caretFiles = [
    { path: 'caret-src/extension.ts', desc: 'Caret Extension' },
    { path: 'caret-src/core/webview/CaretProvider.ts', desc: 'Caret Provider' },
    { path: 'caret-docs/caretrules.ko.md', desc: 'Caret 룰 문서' },
    { path: 'caret-assets/icons/icon.png', desc: 'Caret 아이콘' }
  ];
  
  let allCaretFilesExist = true;
  for (const { path: filePath, desc } of caretFiles) {
    if (!checkFileExists(filePath, desc)) {
      allCaretFilesExist = false;
    }
  }
  
  // CARET MODIFICATION 주석 확인
  const modifiedFiles = ['src/extension.ts', 'package.json'];
  for (const file of modifiedFiles) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('CARET MODIFICATION')) {
        log(`✅ CARET MODIFICATION 주석 확인: ${file}`, colors.green);
      } else {
        log(`⚠️  CARET MODIFICATION 주석 누락: ${file}`, colors.yellow);
      }
    }
  }
  
  return allCaretFilesExist;
}

function verifyPhase7_BackupIntegrity() {
  log('\n💾 Phase 7: 백업 파일 무결성 검증', colors.magenta);
  
  const backupFiles = [];
  
  function findBackupFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        findBackupFiles(fullPath);
      } else if (file.name.endsWith('.cline') || file.name.endsWith('.caret')) {
        backupFiles.push(fullPath);
      }
    }
  }
  
  findBackupFiles('.');
  
  log(`📂 백업 파일 발견: ${backupFiles.length}개`, colors.blue);
  
  let backupIntegrity = true;
  for (const backupFile of backupFiles) {
    const originalFile = backupFile.replace(/\.(cline|caret)$/, '');
    if (fs.existsSync(originalFile)) {
      log(`  ✅ 백업-원본 매칭: ${path.relative('.', backupFile)}`, colors.green);
    } else {
      log(`  ⚠️  원본 파일 없음: ${path.relative('.', originalFile)}`, colors.yellow);
      backupIntegrity = false;
    }
  }
  
  return backupIntegrity;
}

function verifyPhase8_FinalReport() {
  log('\n📊 Phase 8: 최종 검증 보고서', colors.magenta);
  
  // Git 상태 확인
  try {
    const gitStatus = execCommand('git status --porcelain', 'Git 상태 확인', { silent: true });
    if (gitStatus && gitStatus.trim()) {
      log('📋 미커밋 변경사항 있음:', colors.blue);
      console.log(gitStatus);
    } else {
      log('✅ Git 작업 디렉토리 깨끗함', colors.green);
    }
  } catch (error) {
    log('⚠️  Git 상태 확인 실패', colors.yellow);
  }
  
  // 현재 커밋 정보
  try {
    const currentCommit = execCommand('git rev-parse HEAD', '현재 커밋 확인', { silent: true });
    const commitMessage = execCommand('git log -1 --pretty=%B', '커밋 메시지 확인', { silent: true });
    log(`📍 현재 커밋: ${currentCommit.trim().substring(0, 8)}`, colors.blue);
    log(`📝 커밋 메시지: ${commitMessage.trim().split('\n')[0]}`, colors.blue);
  } catch (error) {
    log('⚠️  커밋 정보 확인 실패', colors.yellow);
  }
}

function generateVerificationReport(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `caret-scripts/merge-snapshots/verification-${timestamp}.json`;
  
  // 스냅샷 디렉토리 생성
  const snapshotsDir = 'caret-scripts/merge-snapshots';
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }
  
  const report = {
    timestamp,
    results,
    overall: results.every(r => r.passed),
    commit: execCommand('git rev-parse HEAD', '커밋 해시', { silent: true }).trim(),
    note: '자동 머징 후 검증 결과'
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📄 검증 보고서 저장: ${reportPath}`, colors.green);
  
  return report;
}

async function main() {
  log('🚧 [검증 필요] Caret Upstream Merge 검증 시작', colors.bold + colors.cyan);
  log('⚠️  이 검증은 아직 완전하지 않을 수 있습니다!', colors.yellow);
  
  const results = [];
  
  try {
    // Phase 1: 프로젝트 구조
    const structureOk = verifyPhase1_ProjectStructure();
    results.push({ phase: 'Project Structure', passed: structureOk });
    
    // Phase 2: 의존성
    const depsOk = verifyPhase2_Dependencies();
    results.push({ phase: 'Dependencies', passed: depsOk });
    
    // Phase 3: TypeScript 빌드
    const tsOk = verifyPhase3_TypeScriptBuild();
    results.push({ phase: 'TypeScript Build', passed: tsOk });
    
    // Phase 4: WebView 빌드
    const webviewOk = verifyPhase4_WebViewBuild();
    results.push({ phase: 'WebView Build', passed: webviewOk });
    
    // Phase 5: 테스트
    const testsOk = verifyPhase5_Testing();
    results.push({ phase: 'Testing', passed: testsOk });
    
    // Phase 6: Caret 고유 기능
    const caretOk = verifyPhase6_CaretSpecific();
    results.push({ phase: 'Caret Features', passed: caretOk });
    
    // Phase 7: 백업 무결성
    const backupOk = verifyPhase7_BackupIntegrity();
    results.push({ phase: 'Backup Integrity', passed: backupOk });
    
    // Phase 8: 최종 보고
    verifyPhase8_FinalReport();
    
    // 검증 보고서 생성
    const report = generateVerificationReport(results);
    
    // 결과 요약
    log('\n🎉 검증 완료!', colors.bold + colors.green);
    log('\n📋 검증 결과 요약:', colors.blue);
    
    results.forEach(({ phase, passed }) => {
      const status = passed ? '✅' : '❌';
      const color = passed ? colors.green : colors.red;
      log(`  ${status} ${phase}`, color);
    });
    
    const overallResult = results.every(r => r.passed);
    if (overallResult) {
      log('\n🎯 전체 검증 성공! 머징이 성공적으로 완료되었습니다.', colors.bold + colors.green);
    } else {
      log('\n⚠️  일부 검증 실패. 추가 확인이 필요합니다.', colors.bold + colors.yellow);
    }
    
    log('\n📋 다음 단계:', colors.blue);
    log('  1. VSCode에서 Extension 수동 테스트', colors.cyan);
    log('  2. 주요 기능들 동작 확인', colors.cyan);
    log('  3. 문제 없으면 git push로 배포', colors.cyan);
    
  } catch (error) {
    log(`\n❌ 검증 과정 중 오류 발생: ${error.message}`, colors.red);
    log('🔍 상세한 오류 내용을 확인하고 수동으로 해결하세요.', colors.yellow);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 