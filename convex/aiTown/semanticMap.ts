import { Infer, ObjectType, v } from 'convex/values';
import { Point } from '../util/types';

/**
 * Tile semantic information - equivalent to maze.py's tile_details
 * Describes what a specific tile represents in the game world
 */
export const tileSemantics = v.object({
  world: v.string(),
  sector: v.string(),
  arena: v.string(),
  game_object: v.string(),
  spawning_location: v.string(),
  // collision is handled separately by WorldMap.objectTiles
});
export type TileSemantics = Infer<typeof tileSemantics>;

/**
 * Serialized version for storage
 * Equivalent to maze.py's Maze class with tiles[][] and address_tiles{}
 */
export const serializedSemanticMap = {
  // 2D array: tiles[y][x] = TileSemantics
  // Equivalent to maze.py: self.tiles[y][x]
  tiles: v.array(v.array(tileSemantics)),

  // Reverse lookup: address -> set of coordinates
  // Stored as array of entries for Convex compatibility
  // Equivalent to maze.py: self.address_tiles
  addressTiles: v.array(
    v.object({
      address: v.string(),
      coordinates: v.array(v.object({ x: v.number(), y: v.number() })),
    })
  ),
};
export type SerializedSemanticMap = ObjectType<typeof serializedSemanticMap>;

/**
 * SemanticMap class - equivalent to maze.py's Maze class
 * Provides semantic understanding of the world map beyond just collision
 *
 * Usage Examples:
 * ```
 * // Get what's at a specific location
 * const tile = semanticMap.accessTile({ x: 58, y: 9 });
 * console.log(tile.arena); // "bedroom 2"
 * console.log(tile.game_object); // "bed"
 *
 * // Get full hierarchical path
 * const path = semanticMap.getTilePath({ x: 58, y: 9 }, 'game_object');
 * console.log(path); // "the_ville:double studio:bedroom 2:bed"
 *
 * // Find all tiles for a location
 * const tiles = semanticMap.getTilesForAddress('the_ville:kitchen');
 * tiles.forEach(coord => console.log(`Kitchen at (${coord.x}, ${coord.y})`));
 * ```
 */
export class SemanticMap {
  // tiles[y][x] -> semantic info
  // Equivalent to maze.py: self.tiles[y][x]
  tiles: TileSemantics[][];

  // address -> coordinates lookup
  // Equivalent to maze.py: self.address_tiles
  // e.g., "the_ville:double studio:bedroom 2:bed" -> [{x: 58, y: 9}, ...]
  addressTiles: Map<string, Set<Point>>;

  width: number;
  height: number;

  constructor(serialized: SerializedSemanticMap, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = serialized.tiles;

    // Reconstruct addressTiles Map from serialized array
    this.addressTiles = new Map();
    for (const entry of serialized.addressTiles) {
      this.addressTiles.set(
        entry.address,
        new Set(entry.coordinates.map((c) => ({ x: c.x, y: c.y })))
      );
    }
  }

  /**
   * Get semantic information for a tile
   * Equivalent to maze.py's access_tile()
   *
   * @param point - Tile coordinates (x, y)
   * @returns TileSemantics object with world, sector, arena, game_object, spawning_location
   * @throws Error if coordinates are out of bounds
   *
   * Example:
   * ```
   * const tile = semanticMap.accessTile({ x: 58, y: 9 });
   * console.log(tile); // { world: 'the_ville', sector: 'double studio', arena: 'bedroom 2', ... }
   * ```
   */
  accessTile(point: Point): TileSemantics {
    if (point.x < 0 || point.x >= this.width || point.y < 0 || point.y >= this.height) {
      throw new Error(`Tile coordinates out of bounds: (${point.x}, ${point.y})`);
    }
    return this.tiles[point.y][point.x];
  }

  /**
   * Get the hierarchical path for a tile
   * Equivalent to maze.py's get_tile_path()
   *
   * @param point - Tile coordinates
   * @param level - 'world' | 'sector' | 'arena' | 'game_object'
   * @returns Address string (e.g., "the_ville:double studio:bedroom 2")
   *
   * Examples:
   * ```
   * getTilePath({x: 58, y: 9}, 'world')       // "the_ville"
   * getTilePath({x: 58, y: 9}, 'sector')      // "the_ville:double studio"
   * getTilePath({x: 58, y: 9}, 'arena')       // "the_ville:double studio:bedroom 2"
   * getTilePath({x: 58, y: 9}, 'game_object') // "the_ville:double studio:bedroom 2:bed"
   * ```
   */
  getTilePath(point: Point, level: 'world' | 'sector' | 'arena' | 'game_object'): string {
    const tile = this.accessTile(point);

    let path = tile.world;
    if (level === 'world') return path;

    if (tile.sector) {
      path += `:${tile.sector}`;
    }
    if (level === 'sector') return path;

    if (tile.arena) {
      path += `:${tile.arena}`;
    }
    if (level === 'arena') return path;

    if (tile.game_object) {
      path += `:${tile.game_object}`;
    }
    return path;
  }

  /**
   * Get all tiles that belong to a given address
   * Equivalent to using maze.py's address_tiles dictionary
   *
   * @param address - Hierarchical address (e.g., "the_ville:kitchen" or "the_ville:kitchen:stove")
   * @returns Set of coordinates where this address applies
   *
   * Examples:
   * ```
   * // Get all tiles in kitchen
   * const kitchenTiles = semanticMap.getTilesForAddress('the_ville:kitchen');
   *
   * // Get all tiles with stove
   * const stoveTiles = semanticMap.getTilesForAddress('the_ville:kitchen:stove');
   *
   * // Get spawn location
   * const spawn = semanticMap.getTilesForAddress('<spawn_loc>bedroom-2-a');
   * ```
   */
  getTilesForAddress(address: string): Set<Point> {
    return this.addressTiles.get(address) || new Set();
  }

  /**
   * Find all tiles with a specific game object
   * @param objectName - e.g., "bed", "stove", "desk"
   * @returns Array of coordinates
   */
  findGameObject(objectName: string): Point[] {
    const results: Point[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].game_object === objectName) {
          results.push({ x, y });
        }
      }
    }
    return results;
  }

  /**
   * Find all tiles in a specific arena
   * @param arenaName - e.g., "bedroom 2", "kitchen"
   * @returns Array of coordinates
   */
  findArena(arenaName: string): Point[] {
    const results: Point[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x].arena === arenaName) {
          results.push({ x, y });
        }
      }
    }
    return results;
  }

  /**
   * Get nearby tiles within a radius
   * Equivalent to maze.py's get_nearby_tiles()
   *
   * @param point - Center point
   * @param radius - Vision radius (square boundary)
   * @returns Array of tile coordinates within radius
   *
   * Example:
   * ```
   * // Get all tiles within 3 tiles of player
   * const nearby = semanticMap.getNearbyTiles(player.position, 3);
   * ```
   */
  getNearbyTiles(point: Point, radius: number): Point[] {
    const nearby: Point[] = [];

    const leftEnd = Math.max(0, point.x - radius);
    const rightEnd = Math.min(this.width - 1, point.x + radius);
    const topEnd = Math.max(0, point.y - radius);
    const bottomEnd = Math.min(this.height - 1, point.y + radius);

    for (let x = leftEnd; x <= rightEnd; x++) {
      for (let y = topEnd; y <= bottomEnd; y++) {
        nearby.push({ x, y });
      }
    }

    return nearby;
  }

  /**
   * Serialize for storage
   */
  serialize(): SerializedSemanticMap {
    const addressTilesArray = Array.from(this.addressTiles.entries()).map(
      ([address, coordSet]) => ({
        address,
        coordinates: Array.from(coordSet),
      })
    );

    return {
      tiles: this.tiles,
      addressTiles: addressTilesArray,
    };
  }
}
