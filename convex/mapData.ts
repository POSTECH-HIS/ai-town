/**
 * Map data accessor for Convex backend
 *
 * This file provides access to map data from within Convex functions.
 * The map data is used by the game simulation on the backend.
 */

import type { SerializedWorldMap } from './aiTown/worldMap';

// Import map configurations
import * as gentle from '../data/gentle';
import { mapData as theVilleMap } from '../data/maps/the_ville';
import { mapData as testMapMap } from '../data/maps/testMap';

/**
 * Get map data by map name
 */
export function getMapData(mapName: string): SerializedWorldMap | null {
  switch (mapName) {
    case 'gentle':
      return {
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

    case 'the_ville':
      return theVilleMap;

    case 'testMap':
      return testMapMap;

    default:
      return null;
  }
}
