# Beyond AI 게이미피케이션 시각 디자인

## 1. 배지 시스템

### 배지 디자인 원칙
- **형태**: 정사각형 (브루탈리즘 일관성), 3px 두꺼운 보더
- **크기**: 64x64px (기본), 48x48px (소형), 96x96px (상세)
- **컬러**: 등급별 테두리 색상 + 아이콘 조합
- **스타일**: 플랫 아이콘 + 볼드 보더 + 하드 섀도우

### 배지 등급 체계

| 등급 | 보더 컬러 | 배경 | 조건 |
|------|-----------|------|------|
| **Bronze** | `#CD7F32` | `#1A1A1A` | 기본 달성 (조건값 하위 25%) |
| **Silver** | `#C0C0C0` | `#1A1A1A` | 중간 달성 (조건값 25-50%) |
| **Gold** | `#E6FF00` (accent) | `#1A1A1A` | 상위 달성 (조건값 50-75%) |
| **Platinum** | `#FFFFFF` | `#E6FF00` | 최고 달성 (조건값 75-100%) |

### 배지 카탈로그

#### 포인트 기반 배지
```
[  ★  ]  "첫 걸음"      — 100포인트 달성 (Bronze)
[  ★★ ]  "성장 중"       — 500포인트 달성 (Silver)
[ ★★★ ]  "실력자"        — 2,000포인트 달성 (Gold)
[★★★★]  "마스터"         — 5,000포인트 달성 (Platinum)
```

#### 퀘스트 완료 배지
```
[  ✓  ]  "시작이 반"     — 첫 퀘스트 완료 (Bronze)
[ ✓✓  ]  "꾸준한 도전"   — 12개 퀘스트 완료 (Silver)
[ ✓✓✓ ]  "정복자"        — 24개 퀘스트 완료 (Gold)
[✓✓✓✓]  "풀 클리어"     — 36개 퀘스트 완료 (Platinum)
```

#### 대결 승리 배지
```
[  ⚔  ]  "첫 승리"      — AI에 첫 승리 (Bronze)
[ ⚔⚔  ]  "도전자"       — 5연승 (Silver)
[ ⚔⚔⚔ ]  "강적"         — 10연승 (Gold)
[⚔⚔⚔⚔]  "인간 승리"    — 월간 AI 완승 (Platinum)
```

#### 스트릭 배지
```
[  🔥 ]  "불꽃 시작"    — 3일 연속 (Bronze)
[ 🔥🔥 ]  "뜨거운 열정"  — 7일 연속 (Silver)
[🔥🔥🔥]  "불멸의 불꽃"  — 30일 연속 (Gold)
[🔥★🔥]  "전설의 불꽃"  — 90일 연속 (Platinum)
```

#### 특별 배지 (월별 테마)
```
[ 📊 ]  "전략가"        — 마케팅 월 우수 (3월)
[ 💻 ]  "코더"          — 프로그래밍 월 우수 (4월)
[ 📝 ]  "작가"          — 글쓰기 월 우수 (5월)
[ 🎨 ]  "크리에이터"    — 디자인 월 우수 (6월)
```

### 배지 획득 애니메이션
```
1. 화면 중앙에 배지 등장 (scale 0 → 1.2, 300ms, ease-bounce)
2. 배지 정착 (scale 1.2 → 1, 200ms)
3. 파티클 효과: 배지 주변 4방향으로 작은 사각형 파티클 발사
4. 축하 텍스트 페이드인: "새 배지 획득!"
5. 배지명 + 설명 표시
6. 포인트 보너스 카운트업 애니메이션
7. 3초 후 자동 dismiss (또는 클릭)
```

---

## 2. 칭호 시스템

### 칭호 표시 방식
- 사용자명 아래 또는 옆에 작은 뱃지 형태로 표시
- 폰트: JetBrains Mono, UPPERCASE, 11px
- 테두리: 2px solid, 등급별 색상

### 칭호 목록

| 칭호 | 조건 | 표시 색상 |
|------|------|-----------|
| **ROOKIE** | 가입 시 기본 | Gray |
| **CHALLENGER** | 첫 대결 완료 | White |
| **WARRIOR** | 10회 대결 | Human Blue |
| **STRATEGIST** | 월간 퀘스트 전체 완료 | Accent Yellow |
| **LEGEND** | 3개월 연속 상위 10% | Platinum White |
| **AI SLAYER** | 단월 AI 전승 | Error Red |
| **UNSTOPPABLE** | 30일 스트릭 | Warning Orange |

---

## 3. 점수 애니메이션

### 점수 증가 표현
```css
/* 점수 팝업: 현재 점수 위에 떠오르며 사라짐 */
.score-popup {
  position: absolute;
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 700;
  color: #E6FF00;
  animation: float-up 1s ease-out forwards;
}

@keyframes float-up {
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-60px); opacity: 0; }
}
```

### 점수 카운트업
```
시작값 → 목표값 (400ms, ease-out)
예: 2,250 → 2,450 (숫자가 빠르게 올라감)
```

### 보너스 점수 표시
- 기본 점수: 흰색 텍스트
- 보너스 (승리): `+50` Electric Yellow, 바운스 효과
- 감점 없음 (패배해도 점수 부여, 양은 줄어듦)

---

## 4. 대결 결과 애니메이션

### 승리 시
```
1. 화면 좌측(사람 패널)이 확대 (scale 1.02)
2. 사람 패널 보더가 두꺼워짐 (4px → 6px)
3. "VICTORY" 텍스트 등장 (Electric Yellow, H1 크기)
4. 사람 점수에 보너스 카운트업
5. 배경에 사람 팀 컬러 은은한 글로우
```

### 패배 시
```
1. 화면 우측(AI 패널)이 확대 (scale 1.02)
2. AI 패널 보더가 두꺼워짐
3. "DEFEAT" 텍스트 등장 (Gray, H1 크기)
4. 하단에 격려 메시지: "실력은 올랐습니다"
5. 획득 점수는 여전히 표시 (양이 적을 뿐)
```

### 무승부 시
```
1. VS 뱃지가 확대 (scale 1.5)
2. "DRAW" 텍스트 등장 (White)
3. 양쪽 동시 점수 카운트업
```

---

## 5. 진행률 시각화

### 월간 진행 바
```
┌─────────────────────────────────────────┐
│ ████████████████████░░░░░░░░░░░░░░░░░░░ │  60%
│ MONTH 03: 마케팅 & 브랜딩               │
│ 3/5 퀘스트 완료 · 450/750 포인트        │
└─────────────────────────────────────────┘
```

### 연간 진행 타임라인
```
 1월    2월    3월    4월    5월    ...   12월
 [██]  [██]  [▓▓]  [░░]  [░░]       [░░]
 완료   완료   진행중  잠김   잠김        잠김
```

### 스트릭 캘린더
```
주간 뷰 (최근 7일):
 월   화   수   목   금   토   일
[🔥] [🔥] [🔥] [🔥] [🔥] [  ] [  ]
 5일 연속 스트릭
```

---

## 6. CSS 구현 가이드

### 배지 컴포넌트 CSS
```css
.gamification-badge {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 3px solid;
  font-size: 24px;
  position: relative;
}

.gamification-badge--bronze { border-color: #CD7F32; }
.gamification-badge--silver { border-color: #C0C0C0; }
.gamification-badge--gold { border-color: var(--color-accent); }
.gamification-badge--platinum {
  border-color: var(--color-white);
  background: var(--color-accent);
}

.gamification-badge--earned {
  box-shadow: var(--shadow-md);
}

.gamification-badge--locked {
  opacity: 0.3;
  filter: grayscale(1);
}
```

### 스트릭 카운터 CSS
```css
.streak-counter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 2px solid var(--color-warning);
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--color-warning);
}

.streak-counter--hot {
  animation: pulse-glow 2s ease-in-out infinite;
  border-color: var(--color-error);
  color: var(--color-error);
  box-shadow: 0 0 12px rgba(255, 51, 51, 0.3);
}
```

### 승리/패배 결과 오버레이 CSS
```css
.battle-result-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: var(--z-overlay);
}

.battle-result-text {
  font-family: var(--font-display);
  font-size: 6rem;
  font-weight: 700;
  text-transform: uppercase;
  animation: score-pop 400ms var(--ease-bounce);
}

.battle-result-text--victory { color: var(--color-accent); }
.battle-result-text--defeat { color: var(--color-gray-500); }
.battle-result-text--draw { color: var(--color-white); }
```
