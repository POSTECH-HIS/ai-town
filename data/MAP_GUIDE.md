# AI Town Map System Guide

이 가이드는 AI Town에서 맵을 사용하고 커스터마이징하는 방법을 설명합니다.

## 개요

AI Town은 **모든 Tiled 맵**을 지원하며 **다중 타일셋**과 **무제한 레이어**를 사용할 수 있습니다!

- ✅ Tiled JSON 파일을 직접 로드 (수동 변환 불필요)
- ✅ 다중 타일셋 자동 지원
- ✅ 모든 크기의 맵 처리 (1MB 데이터베이스 제한 없음!)
- ✅ 맵 간 쉬운 전환
- ✅ 구버전 맵과 호환
- ✨ **Semantic Map 지원** - 맵의 의미론적 정보 (공간, 오브젝트, 위치 등)를 이해

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

---

## Semantic Map System (의미론적 맵)

### 📖 개요

**Semantic Map**은 맵의 각 타일에 의미론적 정보를 부여하는 시스템입니다. 이를 통해 에이전트가 "주방", "침실", "식탁" 등의 공간을 이해하고, 특정 오브젝트(냉장고, 침대, 의자)가 있는 위치를 찾을 수 있습니다.

이 시스템은 [generative_agents](https://github.com/joonspk-research/generative_agents)의 `maze.py` 기능을 이식한 것으로, CSV 파일을 사용하여 맵의 의미론적 구조를 정의합니다.

**주요 기능:**
- 🏠 **계층적 공간 구조**: 월드 → 섹터 → 아레나 → 게임 오브젝트
- 📍 **위치 기반 쿼리**: "부엌에 있는 모든 타일", "냉장고가 있는 위치" 등
- 🎯 **스폰 위치 관리**: 특정 이름을 가진 스폰 위치 정의
- 🤖 **에이전트 행동**: 에이전트가 공간과 오브젝트를 이해하고 상호작용

### 🏗️ 계층 구조

Semantic Map은 다음과 같은 4단계 계층 구조를 사용합니다:

```
World (월드)
└── Sector (섹터 - 건물이나 큰 구역)
    └── Arena (아레나 - 방이나 작은 공간)
        └── Game Object (게임 오브젝트 - 가구, 물건 등)
```

**예시:**
```
the Ville                              (World)
└── Giorgio Rossi's apartment          (Sector)
    └── kitchen                        (Arena)
        └── stove                      (Game Object)
        └── refrigerator               (Game Object)
    └── bedroom                        (Arena)
        └── bed                        (Game Object)
```

**추가로:**
- **Spawning Location**: 에이전트가 생성될 수 있는 특별한 위치 (예: "kitchen-spawn", "bedroom-entrance")

### 📂 CSV 파일 구조

Semantic Map 데이터는 다음 위치의 CSV 파일들에 저장됩니다:

```
environment/frontend_server/static_dirs/assets/{맵이름}/matrix/
├── maze/                              # 맵 레이아웃 (1D 배열)
│   ├── sector_maze.csv                # 섹터 레이어
│   ├── arena_maze.csv                 # 아레나 레이어
│   ├── game_object_maze.csv           # 게임 오브젝트 레이어
│   └── spawning_location_maze.csv     # 스폰 위치 레이어
└── special_blocks/                    # 타일 ID → 의미 매핑
    ├── world_blocks.csv               # 월드 정의
    ├── sector_blocks.csv              # 섹터 정의
    ├── arena_blocks.csv               # 아레나 정의
    ├── game_object_blocks.csv         # 오브젝트 정의
    └── spawning_location_blocks.csv   # 스폰 위치 정의
```

#### Maze 파일 형식 (레이아웃)

각 maze CSV 파일은 **1행짜리 1D 배열**입니다 (width × height 개의 타일 ID):

```csv
0, 0, 32135, 32135, 32135, ..., 0, 0
```

- 각 값은 타일 ID (숫자)
- 순서: 왼쪽에서 오른쪽, 위에서 아래로 (row-major order)
- `0`은 해당 타일에 정보가 없음을 의미

#### Block 파일 형식 (의미 정의)

각 block CSV 파일은 **타일 ID를 의미론적 정보로 매핑**합니다:

**world_blocks.csv:**
```csv
tile_id,world_name
12345,the Ville
```

**sector_blocks.csv:**
```csv
tile_id,world_name,sector_name
32135,the Ville,Giorgio Rossi's apartment
32136,the Ville,Carlos Gomez's apartment
```

**arena_blocks.csv:**
```csv
tile_id,world_name,sector_name,arena_name
45678,the Ville,Giorgio Rossi's apartment,kitchen
45679,the Ville,Giorgio Rossi's apartment,bedroom
```

**game_object_blocks.csv:**
```csv
tile_id,world_name,sector_or_all,object_name
56789,the Ville,Giorgio Rossi's apartment,stove
56790,the Ville,all,chair
```

**spawning_location_blocks.csv:**
```csv
tile_id,spawning_location_name
67890,kitchen-entrance
67891,bedroom-spawn
```

### 🔧 Semantic Map이 있는 맵 추가하기

기존 맵 추가 프로세스에 semantic map 지원을 추가하려면:

#### 1단계: CSV 파일 준비

맵 이름이 `my_map`이라면, 다음 경로에 CSV 파일을 준비합니다:

```bash
mkdir -p environment/frontend_server/static_dirs/assets/my_map/matrix/maze
mkdir -p environment/frontend_server/static_dirs/assets/my_map/matrix/special_blocks
```

#### 2단계: Maze CSV 파일 생성

각 레이어에 대해 1D 배열을 생성합니다. 예를 들어, 10x10 맵의 경우:

```bash
# Python 스크립트 예시로 생성 가능
import numpy as np

width, height = 10, 10
sector_maze = np.zeros(width * height, dtype=int)

# 특정 영역에 타일 ID 할당
# 예: (2,2)부터 (5,5)까지를 섹터 ID 100으로
for y in range(2, 6):
    for x in range(2, 6):
        idx = y * width + x
        sector_maze[idx] = 100

# CSV로 저장 (1행)
np.savetxt('sector_maze.csv', [sector_maze], delimiter=',', fmt='%d')
```

#### 3단계: Block CSV 파일 생성

타일 ID를 의미로 매핑하는 파일들을 생성합니다:

**sector_blocks.csv:**
```csv
100,my_world,main_building
```

**arena_blocks.csv:**
```csv
200,my_world,main_building,lobby
```

#### 4단계: 맵 변환 실행

Semantic Map은 맵 변환 시 자동으로 파싱됩니다:

```bash
npx tsx scripts/convertMap.ts public/assets/my_map/my_map.json
```

**출력 예시:**
```
[ConvertTiledMap] Attempting to parse semantic data from CSV files...
[ConvertTiledMap] CSV directories found, parsing semantic map...
[SemanticMapParser] Reading maze layout CSVs...
[SemanticMapParser] Built block definition maps
  - 5 sector blocks
  - 12 arena blocks
  - 38 game object blocks
  - 8 spawning location blocks
[SemanticMapParser] ✓ Semantic map successfully parsed from CSV files

✓ Map converted successfully!
  Semantic Map: Yes ✓
    - 63 semantic addresses parsed
    - Sample addresses:
      • my_world:main_building (100 tiles)
      • my_world:main_building:lobby (25 tiles)
      • my_world:main_building:kitchen:stove (4 tiles)
```

#### 5단계: 정상 작동 확인

맵 변환 후 `data/maps/my_map.ts` 파일에서 semantic map이 포함되었는지 확인:

```typescript
export const mapData: SerializedWorldMap = {
  width: 10,
  height: 10,
  // ... other fields ...
  semanticMap: {
    tiles: [ /* 2D array of tile semantics */ ],
    addressTiles: [ /* address -> coordinates mapping */ ]
  }
};
```

### 💻 코드에서 Semantic Map 사용하기

#### 기본 사용법

Convex 함수에서 semantic map 접근:

```typescript
import { WorldMap } from './aiTown/worldMap';

// WorldMap 인스턴스 생성
const worldMap = new WorldMap(serializedMapData);

// 특정 좌표의 의미론적 정보 가져오기
const tileInfo = worldMap.getTileSemantics(x, y);

if (tileInfo) {
  console.log(`World: ${tileInfo.world}`);
  console.log(`Sector: ${tileInfo.sector}`);
  console.log(`Arena: ${tileInfo.arena}`);
  console.log(`Game Object: ${tileInfo.game_object}`);
  console.log(`Spawning Location: ${tileInfo.spawning_location}`);
}
```

#### 주소로 좌표 찾기

특정 공간이나 오브젝트에 해당하는 모든 타일 찾기:

```typescript
// "the Ville:Giorgio Rossi's apartment:kitchen" 아레나의 모든 좌표
const kitchenTiles = worldMap.getAddressCoordinates(
  "the Ville:Giorgio Rossi's apartment:kitchen"
);

for (const coord of kitchenTiles) {
  console.log(`Kitchen tile at: (${coord.x}, ${coord.y})`);
}

// 냉장고가 있는 모든 위치
const fridgeTiles = worldMap.getAddressCoordinates(
  "the Ville:Giorgio Rossi's apartment:kitchen:refrigerator"
);
```

#### SemanticMap 클래스 직접 사용

더 고급 기능이 필요한 경우:

```typescript
import { SemanticMap } from './aiTown/semanticMap';

const semanticMap = worldMap.semanticMap;

if (semanticMap) {
  // 특정 레벨까지의 경로 가져오기
  const sectorPath = semanticMap.getTilePath({ x: 10, y: 15 }, 'sector');
  // 결과: "the Ville:Giorgio Rossi's apartment"

  const arenaPath = semanticMap.getTilePath({ x: 10, y: 15 }, 'arena');
  // 결과: "the Ville:Giorgio Rossi's apartment:kitchen"

  // 타일 정보 직접 접근
  const tile = semanticMap.accessTile({ x: 10, y: 15 });
  console.log(tile.arena); // "kitchen"
}
```

#### 에이전트 행동 예시

에이전트가 부엌으로 이동하는 예시:

```typescript
// agents/movement.ts 또는 유사한 파일에서

export async function moveToKitchen(
  ctx: ActionCtx,
  agentId: Id<'agents'>,
  targetAddress: string
) {
  const world = await ctx.runQuery(internal.world.get);
  const worldMap = new WorldMap(world.mapData);

  // 부엌의 모든 타일 가져오기
  const kitchenTiles = worldMap.getAddressCoordinates(
    "the Ville:Giorgio Rossi's apartment:kitchen"
  );

  if (kitchenTiles.size === 0) {
    console.warn(`No tiles found for address: ${targetAddress}`);
    return;
  }

  // 랜덤 타일 선택 또는 가장 가까운 타일 선택
  const targetTile = Array.from(kitchenTiles)[0];

  // 에이전트를 해당 위치로 이동 (기존 이동 시스템 사용)
  await moveAgentTo(ctx, agentId, targetTile.x, targetTile.y);
}
```

#### 스폰 위치 사용

특정 이름의 스폰 위치에서 에이전트 생성:

```typescript
// 스폰 위치 찾기
const spawnTiles = worldMap.getAddressCoordinates(
  "<spawn_loc>kitchen-entrance"
);

if (spawnTiles.size > 0) {
  const spawnPoint = Array.from(spawnTiles)[0];
  await spawnAgent(ctx, agentId, spawnPoint.x, spawnPoint.y);
}
```

### 🐛 Semantic Map 문제 해결

#### ❌ Semantic Map이 파싱되지 않음

**증상:**
```
[ConvertTiledMap] ℹ CSV directories not found, skipping semantic map
```

**원인:** CSV 파일 경로가 잘못되었거나 파일이 없습니다.

**해결 방법:**
1. CSV 디렉토리 경로 확인:
   ```bash
   ls -la environment/frontend_server/static_dirs/assets/the_ville/matrix/
   ```

2. 필요한 파일들이 있는지 확인:
   ```bash
   # maze 디렉토리
   ls environment/frontend_server/static_dirs/assets/the_ville/matrix/maze/
   # 예상: sector_maze.csv, arena_maze.csv, game_object_maze.csv, spawning_location_maze.csv

   # special_blocks 디렉토리
   ls environment/frontend_server/static_dirs/assets/the_ville/matrix/special_blocks/
   # 예상: world_blocks.csv, sector_blocks.csv, arena_blocks.csv, etc.
   ```

3. 맵 이름이 디렉토리 이름과 일치하는지 확인:
   - JSON 파일 위치: `public/assets/{맵이름}/map.json`
   - CSV 파일 위치: `environment/frontend_server/static_dirs/assets/{맵이름}/matrix/`

---

#### ❌ CSV 파싱 오류

**증상:**
```
[ConvertTiledMap] ⚠ Failed to parse semantic map from CSV files:
  Failed to read CSV file: ...
```

**원인:** CSV 파일 형식이 잘못되었습니다.

**해결 방법:**
1. CSV 파일을 텍스트 에디터로 열어 형식 확인
2. Maze 파일은 **1행만** 있어야 함 (width × height 개의 값)
3. Block 파일은 **헤더 없이** 데이터만 포함
4. 모든 값이 쉼표로 구분되어 있는지 확인
5. 특수문자나 공백이 올바른지 확인

**올바른 형식 예시:**

sector_maze.csv (1행, 100개 값):
```csv
0,0,100,100,100,0,0,200,200,200,...
```

sector_blocks.csv (헤더 없음):
```csv
100,the Ville,Building A
200,the Ville,Building B
```

---

#### ❌ getTileSemantics가 undefined 반환

**원인:** 해당 좌표에 semantic 정보가 없거나 맵에 semantic map이 없습니다.

**해결 방법:**
1. Semantic map이 파싱되었는지 확인:
   ```typescript
   if (!worldMap.semanticMap) {
     console.warn('No semantic map available');
   }
   ```

2. 좌표가 유효한지 확인:
   ```typescript
   if (x < 0 || x >= worldMap.width || y < 0 || y >= worldMap.height) {
     console.warn('Coordinates out of bounds');
   }
   ```

3. 해당 좌표에 실제로 semantic 정보가 있는지 CSV 파일 확인

---

#### ❌ getAddressCoordinates가 빈 Set 반환

**원인:** 주소 형식이 잘못되었거나 해당 주소가 존재하지 않습니다.

**해결 방법:**
1. 주소 형식 확인:
   - 섹터: `"world:sector"`
   - 아레나: `"world:sector:arena"`
   - 오브젝트: `"world:sector:arena:object"`
   - 스폰: `"<spawn_loc>location_name"`

2. 대소문자와 공백이 정확한지 확인 (CSV 파일과 일치해야 함)

3. 맵 변환 시 출력된 주소 목록 확인:
   ```
   Sample addresses:
     • the Ville:Giorgio Rossi's apartment (98 tiles)
     • the Ville:Giorgio Rossi's apartment:kitchen (22 tiles)
   ```

4. 디버깅 코드로 사용 가능한 주소 확인:
   ```typescript
   if (worldMap.semanticMap) {
     const allAddresses = worldMap.semanticMap.addressTiles;
     for (const [address, coords] of allAddresses) {
       console.log(`"${address}" -> ${coords.size} tiles`);
     }
   }
   ```

---

#### 💡 Semantic Map 비활성화

Semantic map이 필요 없는 경우 비활성화할 수 있습니다:

`data/convertTiledMap.ts`에서:
```typescript
const serializedMap = convertTiledMapToAITown(
  tiledMap,
  mapName,
  assetsUrlPrefix,
  layerFilter,
  false // enableSemanticMap을 false로 설정
);
```

또는 맵 변환 스크립트 수정:
```typescript
// scripts/convertMap.ts
const serializedMap = convertTiledMapToAITown(
  tiledMap,
  mapName,
  assetsUrlPrefix,
  layerFilter,
  false // 여기를 false로
);
```

---

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
