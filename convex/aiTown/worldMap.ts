import { Infer, ObjectType, v } from 'convex/values';
import { SemanticMap, serializedSemanticMap } from './semanticMap';

// `layer[position.x][position.y]` is the tileIndex or -1 if empty.
const tileLayer = v.array(v.array(v.number()));
export type TileLayer = Infer<typeof tileLayer>;

const animatedSprite = {
  x: v.number(),
  y: v.number(),
  w: v.number(),
  h: v.number(),
  layer: v.number(),
  sheet: v.string(),
  animation: v.string(),
};
export type AnimatedSprite = ObjectType<typeof animatedSprite>;

// Tileset definition for multi-tileset support
const tileset = {
  name: v.string(),
  firstgid: v.number(), // First global ID for this tileset
  tileWidth: v.number(),
  tileHeight: v.number(),
  imageUrl: v.string(),
  imageWidth: v.number(),
  imageHeight: v.number(),
  tileCount: v.number(),
  columns: v.number(),
};
export type Tileset = ObjectType<typeof tileset>;

export const serializedWorldMap = {
  width: v.number(),
  height: v.number(),

  // Legacy single tileset support (for backwards compatibility)
  tileSetUrl: v.optional(v.string()),
  tileSetDimX: v.optional(v.number()),
  tileSetDimY: v.optional(v.number()),

  // New multi-tileset support
  tilesets: v.optional(v.array(v.object(tileset))),

  // Tile size in pixels (assume square)
  tileDim: v.number(),
  mapName: v.string(), // Reference to map in AVAILABLE_MAPS
  bgTiles: v.optional(v.array(v.array(v.array(v.number())))),
  objectTiles: v.optional(v.array(tileLayer)),
  animatedSprites: v.optional(v.array(v.object(animatedSprite))),

  // Exterior ground layer for spawn locations
  exteriorGroundLayer: v.optional(tileLayer),

  // Semantic map data (from generative_agents CSV files)
  // Provides hierarchical world/sector/arena/object information
  semanticMap: v.optional(v.object(serializedSemanticMap)),
};
export type SerializedWorldMap = ObjectType<typeof serializedWorldMap>;

export class WorldMap {
  width: number;
  height: number;

  // Legacy single tileset
  tileSetUrl?: string;
  tileSetDimX?: number;
  tileSetDimY?: number;

  // New multi-tileset support
  tilesets?: Tileset[];

  tileDim: number;
  mapName: string;

  bgTiles: TileLayer[];
  objectTiles: TileLayer[];
  animatedSprites: AnimatedSprite[];
  exteriorGroundLayer?: TileLayer;
  semanticMap?: SemanticMap;

  constructor(serialized: SerializedWorldMap) {
    this.width = serialized.width;
    this.height = serialized.height;
    this.tileSetUrl = serialized.tileSetUrl;
    this.tileSetDimX = serialized.tileSetDimX;
    this.tileSetDimY = serialized.tileSetDimY;
    this.tilesets = serialized.tilesets;
    this.tileDim = serialized.tileDim;
    this.mapName = serialized.mapName;
    this.bgTiles = serialized.bgTiles || [];
    this.objectTiles = serialized.objectTiles || [];
    this.animatedSprites = serialized.animatedSprites || [];
    this.exteriorGroundLayer = serialized.exteriorGroundLayer;

    // Initialize semantic map if available
    if (serialized.semanticMap) {
      this.semanticMap = new SemanticMap(
        serialized.semanticMap,
        serialized.width,
        serialized.height
      );
    }
  }

  serialize(): SerializedWorldMap {
    return {
      width: this.width,
      height: this.height,
      tileSetUrl: this.tileSetUrl,
      tileSetDimX: this.tileSetDimX,
      tileSetDimY: this.tileSetDimY,
      tilesets: this.tilesets,
      tileDim: this.tileDim,
      mapName: this.mapName,
      bgTiles: this.bgTiles,
      objectTiles: this.objectTiles,
      animatedSprites: this.animatedSprites,
      exteriorGroundLayer: this.exteriorGroundLayer,
      semanticMap: this.semanticMap?.serialize(),
    };
  }

  /**
   * Check if a position has an exterior ground tile
   * Returns true if the exterior ground layer has a non-empty tile at this position
   */
  hasExteriorGround(x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return false;
    }

    // If no exterior ground layer, fall back to checking any ground
    if (!this.exteriorGroundLayer) {
      return this.hasAnyGround(x, y);
    }

    const floorX = Math.floor(x);
    const floorY = Math.floor(y);

    // Check if exterior ground layer has a tile here
    const layer = this.exteriorGroundLayer;
    return layer[floorX] && layer[floorX][floorY] !== undefined && layer[floorX][floorY] !== -1;
  }

  /**
   * Check if a position has any ground tiles
   * Returns true if any background layer has a non-empty tile at this position
   */
  private hasAnyGround(x: number, y: number): boolean {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);

    // Check if any background layer has a tile here
    for (const layer of this.bgTiles) {
      if (layer[floorX] && layer[floorX][floorY] !== undefined && layer[floorX][floorY] !== -1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get semantic information for a tile position
   * Convenience method for accessing semantic map data
   *
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns TileSemantics object if semantic map is available, undefined otherwise
   *
   * Example:
   * ```
   * const semantics = worldMap.getTileSemantics(58, 9);
   * if (semantics) {
   *   console.log(semantics.arena); // "bedroom 2"
   *   console.log(semantics.game_object); // "bed"
   * }
   * ```
   */
  getTileSemantics(x: number, y: number) {
    if (!this.semanticMap) {
      return undefined;
    }
    try {
      return this.semanticMap.accessTile({ x, y });
    } catch (error) {
      console.warn(`Failed to get tile semantics at (${x}, ${y}):`, error);
      return undefined;
    }
  }

  /**
   * Get all coordinates for a semantic address
   * Convenience method for accessing semantic map data
   *
   * @param address - Hierarchical address (e.g., "the_ville:kitchen:stove")
   * @returns Set of coordinates if semantic map is available, empty set otherwise
   *
   * Example:
   * ```
   * const kitchenTiles = worldMap.getAddressCoordinates('the_ville:kitchen');
   * for (const coord of kitchenTiles) {
   *   console.log(`Kitchen at (${coord.x}, ${coord.y})`);
   * }
   * ```
   */
  getAddressCoordinates(address: string) {
    if (!this.semanticMap) {
      return new Set();
    }
    return this.semanticMap.getTilesForAddress(address);
  }
}
