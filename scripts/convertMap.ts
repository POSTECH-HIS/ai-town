#!/usr/bin/env node
/**
 * Build-time map converter
 * Converts Tiled JSON maps to TypeScript modules for AI Town
 *
 * Usage:
 *   npm run convert-map <json-path> [layer-filter...]
 *
 * Examples:
 *   npm run convert-map public/assets/the_ville/map.json
 *   npm run convert-map public/assets/the_ville/map.json "Ground" "Building" "Wall"
 */

import * as fs from 'fs';
import * as path from 'path';

// Get arguments
const jsonPathArg = process.argv[2];
const layerFilterArgs = process.argv.slice(3);

if (!jsonPathArg) {
  console.error('Usage: npm run convert-map <json-path> [layer-filter...]');
  console.error('');
  console.error('Examples:');
  console.error('  npm run convert-map public/assets/the_ville/map.json');
  console.error('  npm run convert-map public/assets/my_map/map.json "Ground" "Buildings"');
  process.exit(1);
}

const jsonPath = path.resolve(process.cwd(), jsonPathArg);
const layerFilter = layerFilterArgs.length > 0 ? layerFilterArgs : undefined;

console.log(`Converting map from: ${jsonPath}`);
if (layerFilter) {
  console.log(`Layer filter: ${layerFilter.join(', ')}`);
}

// Load Tiled JSON
if (!fs.existsSync(jsonPath)) {
  console.error(`Error: File not found: ${jsonPath}`);
  process.exit(1);
}

const tiledMapContent = fs.readFileSync(jsonPath, 'utf-8');
const tiledMap = JSON.parse(tiledMapContent);

// Detect map name from path
const mapName = path.basename(path.dirname(jsonPath));
const assetsUrlPrefix = '/ai-town/assets/';

console.log(`Map name: ${mapName}`);

// Import conversion functions
// Note: We'll inline the conversion logic to avoid module loading issues

// Convert layer to 2D array (preserving flip flags)
function convertLayerTo2D(layerData: number[], width: number, height: number): number[][] {
  const result: number[][] = [];

  // Tiled flip flags (bits 29-31) - we preserve these for rendering
  const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
  const FLIPPED_VERTICALLY_FLAG = 0x40000000;
  const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
  const ALL_FLIP_FLAGS = FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG;

  for (let x = 0; x < width; x++) {
    result[x] = [];
    for (let y = 0; y < height; y++) {
      const rawTileId = layerData[y * width + x];

      // Extract tile ID without flip flags
      const tileId = rawTileId & ~ALL_FLIP_FLAGS;

      // Preserve flip flags for rendering, convert empty (0) to -1
      if (tileId === 0) {
        result[x][y] = -1;
      } else {
        // Keep the original value with flip flags
        result[x][y] = rawTileId;
      }
    }
  }
  return result;
}

// Filter visible layers
function getVisibleLayers(layers: any[], filterNames?: string[]) {
  return layers.filter((layer: any) => {
    if (layer.type !== 'tilelayer') return false;
    if (!layer.visible) return false;
    if (!layer.data || layer.data.length === 0) return false;

    const name = layer.name.toLowerCase();
    if (name.includes('collision') || name.includes('block') || name.includes('spawn')) {
      return false;
    }

    if (filterNames && filterNames.length > 0) {
      return filterNames.some(pattern =>
        name.includes(pattern.toLowerCase())
      );
    }

    return true;
  });
}

// Categorize layers
function categorizeLayers(layers: any[]) {
  const bgLayers: any[] = [];
  const objectLayers: any[] = [];

  for (const layer of layers) {
    const name = layer.name.toLowerCase();
    if (name.includes('ground') || name.includes('bottom') || name.includes('floor')) {
      bgLayers.push(layer);
    } else {
      objectLayers.push(layer);
    }
  }

  return { bgLayers, objectLayers };
}

// Get collision layers
// Only Collisions layer is impassable
function getCollisionLayers(layers: any[]) {
  return layers.filter((layer: any) => {
    if (layer.type !== 'tilelayer') return false;
    if (!layer.data || layer.data.length === 0) return false;

    const name = layer.name.toLowerCase();
    // Only Collisions layer blocks movement
    return name === 'collisions';
  });
}

// Get exterior ground layer for spawn locations
function getExteriorGroundLayer(layers: any[]) {
  return layers.find((layer: any) => {
    if (layer.type !== 'tilelayer') return false;
    if (!layer.data || layer.data.length === 0) return false;

    const name = layer.name.toLowerCase();
    return name === 'exterior ground';
  });
}

// Convert the map
const visibleLayers = getVisibleLayers(tiledMap.layers, layerFilter);
console.log(`Found ${visibleLayers.length} visible layers (will be rendered)`);

// Get collision layers separately (not rendered, only for collision detection)
const collisionLayers = getCollisionLayers(tiledMap.layers);
console.log(`Collision layers: ${collisionLayers.length} (not rendered, collision detection only)`);

// Get exterior ground layer for spawn locations
const exteriorGroundLayer = getExteriorGroundLayer(tiledMap.layers);
const exteriorGroundTiles = exteriorGroundLayer
  ? convertLayerTo2D(exteriorGroundLayer.data, tiledMap.width, tiledMap.height)
  : undefined;

if (exteriorGroundTiles) {
  console.log('✓ Found Exterior Ground layer for spawn locations');
} else {
  console.warn('⚠ No Exterior Ground layer found. Spawn will use any ground tiles.');
}

// Convert tilesets
const tilesets = tiledMap.tilesets.map((ts: any) => {
  let imagePath = ts.image.replace(/^\.\.\//, '').replace(/^\.\//, '');
  return {
    name: ts.name,
    firstgid: ts.firstgid,
    tileWidth: ts.tilewidth,
    tileHeight: ts.tileheight,
    imageUrl: `${assetsUrlPrefix}${imagePath}`,
    imageWidth: ts.imagewidth,
    imageHeight: ts.imageheight,
    tileCount: ts.tilecount,
    columns: ts.columns,
  };
});

// Convert all visible layers to bgTiles (for rendering)
const bgTiles = visibleLayers.map(layer =>
  convertLayerTo2D(layer.data, tiledMap.width, tiledMap.height)
);

// Convert collision layers (for collision detection only, not rendered)
const collisionTiles = collisionLayers.map(layer =>
  convertLayerTo2D(layer.data, tiledMap.width, tiledMap.height)
);

// Use collision layers for movement blocking if available
const finalObjectTiles = collisionTiles.length > 0 ? collisionTiles : [];
if (collisionTiles.length > 0) {
  console.log(`✓ Using ${collisionTiles.length} collision layer(s) for movement blocking (not rendered)`);
} else {
  console.warn('⚠ No collision layers found! Movement will not be blocked.');
  console.warn('  Add a "Collision" layer in Tiled for proper collision detection.');
}

// Generate TypeScript module
const output = `// Generated map
// DO NOT EDIT THIS FILE MANUALLY
// Generated by: npm run convert-map ${jsonPathArg}
// Source: ${jsonPath}

import type { SerializedWorldMap } from '../../convex/aiTown/worldMap';

export const mapData: SerializedWorldMap = {
  width: ${tiledMap.width},
  height: ${tiledMap.height},
  tileDim: ${tiledMap.tilewidth},
  mapName: '${mapName}',
  tilesets: ${JSON.stringify(tilesets, null, 2)},
  bgTiles: ${JSON.stringify(bgTiles)},
  objectTiles: ${JSON.stringify(finalObjectTiles)},
  animatedSprites: [],
  exteriorGroundLayer: ${JSON.stringify(exteriorGroundTiles)},
};

export default mapData;
`;

// Write output file
const outputPath = path.resolve(process.cwd(), `data/maps/${mapName}.ts`);
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`✓ Map converted successfully!`);
console.log(`  Output: ${outputPath}`);
console.log(`  Size: ${tiledMap.width}x${tiledMap.height}`);
console.log(`  Tilesets: ${tilesets.length}`);
console.log(`  Rendered Layers: ${bgTiles.length}`);
console.log(`  Collision Layers: ${collisionTiles.length}`);
console.log(``);
console.log(`Next steps:`);
console.log(`1. Import in data/mapConfig.ts:`);
console.log(`   import { mapData as ${mapName}Map } from './maps/${mapName}';`);
console.log(``);
console.log(`2. Add to AVAILABLE_MAPS:`);
console.log(`   ${mapName}: {`);
console.log(`     name: 'Your Map Name',`);
console.log(`     data: ${mapName}Map,`);
console.log(`   },`);
