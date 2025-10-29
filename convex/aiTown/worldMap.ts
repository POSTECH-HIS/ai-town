import { Infer, ObjectType, v } from 'convex/values';

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
    };
  }
}
