#!/usr/bin/env node

/**
 * 🚧 [검증 필요] Caret Upstream Merge 실행 스크립트
 * 
 * ⚠️ 주의: 이 스크립트는 아직 검증되지 않은 계획 단계입니다.
 * 실제 사용 전 충분한 테스트가 필요합니다.
 * 
 * 핵심 전략:
 * 1. 최신 Cline 소스로 덮어쓰기
 * 2. .caret 백업과 신규 Cline 비교
 * 3. 변경사항이 있는 파일만 선별적 패치
 * 4. 단계별 검증 및 롤백 포인트 제공
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

function execCommand(command, description) {
  try {
    log(`📋 ${description}...`, colors.blue);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} 완료`, colors.green);
    return result;
  } catch (error) {
    log(`❌ ${description} 실패: ${error.message}`, colors.red);
    throw error;
  }
}

// Cline 원본 디렉토리 정의
const CLINE_DIRECTORIES = [
  'src',
  'webview-ui',
  'proto',
  'scripts',
  'evals',
  'docs',
  'locales'
];

const CLINE_ROOT_FILES = [
  'esbuild.js',
  'package.json',
  'tsconfig.json',
  'buf.yaml',
  '.eslintrc.json',
  'LICENSE',
  'README.md'
];

function isCaretExclusive(filePath) {
  const exclusive = ['caret-src', 'caret-docs', 'caret-assets', 'caret-scripts'];
  return exclusive.some(dir => filePath.startsWith(dir));
}

function findFilesWithBackup() {
  const backupFiles = [];
  
  function findInDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        findInDir(fullPath);
      } else if (file.name.endsWith('.caret')) {
        const originalPath = fullPath.replace('.caret', '');
        if (fs.existsSync(originalPath)) {
          backupFiles.push({
            original: originalPath,
            backup: fullPath,
            isClineOriginal: CLINE_DIRECTORIES.some(dir => originalPath.startsWith(dir)) || 
                           CLINE_ROOT_FILES.includes(path.basename(originalPath))
          });
        }
      }
    }
  }
  
  findInDir('.');
  return backupFiles;
}

function compareFiles(file1, file2) {
  try {
    const content1 = fs.readFileSync(file1, 'utf8');
    const content2 = fs.readFileSync(file2, 'utf8');
    return content1 === content2;
  } catch (error) {
    return false;
  }
}

function main() {
  log('🚧 [검증 필요] Caret Upstream Merge 실행 시작', colors.bold + colors.cyan);
  log('⚠️  이 스크립트는 아직 검증되지 않았습니다!', colors.yellow);
  
  // 사용자 확인
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
     rl.question('계속 진행하시겠습니까? (y/N): ', (answer) => {
     if (answer.toLowerCase() !== 'y') {
       log('🛑 사용자에 의해 중단되었습니다.', colors.yellow);
       rl.close();
       return;
     }
     
     rl.close();
     executePhases();
   });
}

function executePhase1_FetchUpstream() {
  log('\n🔄 Phase 1: Upstream 소스 가져오기', colors.magenta);
  
  // upstream 최신 정보 가져오기
  execCommand('git fetch upstream', 'Upstream 최신 정보 가져오기');
  
  // 변경사항 확인
  const changes = execCommand('git diff --name-only HEAD upstream/main', '변경된 파일 목록 확인');
  log(`📊 변경된 파일 수: ${changes.split('\n').filter(f => f.trim()).length}개`, colors.blue);
  
  return changes.split('\n').filter(f => f.trim());
}

function executePhase2_CreateRestorePoint() {
  log('\n💾 Phase 2: 복원 포인트 생성', colors.magenta);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const branchName = `merge-restore-${timestamp}`;
  
  execCommand(`git checkout -b ${branchName}`, '복원 포인트 브랜치 생성');
  execCommand('git checkout main', 'main 브랜치로 복귀');
  
  log(`📍 복원 포인트 생성: ${branchName}`, colors.green);
  return branchName;
}

function executePhase3_OverwriteWithUpstream() {
  log('\n🔄 Phase 3: Upstream 소스로 덮어쓰기', colors.magenta);
  
  // 주의: 이 부분이 가장 위험한 단계입니다
  log('⚠️  이 단계는 Cline 원본 파일들을 덮어씁니다!', colors.yellow);
  
  // Git merge 대신 checkout을 사용하여 강제 덮어쓰기
  for (const dir of CLINE_DIRECTORIES) {
    if (fs.existsSync(dir)) {
      try {
        execCommand(`git checkout upstream/main -- ${dir}`, `${dir} 디렉토리 덮어쓰기`);
      } catch (error) {
        log(`⚠️  ${dir} 덮어쓰기 실패: ${error.message}`, colors.yellow);
      }
    }
  }
  
  // 루트 파일들 덮어쓰기
  for (const file of CLINE_ROOT_FILES) {
    if (fs.existsSync(file)) {
      try {
        execCommand(`git checkout upstream/main -- ${file}`, `${file} 덮어쓰기`);
      } catch (error) {
        log(`⚠️  ${file} 덮어쓰기 실패: ${error.message}`, colors.yellow);
      }
    }
  }
}

function executePhase4_CompareAndPatch() {
  log('\n🔍 Phase 4: 백업 비교 및 선별적 패치', colors.magenta);
  
  const backupFiles = findFilesWithBackup();
  log(`📂 백업 파일 발견: ${backupFiles.length}개`, colors.blue);
  
  const patchNeeded = [];
  const noChangeNeeded = [];
  
  for (const { original, backup, isClineOriginal } of backupFiles) {
    if (!fs.existsSync(original)) {
      log(`⚠️  원본 파일 없음: ${original}`, colors.yellow);
      continue;
    }
    
    const isIdentical = compareFiles(original, backup);
    
    if (isIdentical) {
      noChangeNeeded.push({ original, backup });
      log(`  ✅ 변경사항 없음: ${path.relative('.', original)}`, colors.green);
    } else {
      patchNeeded.push({ original, backup, isClineOriginal });
      log(`  📝 패치 필요: ${path.relative('.', original)}`, colors.yellow);
    }
  }
  
  // Caret 수정사항이 있는 파일들 복원
  log(`\n🔧 패치 적용: ${patchNeeded.length}개 파일`, colors.magenta);
  
  for (const { original, backup, isClineOriginal } of patchNeeded) {
    try {
      fs.copyFileSync(backup, original);
      log(`  ✅ 패치 적용: ${path.relative('.', original)}`, colors.green);
      
      // CARET MODIFICATION 주석 확인 및 추가
      if (isClineOriginal) {
        ensureCaretModificationComment(original);
      }
    } catch (error) {
      log(`  ❌ 패치 실패: ${path.relative('.', original)} - ${error.message}`, colors.red);
    }
  }
  
  return { patchNeeded: patchNeeded.length, noChangeNeeded: noChangeNeeded.length };
}

function ensureCaretModificationComment(filePath) {
  const ext = path.extname(filePath);
  const commentFormats = {
    '.ts': '// CARET MODIFICATION: Caret 전용 수정사항',
    '.js': '// CARET MODIFICATION: Caret 전용 수정사항',
    '.tsx': '// CARET MODIFICATION: Caret 전용 수정사항',
    '.jsx': '// CARET MODIFICATION: Caret 전용 수정사항',
    '.css': '/* CARET MODIFICATION: Caret 전용 수정사항 */',
    '.html': '<!-- CARET MODIFICATION: Caret 전용 수정사항 -->',
    '.md': '<!-- CARET MODIFICATION: Caret 전용 수정사항 -->',
    '.json': null // JSON은 주석 불가
  };
  
  const comment = commentFormats[ext];
  if (!comment) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('CARET MODIFICATION')) {
      const newContent = comment + '\n' + content;
      fs.writeFileSync(filePath, newContent);
      log(`  📝 CARET MODIFICATION 주석 추가: ${path.relative('.', filePath)}`, colors.cyan);
    }
  } catch (error) {
    log(`  ⚠️  주석 추가 실패: ${path.relative('.', filePath)}`, colors.yellow);
  }
}

function executePhase5_BasicVerification() {
  log('\n🧪 Phase 5: 기본 검증', colors.magenta);
  
  try {
    // package.json 구문 검증
    JSON.parse(fs.readFileSync('package.json', 'utf8'));
    log('✅ package.json 구문 검증 통과', colors.green);
    
    // TypeScript 설정 검증
    JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    log('✅ tsconfig.json 구문 검증 통과', colors.green);
    
    // 의존성 설치 시도
    execCommand('npm install', '의존성 설치 검증');
    
    return true;
  } catch (error) {
    log(`❌ 기본 검증 실패: ${error.message}`, colors.red);
    return false;
  }
}

function executePhase6_CommitChanges() {
  log('\n📝 Phase 6: 변경사항 커밋', colors.magenta);
  
  execCommand('git add .', '모든 변경사항 스테이징');
  
  const commitMessage = `merge: integrate upstream Cline changes

- Upstream 소스를 최신 버전으로 업데이트
- Caret 고유 수정사항을 선별적으로 복원
- 자동 머징 프로세스를 통한 안전한 통합

⚠️ 이 커밋은 검증되지 않은 자동 머징 프로세스로 생성되었습니다.`;

  execCommand(`git commit -m "${commitMessage}"`, '머징 결과 커밋');
}

async function executePhase7_PostMergeCleanup() {
  log('\n🧹 Phase 7: 정리 작업', colors.magenta);
  
  // .caret 백업 파일들 정리 (선택사항)
  log('💾 .caret 백업 파일 유지 (안전상 삭제하지 않음)', colors.blue);
  
  // 스냅샷 정보 업데이트
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const postMergeSnapshot = {
    timestamp,
    status: 'merge-completed',
    commit: execCommand('git rev-parse HEAD', '머징 후 커밋 해시').trim(),
    note: '자동 머징 프로세스로 생성된 결과입니다. 충분한 테스트가 필요합니다.'
  };
  
  const snapshotPath = `caret-scripts/merge-snapshots/post-merge-${timestamp}.json`;
  fs.writeFileSync(snapshotPath, JSON.stringify(postMergeSnapshot, null, 2));
  log(`📄 머징 완료 스냅샷: ${snapshotPath}`, colors.green);
}

async function executePhase8_FinalReport() {
  log('\n📊 Phase 8: 최종 보고서', colors.magenta);
  
  log('🎉 자동 머징 프로세스 완료!', colors.bold + colors.green);
  log('\n📋 다음 단계:', colors.blue);
  log('  1. npm run merge:verify - 전체 검증 실행', colors.cyan);
  log('  2. 수동 테스트 - VSCode에서 Extension 동작 확인', colors.cyan);
  log('  3. 빌드 테스트 - 전체 빌드 프로세스 검증', colors.cyan);
  log('\n⚠️  중요 주의사항:', colors.yellow);
  log('  • 이 프로세스는 아직 검증되지 않았습니다', colors.yellow);
  log('  • 충분한 테스트 후 프로덕션에 적용하세요', colors.yellow);
  log('  • 문제 발생 시 git reset으로 복원 가능합니다', colors.yellow);
}

async function executePhaseRollback(restorePoint) {
  log('\n🔄 롤백 실행', colors.red);
  
  try {
    execCommand(`git reset --hard ${restorePoint}`, '복원 포인트로 롤백');
    log('✅ 롤백 완료', colors.green);
  } catch (error) {
    log(`❌ 롤백 실패: ${error.message}`, colors.red);
    log('🆘 수동 복구가 필요합니다', colors.red);
  }
}

async function executePhases() {
  let restorePoint = null;
  
  try {
    // Phase 1: Upstream 가져오기
    const changedFiles = executePhase1_FetchUpstream();
    
    // Phase 2: 복원 포인트 생성
    restorePoint = executePhase2_CreateRestorePoint();
    
    // Phase 3: 덮어쓰기
    executePhase3_OverwriteWithUpstream();
    
    // Phase 4: 비교 및 패치
    const patchResults = executePhase4_CompareAndPatch();
    
    // Phase 5: 기본 검증
    const verificationPassed = executePhase5_BasicVerification();
    
    if (!verificationPassed) {
      log('❌ 기본 검증에 실패했습니다. 롤백을 권장합니다.', colors.red);
      return;
    }
    
    // Phase 6: 커밋
    executePhase6_CommitChanges();
    
    // Phase 7: 정리
    await executePhase7_PostMergeCleanup();
    
    // Phase 8: 최종 보고
    await executePhase8_FinalReport();
    
  } catch (error) {
    log(`\n❌ 머징 과정 중 오류 발생: ${error.message}`, colors.red);
    
    if (restorePoint) {
      log('🔄 롤백을 시도합니다...', colors.yellow);
      await executePhaseRollback(restorePoint);
    } else {
      log('⚠️  복원 포인트가 없습니다. 수동 복구가 필요합니다.', colors.yellow);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, executePhases }; 