# AI Town Convex Backend

이 디렉토리에는 AI Town의 백엔드 로직이 포함되어 있습니다.

## 🗺️ 새로운 맵 추가 시 필수 업데이트

새로운 맵을 AI Town에 추가할 때 **`mapData.ts`를 반드시 업데이트해야 합니다**:

### 📄 `convex/mapData.ts` ⚠️ 중요!

이 파일은 Convex 백엔드에서 맵 데이터에 접근하는 중앙 파일입니다.

#### 업데이트 방법:

**1. Import 추가** (파일 상단):
```typescript
import { mapData as yourMapMap } from '../data/maps/your_map';
```

**2. getMapData() 함수에 case 추가**:
```typescript
export function getMapData(mapName: string): SerializedWorldMap | null {
  switch (mapName) {
    case 'gentle':
      return { ... };

    case 'the_ville':
      return theVilleMap;

    case 'your_map':         // ← 추가
      return yourMapMap;      // ← 추가

    default:
      return null;
  }
}
```

#### ⚠️ 주의사항:

- **이 파일을 업데이트하지 않으면 "Map not found: your_map" 오류가 발생합니다**
- 변경 후 반드시 Convex를 재시작하거나 배포해야 합니다:
  ```bash
  # 개발 환경 (권장)
  npm run dev

  # 또는 프로덕션 배포
  npx convex deploy
  ```

---

## 🚀 변경사항 적용하기

### 방법 1: 개발 서버 실행 (권장)

```bash
npm run dev
```

이 명령어는:
- ✅ Vite 개발 서버 시작
- ✅ Convex 개발 서버 시작 (자동으로 변경사항 감지 및 배포)
- ✅ 파일 변경 시 자동으로 핫 리로드

### 방법 2: Convex만 따로 실행

별도 터미널에서:

```bash
# 터미널 1: Convex 백엔드
npx convex dev

# 터미널 2: Vite 프론트엔드
npm run dev:frontend
```

### 방법 3: 프로덕션 배포

```bash
npx convex deploy
```

---

## 🔄 데이터베이스 초기화

맵을 변경한 후에는 world 데이터를 초기화해야 합니다:

```bash
npx convex run init
```

이 명령어는:
- 새로운 world 생성
- 선택된 맵 로드 (`data/activeMap.ts`에서 지정)
- 초기 에이전트 생성

---

## 🛠️ 문제 해결

### ❌ "Map not found: your_map" 오류

**원인:** `convex/mapData.ts`에 맵이 추가되지 않았습니다.

**해결:**
1. `convex/mapData.ts` 파일 열기
2. Import 추가: `import { mapData as yourMapMap } from '../data/maps/your_map';`
3. `getMapData()` 함수의 switch 문에 case 추가
4. 개발 서버 재시작: `npm run dev`
5. 데이터베이스 초기화: `npx convex run init`

### ❌ Convex가 변경사항을 감지하지 않음

**해결:**
1. Convex 개발 서버 재시작 (Ctrl+C 후 `npm run dev`)
2. 또는 강제 배포: `npx convex deploy`
3. 브라우저 캐시 삭제 (Ctrl+F5)

### ❌ "Cannot find module '../data/maps/your_map'"

**원인:** 맵 변환을 하지 않았습니다.

**해결:**
```bash
npx tsx scripts/convertMap.ts public/assets/your_map/your_map.json
```

---

## 📁 파일 구조

```
convex/
├── README.md                # 이 파일
├── mapData.ts               # ⚠️ 새 맵 추가 시 필수 업데이트!
├── init.ts                  # World 초기화 (mapData.ts 사용)
├── aiTown/
│   ├── worldMap.ts          # Map 타입 정의
│   ├── game.ts              # 게임 엔진 로직
│   ├── movement.ts          # 충돌 감지 및 이동
│   ├── player.ts            # 플레이어 관리
│   ├── agent.ts             # AI 에이전트 관리
│   └── conversation.ts      # 대화 시스템
├── agent/
│   ├── conversation.ts      # LLM 기반 대화 생성
│   ├── memory.ts            # 에이전트 메모리 시스템
│   └── embeddingsCache.ts   # 임베딩 캐시
└── _generated/              # Convex 자동 생성 파일
```

---

## 📚 더 자세한 정보

### 맵 시스템
맵 추가 및 관리에 대한 완전한 가이드: **`data/MAP_GUIDE.md`**

### Convex 문서
- Convex 공식 문서: https://docs.convex.dev/
- Convex CLI: `npx convex -h`
- 로컬 대시보드: `npx convex dashboard`

---

## 📝 새 맵 추가 체크리스트

새로운 맵을 추가할 때 다음 파일들을 업데이트하세요:

- [ ] `public/assets/your_map/` - Tiled JSON 파일 저장
- [ ] `npx tsx scripts/convertMap.ts ...` - 맵 변환 실행
- [ ] `data/maps/your_map.ts` - 자동 생성 확인
- [ ] `data/mapConfig.ts` - Import 및 AVAILABLE_MAPS 추가
- [ ] `data/activeMap.ts` - 타입 정의에 맵 추가
- [ ] **`convex/mapData.ts` - Import 및 case 추가** ⚠️ 가장 중요!
- [ ] `npm run dev` - 개발 서버 시작
- [ ] `npx convex run init` - 데이터베이스 초기화
- [ ] 브라우저에서 맵 확인

자세한 단계별 가이드는 `data/MAP_GUIDE.md`를 참조하세요.
