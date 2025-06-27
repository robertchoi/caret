# Caret 릴리즈 빌드 스크립트
# 이 스크립트는 Caret VSCode 확장의 프로덕션 빌드를 생성합니다.

param(
    [switch]$SkipTests,
    [switch]$SkipClean,
    [switch]$Verbose,
    [string]$OutputDir = "output",
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
    
    if (-not (Test-Path "node_modules")) {
        Write-Info "의존성 설치 중..."
        npm install
        Write-Success "루트 의존성 설치 완료"
        
        Write-Info "Webview 의존성 설치 중..."
        Push-Location "webview-ui"
        try {
            npm install
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
        
        $cleanTargets = @("dist", "webview-ui/build")
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
        
        # 전체 테스트 실행
        Write-Info "전체 테스트 실행 중..."
        npm run test:all
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
    
    # TypeScript 컴파일
    Write-Info "TypeScript 컴파일 중..."
    npm run compile
    Write-Success "TypeScript 컴파일 완료"
    
    # Webview 빌드
    Write-Info "Webview 빌드 중..."
    npm run build:webview
    Write-Success "Webview 빌드 완료"
    
    # 8. VSIX 패키지 생성
    Write-Info "📦 VSIX 패키지 생성 중..."
    
    # 출력 디렉토리 생성
    if (-not (Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir | Out-Null
        Write-Success "출력 디렉토리 생성: $OutputDir"
    }
    
    # 타임스탬프 생성 (YYYYMMDDHHMM 형식)
    $timestamp = Get-Date -Format "yyyyMMddHHmm"
    $vsixName = "caret-$currentVersion-$timestamp.vsix"
    $vsixPath = Join-Path $OutputDir $vsixName
    
    # VSIX 생성
    vsce package --out $vsixPath
    Write-Success "VSIX 패키지 생성 완료: $vsixPath"
    
    # 파일 크기 확인
    if (Test-Path $vsixPath) {
        $fileSize = (Get-Item $vsixPath).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Info "패키지 크기: $fileSizeMB MB"
        
        # 크기 경고
        if ($fileSizeMB -gt 300) {
            Write-Warning "패키지 크기가 큽니다 ($fileSizeMB MB). .vscodeignore를 확인하세요."
        }
    }
    
    # 9. 빌드 완료 정보
    Write-Success "🎉 Caret 릴리즈 빌드 완료!"
    Write-Info "=============================="
    Write-Info "빌드 정보:"
    Write-Info "  버전: $currentVersion"
    Write-Info "  파일: $vsixPath"
    Write-Info "  크기: $fileSizeMB MB"
    Write-Info "  시간: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Info ""
    Write-Info "다음 단계:"
    Write-Info "  1. VSIX 파일 테스트: code --install-extension `"$vsixPath`""
    Write-Info "  2. 마켓플레이스 배포: vsce publish"
    Write-Info ""
    
    # 10. 설치 옵션 제공 (대화형)
    if (-not $CI) {
        $install = Read-Host "생성된 VSIX를 로컬에 설치하시겠습니까? (y/N)"
        if ($install -eq "y" -or $install -eq "Y") {
            Write-Info "VSIX 설치 중..."
            code --install-extension $vsixPath
            Write-Success "설치 완료! VSCode를 재시작하세요."
        }
    }
    
} catch {
    Write-Error "❌ 빌드 실패: $($_.Exception.Message)"
    if ($Verbose) {
        Write-Error "스택 트레이스: $($_.ScriptStackTrace)"
    }
    exit 1
}

Write-Success "스크립트 실행 완료."
