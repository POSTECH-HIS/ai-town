# AI Town Map System Guide

이 가이드는 AI Town에서 맵을 사용하고 커스터마이징하는 방법을 설명합니다.

## 개요

AI Town은 **모든 Tiled 맵**을 지원하며 **다중 타일셋**과 **무제한 레이어**를 사용할 수 있습니다!

- ✅ Tiled JSON 파일을 직접 로드 (수동 변환 불필요)
- ✅ 다중 타일셋 자동 지원
- ✅ 모든 크기의 맵 처리 (1MB 데이터베이스 제한 없음!)
- ✅ 맵 간 쉬운 전환
- ✅ 구버전 맵과 호환

## 빠른 시작: 기존 맵 전환하기

**⚠️ 중요: 맵을 변경하려면 `data/activeMap.ts` 파일 하나만 수정하세요!**

### 1단계: 맵 변경

`data/activeMap.ts` 파일을 열고:

```typescript
export const ACTIVE_MAP_NAME: 'gentle' | 'the_ville' | 'testMap' = 'gentle';
//                                                                  ^^^^^^
//                                                                  여기를 바꾸세요!
```

사용 가능한 맵:
- `'gentle'` - Original AI Town map (45x32, 단일 타일셋, 4 레이어)
- `'the_ville'` - Generative Agents map (140x100, 18 타일셋, 17 레이어)
- `'testMap'` - 테스트용 맵 (45x32, 18 타일셋, 충돌 레이어 활성화)

### 2단계: 데이터베이스 초기화

맵을 처음 바꿀 때는 기존 world 데이터를 삭제해야 합니다:

**방법 A: Convex 명령어 (권장)**
```bash
npx convex run init
```

**방법 B: Convex Dashboard**
1. `npx convex dashboard` 실행
2. Data 탭 → `worlds` 테이블
3. 모든 행 삭제

### 3단계: 앱 재시작

```bash
npm run dev
```

새로고침(Ctrl+F5)하면 새 맵이 로드됩니다!

---

## 새로운 맵 추가하기 (완전 가이드)

### 📋 개요

새로운 맵을 추가하려면 **5개의 파일**을 수정해야 합니다:
1. `public/assets/your_map/` - Tiled JSON 파일 저장
2. `data/maps/your_map.ts` - 변환된 맵 데이터 (자동 생성)
3. `data/mapConfig.ts` - 맵 설정 추가
4. `data/activeMap.ts` - 타입 정의 추가
5. `convex/mapData.ts` - Convex 백엔드에서 맵 접근 설정

---

### 1단계: Tiled에서 맵 내보내기

1. [Tiled Map Editor](https://www.mapeditor.org/)에서 맵 열기
2. `File > Export As...` 선택
3. `JSON map files (*.json)` 형식 선택
4. 파일 저장 (예: `my_map.json`)

**⚠️ 중요 - Collision 레이어 설정:**
- 맵에 **"Collisions"** 또는 **"Object Interaction Blocks"** 레이어를 추가하세요
- 이 레이어들이 플레이어/에이전트 이동을 제한합니다
- 레이어가 없으면 시각적 오브젝트 레이어가 대신 사용되어 잘못된 충돌이 발생할 수 있습니다

---

### 2단계: 파일 복사

#### 2-1. 맵 JSON 파일 복사

```bash
# 디렉토리 생성 및 JSON 파일 복사
mkdir -p public/assets/my_map
cp my_map.json public/assets/my_map/my_map.json
```

#### 2-2. 타일셋 이미지 복사 (필요한 경우)

기존 타일셋을 사용하지 않는 경우:

```bash
# 새로운 타일셋 이미지를 map_assets에 복사
cp -r path/to/tilesets/* public/assets/map_assets/
```

**💡 팁:** 기존 타일셋 재사용 시 이 단계를 건너뛰세요 (예: testMap처럼 the_ville 타일셋 사용)

---

### 3단계: 맵 변환

터미널에서 변환 스크립트 실행:

```bash
npx tsx scripts/convertMap.ts public/assets/my_map/my_map.json
```

**출력 예시:**
```
✓ Map converted successfully!
  Output: /home/user/ai-town/data/maps/my_map.ts
  Size: 45x32
  Tilesets: 18
  BG Layers: 5
  Object Layers: 5
  Collision layers: 2
  ✓ Using 2 collision layer(s) for movement blocking
```

이 명령어는 `data/maps/my_map.ts` 파일을 자동 생성합니다.

---

### 4단계: `data/mapConfig.ts` 업데이트

파일을 열고 다음과 같이 수정:

#### 4-1. Import 추가 (파일 상단)

```typescript
import { mapData as testMapMap } from './maps/testMap';
import { mapData as myMapMap } from './maps/my_map';  // ← 추가
```

#### 4-2. AVAILABLE_MAPS에 맵 추가

```typescript
export const AVAILABLE_MAPS: Record<string, MapConfig> = {
  gentle: { ... },
  the_ville: { ... },
  testMap: { ... },

  // 새로운 맵 추가
  my_map: {
    name: 'My Awesome Map',
    data: myMapMap,
    description: 'My custom map: 45x32 tiles, collision enabled',
  },
};
```

---

### 5단계: `data/activeMap.ts` 업데이트

타입 정의에 새 맵 추가:

```typescript
export const ACTIVE_MAP_NAME: 'gentle' | 'the_ville' | 'testMap' | 'my_map' = 'the_ville';
//                                                                  ^^^^^^^^
//                                                                  여기에 추가!
```

---

### 6단계: `convex/mapData.ts` 업데이트 ⚠️ 중요!

**이 단계를 빠뜨리면 "Map not found" 오류가 발생합니다!**

#### 6-1. Import 추가 (파일 상단)

```typescript
import { mapData as theVilleMap } from '../data/maps/the_ville';
import { mapData as testMapMap } from '../data/maps/testMap';
import { mapData as myMapMap } from '../data/maps/my_map';  // ← 추가
```

#### 6-2. getMapData 함수에 case 추가

```typescript
export function getMapData(mapName: string): SerializedWorldMap | null {
  switch (mapName) {
    case 'gentle':
      return { ... };

    case 'the_ville':
      return theVilleMap;

    case 'testMap':
      return testMapMap;

    case 'my_map':              // ← 추가
      return myMapMap;           // ← 추가

    default:
      return null;
  }
}
```

---

### 7단계: 맵 활성화 및 테스트

#### 7-1. 맵 활성화

`data/activeMap.ts`:
```typescript
export const ACTIVE_MAP_NAME: ... = 'my_map';  // ← 변경
```

#### 7-2. 데이터베이스 초기화

```bash
npx convex run init
```

#### 7-3. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속하여 새 맵 확인!

---

### ✅ 체크리스트

새 맵을 추가할 때 이 체크리스트를 사용하세요:

- [ ] Tiled에서 JSON으로 맵 내보내기
- [ ] Collision 레이어 포함 확인
- [ ] `public/assets/my_map/` 폴더 생성 및 JSON 복사
- [ ] 타일셋 이미지 `public/assets/map_assets/`에 복사 (필요시)
- [ ] `npx tsx scripts/convertMap.ts ...` 실행
- [ ] `data/maps/my_map.ts` 생성 확인
- [ ] `data/mapConfig.ts` import 추가
- [ ] `data/mapConfig.ts` AVAILABLE_MAPS 추가
- [ ] `data/activeMap.ts` 타입 추가
- [ ] `convex/mapData.ts` import 추가 ⚠️
- [ ] `convex/mapData.ts` switch case 추가 ⚠️
- [ ] `npx convex run init` 실행
- [ ] `npm run dev` 실행
- [ ] 브라우저에서 맵 확인

## Map Requirements

Your Tiled map should:

- ✅ Use **square tiles** (e.g., 32x32, 16x16)
- ✅ Have at least **one tile layer**
- ✅ Use **relative paths** for tileset images
- ✅ Export as **JSON** (not TMX)

## Understanding Layer Filtering

When converting a map with `npm run convert-map`, you can filter which layers to include.

Edit your map config in `data/mapConfig.ts` BEFORE running convert-map:

```typescript
my_map: {
  name: 'My Map',
  tiledJsonPath: '/ai-town/assets/my_map/map.json',
  assetsUrlPrefix: '/ai-town/assets/',
  layerFilter: ['Ground', 'Buildings', 'Trees'], // Only these layers
},
```

Then run: `npm run convert-map my_map`

**Layers automatically excluded:**
- Collision layers
- Block layers (Arena, Sector, World, Spawning, etc.)
- Hidden/invisible layers in Tiled

**To include all visible layers:**
- Don't specify `layerFilter` or set it to `undefined`

## Tileset Image Paths

Tiled JSON files store image paths relative to the map file. For example:

```json
"image": "map_assets/cute_rpg_word_VXAce/tilesets/Field.png"
```

The system automatically resolves these to:

```
/ai-town/assets/map_assets/cute_rpg_word_VXAce/tilesets/Field.png
```

Make sure your tileset images are in `public/assets/map_assets/` and match the paths in your Tiled JSON!

## 문제 해결 (Troubleshooting)

### ❌ 오류: "Map not found: your_map"

**원인:** `convex/mapData.ts`에 맵이 추가되지 않았습니다.

**해결 방법:**
1. `convex/mapData.ts` 파일 열기
2. Import 추가: `import { mapData as yourMapMap } from '../data/maps/your_map';`
3. `getMapData()` 함수의 switch 문에 case 추가:
   ```typescript
   case 'your_map':
     return yourMapMap;
   ```
4. `npx convex run init` 실행

---

### ❌ 오류: "Cannot find module '../data/maps/your_map'"

**원인:** 맵 변환을 실행하지 않았거나 변환 파일이 생성되지 않았습니다.

**해결 방법:**
1. 변환 스크립트 실행:
   ```bash
   npx tsx scripts/convertMap.ts public/assets/your_map/your_map.json
   ```
2. `data/maps/your_map.ts` 파일이 생성되었는지 확인
3. 오류 메시지 확인 (JSON 파일 경로, 형식 등)

---

### ❌ 맵이 로드되지 않거나 화면에 표시되지 않음

**해결 체크리스트:**
1. [ ] `npx tsx scripts/convertMap.ts ...` 실행했나요?
2. [ ] `data/maps/your_map.ts` 파일이 생성되었나요?
3. [ ] `data/mapConfig.ts`에 import와 AVAILABLE_MAPS 추가했나요?
4. [ ] `data/activeMap.ts`에 맵 이름을 타입에 추가했나요?
5. [ ] **`convex/mapData.ts`에 import와 case를 추가했나요?** ⚠️ (가장 흔한 실수!)
6. [ ] `npx convex run init` 실행했나요?
7. [ ] 개발 서버를 재시작했나요? (`npm run dev`)
8. [ ] 브라우저를 새로고침했나요? (Ctrl+F5 또는 Cmd+Shift+R)

**추가 확인:**
- 브라우저 개발자 도구 (F12) 콘솔에서 오류 확인
- Convex 대시보드 로그 확인: `npx convex dashboard`

---

### ❌ 변환 실패: "Failed to load map from ..."

**해결 방법:**
1. JSON 파일 경로 확인:
   ```bash
   ls -la public/assets/your_map/
   ```
2. JSON 파일이 유효한지 확인 (텍스트 에디터로 열어보기)
3. Tiled에서 다시 내보내기 (JSON 형식 확인)
4. 경로에 특수문자나 공백이 없는지 확인

---

### 🎨 타일이 잘못 렌더링됨 (깨진 타일, 검은색 타일)

**원인:** Tiled의 플립/회전 플래그가 제대로 처리되지 않았거나 타일 인덱싱 문제입니다.

**해결 방법:**
1. 최신 변환 스크립트 사용 확인 (플립 플래그 자동 처리)
2. 맵 재변환:
   ```bash
   npx tsx scripts/convertMap.ts public/assets/your_map/your_map.json
   ```
3. Convex 배포 및 데이터베이스 초기화:
   ```bash
   npx convex dev --once
   npx convex run init
   ```
4. 브라우저 강력 새로고침 (Ctrl+F5)

**추가 확인사항:**
- 모든 타일셋이 동일한 타일 크기를 사용하는지 확인 (예: 32x32)
- 타일셋 이미지가 누락되지 않았는지 브라우저 콘솔에서 확인
- JSON 파일의 이미지 경로와 `public/assets/`의 실제 파일 확인
- 타일셋 이미지가 `public/assets/map_assets/`에 있는지 확인

**기술적 배경:**
- Tiled는 타일을 뒤집거나 회전할 때 상위 비트를 플래그로 사용합니다
- 변환 스크립트가 이 플래그를 자동으로 제거하여 실제 타일 ID만 저장합니다

---

### 🚶 플레이어/에이전트가 이동할 수 없는 곳이 많음

**원인:** Collision 레이어가 없거나 잘못 설정되었습니다.

**해결 방법:**
1. Tiled에서 맵 열기
2. **"Collisions"** 레이어 추가 (이름에 "collision" 포함 필수)
3. 벽, 장애물 등 지나갈 수 없는 곳에 타일 배치
4. 지나갈 수 있는 곳은 비워두기
5. JSON으로 다시 내보내기
6. 맵 재변환 실행:
   ```bash
   npx tsx scripts/convertMap.ts public/assets/your_map/your_map.json
   ```
7. 변환 출력에서 확인:
   ```
   Collision layers: 2
   ✓ Using 2 collision layer(s) for movement blocking
   ```
8. `npx convex run init` 및 서버 재시작

**Collision 레이어 이름 규칙:**
- ✅ "Collisions"
- ✅ "Object Interaction Blocks"
- ✅ 이름에 "collision" 또는 "object interaction" 포함
- ❌ "Walls", "Objects" 등 (인식되지 않음)

---

### 🔄 맵을 업데이트하고 싶을 때

**방법:**
1. Tiled에서 맵 수정
2. JSON으로 다시 내보내기 (같은 경로에 덮어쓰기)
3. 맵 재변환:
   ```bash
   npx tsx scripts/convertMap.ts public/assets/your_map/your_map.json
   ```
4. 데이터베이스 초기화:
   ```bash
   npx convex run init
   ```
5. 개발 서버 재시작:
   ```bash
   npm run dev
   ```
6. 브라우저 강력 새로고침 (Ctrl+F5)

## Technical Details

### File Structure

```
ai-town/
├── data/
│   ├── mapConfig.ts           # Map configuration (edit this!)
│   ├── tiledMapLoader.ts      # Tiled JSON parser
│   ├── convertTiledMap.ts     # Map converter
│   └── MAP_GUIDE.md           # This file
├── public/assets/
│   ├── the_ville/
│   │   └── map.json           # Tiled JSON files
│   └── map_assets/            # Tileset images
│       ├── cute_rpg_word_VXAce/
│       ├── v1/
│       └── blocks/
└── convex/
    └── aiTown/
        └── worldMap.ts        # Map schema

```

### How It Works

1. **Export**: Export your map from Tiled as JSON
2. **Convert**: Run `npm run convert-map` to generate a TypeScript module
3. **Import**: Import the converted map in `mapConfig.ts`
4. **Load**: `init.ts` imports the map data at build time
5. **Store**: Map data is stored in Convex DB (pre-optimized)
6. **Render**: `PixiStaticMap.tsx` renders using all tilesets

**Benefits:**
- ✅ No file I/O at runtime (faster)
- ✅ Works with Convex constraints (no Node.js runtime needed)
- ✅ Type-safe TypeScript modules
- ✅ Supports unlimited tilesets and map size

### Legacy Map Support

Old maps using `data/gentle.js` still work! The system is backward compatible:

- If a map has `tileSetUrl`, it uses the legacy single-tileset renderer
- If a map has `tilesets[]`, it uses the new multi-tileset renderer

## Example Maps

### Small Map (gentle)
- Size: 45x32 tiles
- Tilesets: 1
- Layers: 4
- Perfect for testing

### Large Map (the_ville)
- Size: 140x100 tiles
- Tilesets: 18
- Layers: 17 (visible: ~10)
- Great for complex environments

## Need Help?

Check the console logs for detailed information about map loading:

```
Loading map: The Ville from /ai-town/assets/the_ville/map.json
Map loaded successfully: 140x100, 18 tilesets, 7 bg layers, 3 object layers
```

If you're still having issues, check:
- Browser developer console (F12)
- Convex dashboard logs
- File paths and permissions
