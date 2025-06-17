# Caret 릴리즈 빌드 스크립트
# 이 스크립트는 Caret VSCode 확장의 프로덕션 빌드를 생성합니다.

param(
    [switch]$SkipTests,
    [switch]$SkipClean,
    [switch]$Verbose,
    [string]$OutputDir = "release",
    [string]$Version = ""
)

# 색상 출력 함수
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-ColorOutput $Message "Green" }
function Write-Error { param([string]$Message) Write-ColorOutput $Message "Red" }
function Write-Warning { param([string]$Message) Write-ColorOutput $Message "Yellow" }
function Write-Info { param([string]$Message) Write-ColorOutput $Message "Cyan" }

# 에러 발생 시 스크립트 중단
$ErrorActionPreference = "Stop"

try {
    Write-Info "🥕 Caret 릴리즈 빌드 시작"
    Write-Info "=============================="
    
    # 1. 환경 확인
    Write-Info "📋 환경 확인 중..."
    
    # Node.js 확인
    $nodeVersion = node --version 2>$null
    if (-not $nodeVersion) {
        throw "Node.js가 설치되어 있지 않습니다."
    }
    Write-Success "Node.js 버전: $nodeVersion"
    
    # npm 확인
    $npmVersion = npm --version 2>$null
    if (-not $npmVersion) {
        throw "npm이 설치되어 있지 않습니다."
    }
    Write-Success "npm 버전: $npmVersion"
    
    # vsce 확인
    $vsceVersion = vsce --version 2>$null
    if (-not $vsceVersion) {
        Write-Warning "vsce가 설치되어 있지 않습니다. 설치 중..."
        npm install -g vsce
        $vsceVersion = vsce --version
    }
    Write-Success "vsce 버전: $vsceVersion"
    
    # 2. 작업 디렉토리 확인
    if (-not (Test-Path "package.json")) {
        throw "package.json이 없습니다. 프로젝트 루트 디렉토리에서 실행하세요."
    }
    
    if (-not (Test-Path "caret-src")) {
        throw "caret-src 디렉토리가 없습니다."
    }
    
    # 3. 버전 정보 추출
    Write-Info "📦 버전 정보 확인 중..."
    
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $currentVersion = $packageJson.version
    
    if ($Version -ne "") {
        Write-Info "버전을 $currentVersion -> $Version 으로 업데이트합니다."
        $packageJson.version = $Version
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
        $currentVersion = $Version
    }
    
    Write-Success "빌드 버전: $currentVersion"
    
    # 4. 의존성 확인 및 설치
    Write-Info "📚 의존성 확인 중..."
    
    if (-not (Test-Path "node_modules") -or $Force) {
        Write-Info "의존성 설치 중..."
        npm ci
        Write-Success "루트 의존성 설치 완료"
        
        Write-Info "Webview 의존성 설치 중..."
        Push-Location "webview-ui"
        try {
            npm ci
            Write-Success "Webview 의존성 설치 완료"
        }
        finally {
            Pop-Location
        }
    } else {
        Write-Success "의존성이 이미 설치되어 있습니다."
    }
    
    # 5. 정리 (선택적)
    if (-not $SkipClean) {
        Write-Info "🧹 이전 빌드 정리 중..."
        
        $cleanTargets = @("dist", "out", "webview-ui/dist", $OutputDir)
        foreach ($target in $cleanTargets) {
            if (Test-Path $target) {
                Remove-Item $target -Recurse -Force
                Write-Success "정리 완료: $target"
            }
        }
    }
    
    # 6. 테스트 실행 (선택적)
    if (-not $SkipTests) {
        Write-Info "🧪 테스트 실행 중..."
        
        # Caret 커버리지 체크
        Write-Info "Caret 전용 코드 커버리지 체크 중..."
        node caret-scripts/caret-coverage-check.js
        Write-Success "Caret 커버리지 체크 완료"
        
        # 통합 빌드 테스트
        Write-Info "통합 빌드 테스트 실행 중..."
        node caret-scripts/dev-build-test.js --fail-fast
        Write-Success "모든 테스트 통과"
    } else {
        Write-Warning "테스트를 건너뜁니다."
    }
    
    # 7. 프로덕션 빌드
    Write-Info "🔨 프로덕션 빌드 중..."
    
    # Protocol Buffers 생성
    Write-Info "Protocol Buffers 생성 중..."
    npm run protos
    Write-Success "Protocol Buffers 생성 완료"
    
    # TypeScript 타입 체크
    Write-Info "TypeScript 타입 체크 중..."
    npm run check-types
    Write-Success "타입 체크 완료"
    
    # Lint 검사
    Write-Info "ESLint 검사 중..."
    npm run lint
    Write-Success "Lint 검사 완료"
    
    # Webview 빌드
    Write-Info "Webview 빌드 중..."
    npm run build:webview
    Write-Success "Webview 빌드 완료"
    
    # 백엔드 빌드
    Write-Info "백엔드 빌드 중..."
    npm run package
    Write-Success "백엔드 빌드 완료"
    
    # 8. VSIX 패키지 생성
    Write-Info "📦 VSIX 패키지 생성 중..."
    
    # 출력 디렉토리 생성
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir | Out-Null
    }
    
    # package.json에서 Caret 정보 업데이트
    Write-Info "package.json Caret 브랜딩 업데이트 중..."
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    # Caret 브랜딩 정보 업데이트
    $packageJson.displayName = "Caret"
    $packageJson.description = "AI 코딩 파트너 Caret - 한국어 특화 자율 코딩 에이전트"
    $packageJson.publisher = "caret-team"
    $packageJson.repository.url = "https://github.com/aicoding-caret/caret"
    $packageJson.homepage = "https://caret.team"
    
    # 임시로 저장
    $tempPackageJson = "package.json.temp"
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $tempPackageJson
    Copy-Item "package.json" "package.json.backup"
    Copy-Item $tempPackageJson "package.json"
    
    try {
        # VSIX 생성
        $vsixName = "caret-$currentVersion.vsix"
        $vsixPath = Join-Path $OutputDir $vsixName
        
        vsce package --out $vsixPath
        Write-Success "VSIX 패키지 생성 완료: $vsixPath"
        
        # 파일 크기 확인
        $fileSize = (Get-Item $vsixPath).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Info "패키지 크기: $fileSizeMB MB"
        
    }
    finally {
        # package.json 복원
        Copy-Item "package.json.backup" "package.json"
        Remove-Item "package.json.backup", $tempPackageJson -ErrorAction SilentlyContinue
    }
    
    # 9. 빌드 검증
    Write-Info "🔍 빌드 검증 중..."
    
    # 필수 파일 확인
    $requiredFiles = @(
        "dist/extension.js",
        "webview-ui/dist/index.html",
        "webview-ui/dist/assets"
    )
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            throw "필수 파일이 누락되었습니다: $file"
        }
    }
    Write-Success "모든 필수 파일이 존재합니다."
    
    # VSIX 파일 검증
    if (-not (Test-Path $vsixPath)) {
        throw "VSIX 파일이 생성되지 않았습니다."
    }
    
    # 10. 빌드 정보 출력
    Write-Success "🎉 Caret 릴리즈 빌드 완료!"
    Write-Info "=============================="
    Write-Info "빌드 정보:"
    Write-Info "  버전: $currentVersion"
    Write-Info "  VSIX: $vsixPath"
    Write-Info "  크기: $fileSizeMB MB"
    Write-Info "  시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Info ""
    Write-Info "다음 단계:"
    Write-Info "  1. VSIX 파일 테스트: code --install-extension $vsixPath"
    Write-Info "  2. 마켓플레이스 배포: vsce publish"
    Write-Info "  3. GitHub 릴리즈 생성"
    
    # 11. 설치 옵션 제공
    $install = Read-Host "생성된 VSIX를 로컬에 설치하시겠습니까? (y/N)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Info "VSIX 설치 중..."
        code --install-extension $vsixPath
        Write-Success "설치 완료! VSCode를 재시작하세요."
    }
    
}
catch {
    Write-Error "❌ 빌드 실패: $($_.Exception.Message)"
    Write-Error "스택 트레이스: $($_.ScriptStackTrace)"
        exit 1
    }

Write-Success "스크립트 실행 완료."
