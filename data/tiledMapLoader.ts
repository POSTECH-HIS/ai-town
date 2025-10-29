"use node";

/**
 * Tiled Map Loader
 * Loads Tiled JSON files directly without manual conversion
 * Supports multiple tilesets automatically
 */

export interface TiledTileset {
  firstgid: number;
  name: string;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
  image: string;
  imagewidth: number;
  imageheight: number;
  transparentcolor?: string;
}

export interface TiledLayer {
  id: number;
  name: string;
  type: 'tilelayer' | 'objectgroup' | 'group';
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  data?: number[]; // Tile indices (for tilelayer)
}

export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  infinite: boolean;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
  compressionlevel?: number;
  orientation?: string;
  renderorder?: string;
  tiledversion?: string;
  type?: string;
  version?: string;
}

/**
 * Convert 1D Tiled layer data to 2D array for game engine
 * @param layerData - Flat array of tile indices from Tiled
 * @param width - Map width in tiles
 * @param height - Map height in tiles
 * @returns 2D array where [x][y] is the tile index at that position (with flip flags preserved)
 *
 * Note: For multi-tileset maps, we preserve Tiled's global tile IDs AND flip flags.
 * Tiled uses 0 for empty tiles, and global IDs start from 1.
 * We convert 0 to -1 to indicate empty tiles.
 *
 * Tiled uses the upper bits of tile IDs for flip/rotation flags:
 * - Bit 31 (0x80000000): Horizontal flip
 * - Bit 30 (0x40000000): Vertical flip
 * - Bit 29 (0x20000000): Diagonal flip
 * We PRESERVE these flags for rendering.
 */
export function convertLayerTo2D(
  layerData: number[],
  width: number,
  height: number
): number[][] {
  const result: number[][] = [];

  // Tiled flip flags (bits 29-31) - we preserve these
  const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
  const FLIPPED_VERTICALLY_FLAG = 0x40000000;
  const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
  const ALL_FLIP_FLAGS = FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG;

  for (let x = 0; x < width; x++) {
    result[x] = [];
    for (let y = 0; y < height; y++) {
      // Tiled format: row-major order [y * width + x]
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

/**
 * Load and parse a Tiled JSON map file (Node.js version)
 * @param jsonPath - Path to the Tiled JSON file (relative to project root)
 * @returns Parsed Tiled map data
 */
export function loadTiledMapFromFile(jsonPath: string): TiledMap {
  // This is a synchronous Node.js-only function
  // It's used in the Convex backend during initialization
  const fs = require('fs');
  const path = require('path');

  // Try multiple possible paths
  const possiblePaths = [
    path.resolve(process.cwd(), jsonPath),
    path.resolve(process.cwd(), 'public', jsonPath.replace('/ai-town/assets/', '')),
    path.resolve(process.cwd(), jsonPath.replace('/ai-town/assets/', 'public/assets/')),
  ];

  for (const fullPath of possiblePaths) {
    try {
      const data = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Try next path
      continue;
    }
  }

  throw new Error(`Failed to load map from ${jsonPath}. Tried paths: ${possiblePaths.join(', ')}`);
}

/**
 * Load and parse a Tiled JSON map file (browser version)
 * @param jsonPath - URL path to the Tiled JSON file
 * @returns Parsed Tiled map data
 */
export async function loadTiledMap(jsonPath: string): Promise<TiledMap> {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Failed to load map: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Find which tileset a global tile ID belongs to
 * @param gid - Global tile ID from Tiled
 * @param tilesets - Array of tilesets sorted by firstgid
 * @returns {tilesetIndex, localTileId} or null if not found
 */
export function findTilesetForGid(
  gid: number,
  tilesets: TiledTileset[]
): { tilesetIndex: number; localTileId: number } | null {
  if (gid === 0) return null; // 0 means empty tile

  // Find the tileset where firstgid <= gid < (next tileset's firstgid)
  for (let i = tilesets.length - 1; i >= 0; i--) {
    if (gid >= tilesets[i].firstgid) {
      return {
        tilesetIndex: i,
        localTileId: gid - tilesets[i].firstgid,
      };
    }
  }

  return null;
}

/**
 * Get tileset image paths relative to public directory
 * @param tilesets - Array of Tiled tilesets
 * @param baseUrlPrefix - Prefix to add to image paths (e.g., '/ai-town/assets/')
 * @returns Array of image URLs
 */
export function getTilesetImageUrls(
  tilesets: TiledTileset[],
  baseUrlPrefix: string = '/ai-town/assets/'
): string[] {
  return tilesets.map(tileset => {
    // Clean up the path (remove leading ./ or ../)
    let imagePath = tileset.image.replace(/^\.\.\//, '').replace(/^\.\//, '');
    return `${baseUrlPrefix}${imagePath}`;
  });
}

/**
 * Extract only visible tile layers (excludes collision, block layers, etc.)
 * @param layers - All layers from Tiled map
 * @param includeLayerNames - Optional array of layer name patterns to include
 * @returns Filtered array of tile layers
 */
export function getVisibleTileLayers(
  layers: TiledLayer[],
  includeLayerNames?: string[]
): TiledLayer[] {
  return layers.filter(layer => {
    if (layer.type !== 'tilelayer') return false;
    if (!layer.visible) return false;
    if (!layer.data || layer.data.length === 0) return false;

    // Exclude collision and block layers by default
    const name = layer.name.toLowerCase();
    if (
      name.includes('collision') ||
      name.includes('block') ||
      name.includes('spawn')
    ) {
      return false;
    }

    // If specific layer names are provided, only include those
    if (includeLayerNames && includeLayerNames.length > 0) {
      return includeLayerNames.some(pattern =>
        layer.name.toLowerCase().includes(pattern.toLowerCase())
      );
    }

    return true;
  });
}
