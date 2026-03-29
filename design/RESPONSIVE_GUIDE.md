# Beyond AI 반응형 디자인 가이드

## 브레이크포인트

| Name | Width | Target Device |
|------|-------|---------------|
| **Mobile** | < 640px | 스마트폰 (세로) |
| **Mobile Landscape** | 640px - 767px | 스마트폰 (가로) |
| **Tablet** | 768px - 1023px | 태블릿 |
| **Desktop** | 1024px - 1279px | 데스크톱 |
| **Wide** | 1280px - 1439px | 와이드 데스크톱 |
| **Ultra Wide** | >= 1440px | 대형 모니터 |

### CSS 미디어 쿼리
```css
/* Mobile First Approach */
/* Base: Mobile (< 640px) */

@media (min-width: 640px) { /* Mobile Landscape */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Wide Desktop */ }
@media (min-width: 1440px) { /* Ultra Wide */ }
```

---

## 레이아웃 전략

### Navigation

| Breakpoint | Sidebar | Behavior |
|------------|---------|----------|
| Mobile (< 768px) | 숨김 | 햄버거 메뉴 → 오버레이 슬라이드 |
| Tablet (768px+) | 축소 (72px) | 아이콘만 표시, 호버 시 확장 |
| Desktop (1024px+) | 전체 (280px) | 항상 표시, 텍스트 + 아이콘 |

```css
/* Mobile: Hidden sidebar */
@media (max-width: 767px) {
  .nav-sidebar {
    transform: translateX(-100%);
    z-index: var(--z-overlay);
    transition: transform var(--duration-complex) var(--ease-default);
  }
  .nav-sidebar--open { transform: translateX(0); }
  .main-content { margin-left: 0; }
  .mobile-menu-btn { display: flex; }
}

/* Tablet: Collapsed sidebar */
@media (min-width: 768px) and (max-width: 1023px) {
  .nav-sidebar { width: 72px; }
  .nav-sidebar .nav-logo { font-size: var(--text-body); text-align: center; }
  .nav-item span { display: none; }
  .main-content { margin-left: 72px; }
}

/* Desktop: Full sidebar */
@media (min-width: 1024px) {
  .nav-sidebar { width: 280px; }
  .main-content { margin-left: 280px; }
}
```

### Content Grid

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Mobile | 1 | 16px |
| Tablet | 2 | 20px |
| Desktop | 3-4 | 24px |

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-5); }
}

@media (min-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); gap: var(--space-6); }
}
```

---

## 화면별 반응형 전략

### 1. 대결 진행 화면 (Battle Screen)

#### Mobile (< 768px)
```
┌─────────────────┐
│ [Quest #03] 14:32│
├─────────────────┤
│ ┌─ HUMAN ─────┐ │
│ │ 김민수   87  │ │
│ │ [답변 영역]  │ │
│ └─────────────┘ │
│      [VS]       │
│ ┌─── AI ──────┐ │
│ │ GPT-4o   92 │ │
│ │ [답변 영역]  │ │
│ └─────────────┘ │
├─────────────────┤
│ [정확성] [창의성]│
│ [실행가능성]     │
└─────────────────┘
```
- 패널 수직 스택 (grid → 1 column)
- VS 뱃지 크기 축소 (80px → 48px)
- 답변 영역 최소 높이 축소

#### Tablet (768px+)
- 패널 수평 배치 유지, 패딩 축소
- 답변 영역 높이 조정

#### Desktop (1024px+)
- 기본 레이아웃 (3-column grid)

```css
.battle-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .battle-area {
    display: grid;
    grid-template-columns: 1fr 64px 1fr;
    gap: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .battle-area {
    grid-template-columns: 1fr 80px 1fr;
    gap: var(--space-6);
  }
}
```

### 2. 퀘스트 화면 (Quest Screen)

#### Mobile (< 768px)
```
┌─────────────────┐
│ ← MONTH 03 →    │
│ ████████░░ 60%  │
├─────────────────┤
│ [01] 브랜드 분석 │
│      150pts ✓   │
│ [02] 페르소나    │
│      100pts ✓   │
│ [03] 전략 수립   │
│      200pts ✓   │
│ [04] SNS 기획 ← │
│      200pts 진행 │
│ [05] 성과 분석   │
│      200pts 🔒  │
├─────────────────┤
│ [퀘스트 상세]    │
│ (하단 시트로)    │
└─────────────────┘
```
- 퀘스트 리스트만 표시
- 상세 패널 → 바텀 시트 (터치 시 올라옴)
- 퀘스트 번호 크기 축소

#### Tablet (768px+)
- 리스트 + 상세 패널 수평 배치
- 상세 패널 너비 축소 (300px)

```css
.quest-grid {
  display: flex;
  flex-direction: column;
}

.quest-detail {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  transform: translateY(100%);
  transition: transform var(--duration-complex) var(--ease-default);
  z-index: var(--z-overlay);
}

.quest-detail--open { transform: translateY(0); }

@media (min-width: 768px) {
  .quest-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--space-6);
  }
  .quest-detail {
    position: sticky;
    top: var(--space-8);
    transform: none;
    max-height: none;
  }
}

@media (min-width: 1024px) {
  .quest-grid {
    grid-template-columns: 1fr 400px;
    gap: var(--space-8);
  }
}
```

### 3. 대시보드 (Dashboard)

#### Mobile (< 768px)
```
┌─────────────────┐
│ 안녕하세요 김민수│
│ 🔥 14일 스트릭  │
├─────────────────┤
│ [2,450] [8W4L]  │
│ [13/36] [#3]    │
├─────────────────┤
│ [월별 대결 성과] │
│ [차트]           │
├─────────────────┤
│ [성장 그래프]    │
│ [차트]           │
├─────────────────┤
│ [실시간 랭킹]    │
│ 1. 박지영 3,200  │
│ 2. 이준호 2,890  │
│ 3. 김민수 2,450  │
├─────────────────┤
│ [최근 활동]      │
└─────────────────┘
```
- Stats: 2x2 그리드
- Charts: 풀 와이드 스택
- 랭킹/활동: 풀 와이드 스택

#### Tablet
- Stats: 2x2 그리드
- Charts: 2-column
- 랭킹/활동: 2-column

```css
.stats-grid {
  grid-template-columns: repeat(2, 1fr);
}

.dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
}
```

### 4. 관리자 화면 (Admin)

#### Mobile (< 768px)
- 테이블 → 카드 리스트로 전환
- 관리자 오버뷰 통계: 2x3 그리드 → 2x3
- 빠른 작업: 수직 스택

```css
/* Table → Card list on mobile */
@media (max-width: 767px) {
  .data-table thead { display: none; }
  .data-table tr {
    display: flex;
    flex-direction: column;
    padding: var(--space-4);
    border-bottom: var(--border-2) solid var(--border-default);
  }
  .data-table td {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) 0;
    border: none;
  }
  .data-table td::before {
    content: attr(data-label);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    text-transform: uppercase;
    color: var(--text-muted);
  }
}

.overview-grid {
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .overview-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .overview-grid { grid-template-columns: repeat(5, 1fr); }
}
```

---

## 타이포그래피 스케일링

```css
/* Mobile base */
:root {
  --text-display: 2.5rem;   /* 40px (모바일에서 축소) */
  --text-h1: 2rem;          /* 32px */
  --text-h2: 1.5rem;        /* 24px */
}

@media (min-width: 768px) {
  :root {
    --text-display: 3.5rem;  /* 56px */
    --text-h1: 2.5rem;       /* 40px */
    --text-h2: 1.875rem;     /* 30px */
  }
}

@media (min-width: 1024px) {
  :root {
    --text-display: 4.5rem;  /* 72px */
    --text-h1: 3rem;         /* 48px */
    --text-h2: 2.25rem;      /* 36px */
  }
}
```

---

## 터치 타겟

- 최소 터치 타겟: **44x44px** (WCAG)
- 버튼 간 최소 간격: **8px**
- 모바일에서 nav-item 높이: **48px**

---

## 성능 고려사항

- **이미지**: WebP 우선, 모바일에서 2x 해상도
- **폰트**: `font-display: swap`, WOFF2 포맷
- **애니메이션**: `prefers-reduced-motion` 존중
- **레이아웃 시프트**: 이미지/차트에 aspect-ratio 지정

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 접근성 체크리스트

- [ ] 모든 텍스트 대비 4.5:1 이상 (WCAG AA)
- [ ] 포커스 인디케이터 visible (3px accent outline)
- [ ] 키보드 네비게이션 완전 지원
- [ ] 스크린 리더용 aria-label 적용
- [ ] prefers-reduced-motion 존중
- [ ] prefers-color-scheme (향후 라이트모드 대응)
- [ ] 터치 타겟 최소 44x44px
- [ ] 의미 있는 HTML 구조 (semantic HTML)
