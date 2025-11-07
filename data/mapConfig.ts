/**
 * Map Configuration
 *
 * This file defines available maps and allows easy switching between them.
 * To change the active map, simply update the DEFAULT_MAP constant.
 *
 * To add a new map:
 * 1. Export your map from Tiled as JSON
 * 2. Copy the JSON file to public/assets/
 * 3. Copy all tileset images to public/assets/map_assets/
 * 4. Run: npm run convert-map your_map_name
 * 5. Import the converted map below
 * 6. Update DEFAULT_MAP to use your new map
 */

import type { SerializedWorldMap } from '../convex/aiTown/worldMap';
import * as gentle from './gentle';
import { mapData as the_villeMap } from './maps/the_ville';

export interface MapConfig {
  /** Display name for this map */
  name: string;

  /** Map data (pre-converted from Tiled JSON) */
  data: SerializedWorldMap;

  /** Description of this map */
  description?: string;
}

// Convert legacy gentle map format to new format
const gentleMapData: SerializedWorldMap = {
  width: gentle.mapwidth,
  height: gentle.mapheight,
  tileDim: gentle.tiledim,
  mapName: 'gentle',
  tileSetUrl: gentle.tilesetpath,
  tileSetDimX: gentle.tilesetpxw,
  tileSetDimY: gentle.tilesetpxh,
  bgTiles: gentle.bgtiles,
  objectTiles: gentle.objmap,
  animatedSprites: gentle.animatedsprites,
};

/**
 * Available Maps
 * Add your maps here for easy switching
 */
export const AVAILABLE_MAPS: Record<string, MapConfig> = {
  // Original ai-town map (small, simple)
  gentle: {
    name: 'Gentle Valley',
    data: gentleMapData,
    description: 'Original ai-town map: 45x32 tiles, 1 tileset, 4 layers',
  },

  // Large generative_agents map
  the_ville: {
    name: 'The Ville',
    data: the_villeMap,
    description: 'Generative Agents map: 140x100 tiles, 18 tilesets, 17 layers',
  },

  test_Map: {
    name: 'test Map',
    data: the_villeMap,
    description: 'Just a test map using The Ville data',
  },

};

/**
 * Default Map
 * ⚠️ 맵을 변경하려면 data/activeMap.ts 파일을 수정하세요!
 */
import { ACTIVE_MAP_NAME } from './activeMap';
export const DEFAULT_MAP: MapConfig = AVAILABLE_MAPS[ACTIVE_MAP_NAME];

/**
 * Get the currently active map configuration
 */
export function getActiveMapConfig(): MapConfig {
  return DEFAULT_MAP;
}
