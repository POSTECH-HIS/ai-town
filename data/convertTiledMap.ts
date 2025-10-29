"use node";

/**
 * Convert Tiled JSON to AI Town format
 *
 * This utility converts a Tiled JSON map file into the format expected by
 * the AI Town engine, with support for multiple tilesets.
 */

import type { SerializedWorldMap, Tileset as AITownTileset } from '../convex/aiTown/worldMap';
import type { TiledMap, TiledTileset, TiledLayer } from './tiledMapLoader';
import { convertLayerTo2D, getVisibleTileLayers } from './tiledMapLoader';

/**
 * Convert a Tiled tileset to AI Town tileset format
 */
function convertTileset(
  tiledTileset: TiledTileset,
  assetsUrlPrefix: string
): AITownTileset {
  // Clean up image path
  let imagePath = tiledTileset.image.replace(/^\.\.\//, '').replace(/^\.\//, '');

  return {
    name: tiledTileset.name,
    firstgid: tiledTileset.firstgid,
    tileWidth: tiledTileset.tilewidth,
    tileHeight: tiledTileset.tileheight,
    imageUrl: `${assetsUrlPrefix}${imagePath}`,
    imageWidth: tiledTileset.imagewidth,
    imageHeight: tiledTileset.imageheight,
    tileCount: tiledTileset.tilecount,
    columns: tiledTileset.columns,
  };
}

/**
 * Separate layers into background and object layers
 * Background layers are typically ground/floor tiles
 * Object layers are walls, furniture, decorations, etc.
 */
function categorizeLayers(layers: TiledLayer[]): {
  bgLayers: TiledLayer[];
  objectLayers: TiledLayer[];
} {
  const bgLayers: TiledLayer[] = [];
  const objectLayers: TiledLayer[] = [];

  for (const layer of layers) {
    const name = layer.name.toLowerCase();

    // Background layers (rendered first)
    if (
      name.includes('ground') ||
      name.includes('bottom') ||
      name.includes('floor')
    ) {
      bgLayers.push(layer);
    }
    // Object layers (rendered on top)
    else {
      objectLayers.push(layer);
    }
  }

  return { bgLayers, objectLayers };
}

/**
 * Get collision layers from the map
 * These layers define where players/agents can and cannot walk
 */
function getCollisionLayers(layers: TiledLayer[]): TiledLayer[] {
  return layers.filter(layer => {
    if (layer.type !== 'tilelayer') return false;
    if (!layer.data || layer.data.length === 0) return false;

    const name = layer.name.toLowerCase();
    // Include layers that define collision/walkability
    return name.includes('collision') ||
           name.includes('object interaction');
  });
}

/**
 * Convert a Tiled JSON map to AI Town SerializedWorldMap format
 *
 * @param tiledMap - Parsed Tiled JSON map
 * @param mapName - Name identifier for this map
 * @param assetsUrlPrefix - URL prefix for tileset images
 * @param layerFilter - Optional array of layer name patterns to include
 * @returns SerializedWorldMap ready to be stored or used
 */
export function convertTiledMapToAITown(
  tiledMap: TiledMap,
  mapName: string,
  assetsUrlPrefix: string,
  layerFilter?: string[]
): SerializedWorldMap {
  // Convert tilesets
  const tilesets = tiledMap.tilesets.map(ts =>
    convertTileset(ts, assetsUrlPrefix)
  );

  // Filter and convert layers
  const visibleLayers = getVisibleTileLayers(tiledMap.layers, layerFilter);

  if (visibleLayers.length === 0) {
    throw new Error('No visible tile layers found in map!');
  }

  // Convert all visible layers to bgTiles (for rendering)
  // All visual layers should be rendered, so we put them all in bgTiles
  const bgTiles = visibleLayers.map(layer =>
    convertLayerTo2D(layer.data!, tiledMap.width, tiledMap.height)
  );

  // Get collision layers (for movement/pathfinding only, not rendering)
  const collisionLayers = getCollisionLayers(tiledMap.layers);
  const collisionTiles = collisionLayers.map(layer =>
    convertLayerTo2D(layer.data!, tiledMap.width, tiledMap.height)
  );

  // Determine objectTiles (used for collision detection, not rendering)
  let finalObjectTiles = collisionTiles;
  if (collisionTiles.length > 0) {
    console.log(`✓ Using ${collisionTiles.length} collision layer(s) for movement blocking (not rendered)`);
  } else {
    console.warn('⚠ No collision layers found!');
    console.warn('  Movement will not be blocked. Add a "Collision" layer in Tiled for proper collision detection.');
    // If no collision layers, use empty array (no collision)
    finalObjectTiles = [];
  }

  return {
    width: tiledMap.width,
    height: tiledMap.height,
    tileDim: tiledMap.tilewidth,
    mapName,
    tilesets,
    bgTiles,
    // Note: objectTiles is used for collision detection in movement.ts, not rendering
    objectTiles: finalObjectTiles,
    animatedSprites: [],
  };
}
