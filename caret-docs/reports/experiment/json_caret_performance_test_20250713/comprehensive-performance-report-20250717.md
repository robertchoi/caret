# 🧪 AI 에이전트 성능 비교 실험 종합 보고서

> **실험 기간**: 2025. 7. 18.  
> **총 실험 수**: 42회  
> **완료된 과업**: 4/4개  

## 📊 실험 진행 현황

### 과업별 실험 현황
| 과업 | 총 실험 | Caret | Cline | Pro 모델 | Flash 모델 | 완료율 |
|---|---|---|---|---|---|---|
| calculator | 12 | 6 | 6 | 6 | 6 | 100.0% |
| markdown | 6 | 3 | 3 | 6 | 0 | 50.0% |
| todolist | 12 | 6 | 6 | 6 | 6 | 100.0% |
| json-processor | 12 | 6 | 6 | 6 | 6 | 100.0% |

## 🤖 에이전트 성능 비교 (Caret vs Cline)

### 전체 성능 요약
| 지표 | Caret | Cline | 차이 (Caret - Cline) | 효율성 |
|---|---|---|---|---|
| 총 실험 수 | 21회 | 21회 | 0회 | 🟡 동등 |
| 총 API 호출 | 422회 | 393회 | NaN (NaN%) | 🟡 동등 |
| 평균 비용/호출 | $0.013385 (중앙값: 0.016058, σ: 0.010333) | $0.016533 (중앙값: 0.021194, σ: 0.013338) | -0 (-19.0%) | 🟢 Caret 우수 |
| 평균 시간/호출 | 10초 (중앙값: 10, σ: 2) | 11초 (중앙값: 11, σ: 3) | -0.71 (-6.4%) | 🟢 Caret 우수 |
| 평균 입력 토큰/호출 | 42,239 토큰 (중앙값: 31,770, σ: 28,608) | 52,428 토큰 (중앙값: 46,446, σ: 25,542) | -10,189.68 (-19.4%) | 🟢 Caret 우수 |
| 평균 출력 토큰/호출 | 494 토큰 (중앙값: 431, σ: 147) | 483 토큰 (중앙값: 471, σ: 88) | +10.72 (2.2%) | 🔴 Cline 우수 |

### Pro 모델 한정 성능 요약
| 지표 | Caret | Cline | 차이 (Caret - Cline) | 효율성 |
|---|---|---|---|---|
| 총 실험 수 | 12회 | 12회 | 0회 | 🟡 동등 |
| 총 API 호출 | 199회 | 178회 | NaN (NaN%) | 🟡 동등 |
| 평균 비용/호출 | $0.021532 (중앙값: 0.020634, σ: 0.004870) | $0.027429 (중앙값: 0.027351, σ: 0.004591) | -0.01 (-21.5%) | 🟢 Caret 우수 |
| 평균 시간/호출 | 11초 (중앙값: 11, σ: 2) | 13초 (중앙값: 13, σ: 3) | -2.32 (-17.9%) | 🟢 Caret 우수 |
| 평균 입력 토큰/호출 | 28,986 토큰 (중앙값: 26,679, σ: 11,660) | 40,528 토큰 (중앙값: 37,630, σ: 9,835) | -11,541.78 (-28.5%) | 🟢 Caret 우수 |
| 평균 출력 토큰/호출 | 416 토큰 (중앙값: 422, σ: 57) | 471 토큰 (중앙값: 460, σ: 103) | -55.41 (-11.8%) | 🟢 Caret 우수 |

## ⚡ 모델 성능 비교 (Pro vs Flash)

### 전체 성능 요약
| 지표 | Pro 모델 | Flash 모델 | 차이 (Pro - Flash) | 효율성 |
|---|---|---|---|---|
| 총 실험 수 | 24회 | 18회 | 6회 | 🟢 Pro 우수 |
| 총 API 호출 | 377회 | 438회 | NaN (NaN%) | 🟡 동등 |
| 평균 비용/호출 | $0.024480 (중앙값: 0.024913, σ: 0.005522) | $0.002264 (중앙값: 0.001851, σ: 0.001082) | +0.02 (981.2%) | 🔴 Flash 우수 |
| 평균 시간/호출 | 12초 (중앙값: 12, σ: 3) | 9초 (중앙값: 9, σ: 2) | +2.76 (30.4%) | 🔴 Flash 우수 |
| 평균 입력 토큰/호출 | 34,757 토큰 (중앙값: 31,706, σ: 12,085) | 64,102 토큰 (중앙값: 48,230, σ: 32,801) | -29,344.82 (-45.8%) | 🟢 Pro 우수 |
| 평균 출력 토큰/호출 | 444 토큰 (중앙값: 430, σ: 86) | 548 토큰 (중앙값: 521, σ: 134) | -104.69 (-19.1%) | 🟢 Pro 우수 |

## 📋 과업별 상세 성능 분석

### Calculator 과업

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.134013 (중앙값: 0.117761, σ: 0.123765) | $0.195504 (중앙값: 0.168225, σ: 0.184019) | -0.06 (-31.5%) | 🟢 Caret |
| 시간 | 154초 (중앙값: 142, σ: 46) | 149초 (중앙값: 142, σ: 24) | +4.83 (3.3%) | 🔴 Cline |
| API 호출 | 16.3회 (중앙값: 16.5, σ: 3.0) | 17.7회 (중앙값: 18.0, σ: 1.9) | -1.33 (-7.5%) | 🟢 Caret |
| 입력 토큰 | 413,826 토큰 (중앙값: 328,697, σ: 260,611) | 690,007 토큰 (중앙값: 674,151, σ: 211,779) | -276,181 (-40.0%) | 🟢 Caret |
| 출력 토큰 | 7,881 토큰 (중앙값: 7,750, σ: 2,392) | 7,935 토큰 (중앙값: 7,439, σ: 1,532) | -54 (-0.7%) | 🟢 Caret |

### Markdown 과업

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.425832 (중앙값: 0.229200, σ: 0.355819) | $0.440760 (중앙값: 0.539512, σ: 0.198739) | -0.01 (-3.4%) | 🟢 Caret |
| 시간 | 232초 (중앙값: 152, σ: 159) | 223초 (중앙값: 263, σ: 109) | +9.33 (4.2%) | 🔴 Cline |
| API 호출 | 18.0회 (중앙값: 13.0, σ: 11.4) | 14.7회 (중앙값: 16.0, σ: 5.1) | +3.33 (22.7%) | 🔴 Cline |
| 입력 토큰 | 684,085 토큰 (중앙값: 283,512, σ: 724,969) | 631,990 토큰 (중앙값: 673,342, σ: 328,502) | +52,095 (8.2%) | 🔴 Cline |
| 출력 토큰 | 8,186 토큰 (중앙값: 5,614, σ: 4,486) | 7,717 토큰 (중앙값: 8,592, σ: 3,158) | +469 (6.1%) | 🔴 Cline |

### Todolist 과업

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.204646 (중앙값: 0.192724, σ: 0.143911) | $0.168894 (중앙값: 0.120971, σ: 0.192738) | +0.04 (21.2%) | 🔴 Cline |
| 시간 | 217초 (중앙값: 201, σ: 91) | 132초 (중앙값: 104, σ: 61) | +84.83 (64.4%) | 🔴 Cline |
| API 호출 | 22.2회 (중앙값: 21.5, σ: 7.4) | 12.8회 (중앙값: 12.5, σ: 4.5) | +9.33 (72.7%) | 🔴 Cline |
| 입력 토큰 | 1,127,995 토큰 (중앙값: 859,930, σ: 826,989) | 608,615 토큰 (중앙값: 562,017, σ: 341,347) | +519,380 (85.3%) | 🔴 Cline |
| 출력 토큰 | 9,338 토큰 (중앙값: 8,184, σ: 4,786) | 5,844 토큰 (중앙값: 5,627, σ: 1,425) | +3,493.83 (59.8%) | 🔴 Cline |

### Json-processor 과업

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.298819 (중앙값: 0.218925, σ: 0.290202) | $0.316689 (중앙값: 0.263712, σ: 0.247470) | -0.02 (-5.6%) | 🟢 Caret |
| 시간 | 256초 (중앙값: 171, σ: 164) | 316초 (중앙값: 327, σ: 95) | -59.5 (-18.9%) | 🟢 Caret |
| API 호출 | 22.8회 (중앙값: 19.5, σ: 10.8) | 27.7회 (중앙값: 27.0, σ: 12.3) | -4.83 (-17.5%) | 🟢 Caret |
| 입력 토큰 | 1,728,523 토큰 (중앙값: 980,262, σ: 1,997,387) | 2,551,492 토큰 (중앙값: 2,345,792, σ: 1,935,837) | -822,968.67 (-32.3%) | 🟢 Caret |
| 출력 토큰 | 14,605 토큰 (중앙값: 13,021, σ: 9,774) | 14,049 토큰 (중앙값: 13,540, σ: 7,197) | +555.5 (4.0%) | 🔴 Cline |

## 📋 과업별 상세 성능 분석 (Pro 모델 한정)

### Calculator 과업 (Pro 모델)

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.240774 (중앙값: 0.218271, σ: 0.062447) | $0.360986 (중앙값: 0.381496, σ: 0.049996) | -0.12 (-33.3%) | 🟢 Caret |
| 시간 | 137초 (중앙값: 116, σ: 45) | 168초 (중앙값: 164, σ: 20) | -31 (-18.5%) | 🟢 Caret |
| API 호출 | 14.3회 (중앙값: 14.0, σ: 2.5) | 16.3회 (중앙값: 16.0, σ: 1.5) | -2 (-12.2%) | 🟢 Caret |
| 입력 토큰 | 238,277 토큰 (중앙값: 215,900, σ: 82,169) | 510,745 토큰 (중앙값: 494,182, σ: 64,872) | -272,467.67 (-53.3%) | 🟢 Caret |
| 출력 토큰 | 5,965 토큰 (중앙값: 5,626, σ: 1,007) | 6,898 토큰 (중앙값: 6,881, σ: 153) | -932.67 (-13.5%) | 🟢 Caret |

### Markdown 과업 (Pro 모델)

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.425832 (중앙값: 0.229200, σ: 0.355819) | $0.440760 (중앙값: 0.539512, σ: 0.198739) | -0.01 (-3.4%) | 🟢 Caret |
| 시간 | 232초 (중앙값: 152, σ: 159) | 223초 (중앙값: 263, σ: 109) | +9.33 (4.2%) | 🔴 Cline |
| API 호출 | 18.0회 (중앙값: 13.0, σ: 11.4) | 14.7회 (중앙값: 16.0, σ: 5.1) | +3.33 (22.7%) | 🔴 Cline |
| 입력 토큰 | 684,085 토큰 (중앙값: 283,512, σ: 724,969) | 631,990 토큰 (중앙값: 673,342, σ: 328,502) | +52,095 (8.2%) | 🔴 Cline |
| 출력 토큰 | 8,186 토큰 (중앙값: 5,614, σ: 4,486) | 7,717 토큰 (중앙값: 8,592, σ: 3,158) | +469 (6.1%) | 🔴 Cline |

### Todolist 과업 (Pro 모델)

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.330687 (중앙값: 0.341632, σ: 0.050452) | $0.312114 (중앙값: 0.210456, σ: 0.176916) | +0.02 (6.0%) | 🔴 Cline |
| 시간 | 138초 (중앙값: 140, σ: 5) | 148초 (중앙값: 106, σ: 77) | -10 (-6.8%) | 🟢 Caret |
| API 호출 | 15.7회 (중앙값: 15.0, σ: 1.2) | 11.3회 (중앙값: 8.0, σ: 5.8) | +4.33 (38.2%) | 🔴 Cline |
| 입력 토큰 | 436,350 토큰 (중앙값: 454,508, σ: 36,832) | 483,406 토큰 (중앙값: 265,412, σ: 390,771) | -47,056.33 (-9.7%) | 🟢 Caret |
| 출력 토큰 | 5,510 토큰 (중앙값: 5,335, σ: 506) | 4,800 토큰 (중앙값: 4,649, σ: 517) | +710 (14.8%) | 🔴 Cline |

### Json-processor 과업 (Pro 모델)

| 지표 | Caret | Cline | 차이 | 우수 에이전트 |
|---|---|---|---|---|
| 비용 | $0.505405 (중앙값: 0.400752, σ: 0.281078) | $0.532695 (중앙값: 0.552590, σ: 0.113179) | -0.03 (-5.1%) | 🟢 Caret |
| 시간 | 219초 (중앙값: 170, σ: 100) | 236초 (중앙값: 223, σ: 48) | -16.67 (-7.1%) | 🟢 Caret |
| API 호출 | 18.3회 (중앙값: 16.0, σ: 6.8) | 17.0회 (중앙값: 18.0, σ: 3.6) | +1.33 (7.8%) | 🔴 Cline |
| 입력 토큰 | 770,737 토큰 (중앙값: 614,936, σ: 456,044) | 878,860 토큰 (중앙값: 929,905, σ: 253,427) | -108,123.33 (-12.3%) | 🟢 Caret |
| 출력 토큰 | 7,662 토큰 (중앙값: 6,811, σ: 2,547) | 7,579 토큰 (중앙값: 7,708, σ: 291) | +82.33 (1.1%) | 🔴 Cline |

## 🔬 주요 이상치 분석 (그룹 평균 + 1.5 * σ 초과)
- 비용: 특이한 이상치 없음.
- 시간: 특이한 이상치 없음.
- 입력 토큰: 특이한 이상치 없음.

## 📊 이상치 제외 성능 분석

### Caret vs Cline 비교 (Pro 모델, 이상치 제외)
| 지표 | Caret | Cline | 차이 (Caret - Cline) | 효율성 |
|---|---|---|---|---|
| 이상치 제외 실험 수 | 12회 | 12회 | - | 🟡 동등 |
| 총 API 호출 | 199회 | 178회 | NaN (NaN%) | 🟡 동등 |
| 평균 비용/호출 | $0.021532 (중앙값: 0.020634, σ: 0.004870) | $0.027429 (중앙값: 0.027351, σ: 0.004591) | -0.01 (-21.5%) | 🟢 Caret 우수 |
| 평균 시간/호출 | 11초 (중앙값: 11, σ: 2) | 13초 (중앙값: 13, σ: 3) | -2.32 (-17.9%) | 🟢 Caret 우수 |
| 평균 입력 토큰/호출 | 28,986 토큰 (중앙값: 26,679, σ: 11,660) | 40,528 토큰 (중앙값: 37,630, σ: 9,835) | -11,541.78 (-28.5%) | 🟢 Caret 우수 |
| 평균 출력 토큰/호출 | 416 토큰 (중앙값: 422, σ: 57) | 471 토큰 (중앙값: 460, σ: 103) | -55.41 (-11.8%) | 🟢 Caret 우수 |

## 🎯 주요 인사이트

### Caret vs Cline 비교
- 💰 **비용 효율성**: Caret이 API 호출당 평균 $0.003148 더 저렴합니다.
- ⏱️ **실행 속도**: Caret이 API 호출당 평균 0.71초 더 빠릅니다.

### Pro vs Flash 모델 비교
- 💰 **비용 효율성**: Flash 모델이 API 호출당 평균 $0.022216 더 저렴합니다.
- ⏱️ **실행 속도**: Flash 모델이 API 호출당 평균 2.76초 더 빠릅니다.

### 권장사항
- 🎯 **가장 효율적인 조합**: [데이터 분석 결과에 따라 권장]
- 📈 **성능 개선 포인트**: [주요 개선 영역 식별]
- 🔄 **추가 실험 필요 영역**: 모든 과업 완료

---

**보고서 생성 시간**: 2025-07-17T19:20:39.377Z  
**분석된 실험 수**: 42개  
**실험 기간**: 20250717
