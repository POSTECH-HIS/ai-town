"use node";

/**
 * Semantic Map Parser (CSV-based)
 * Parses generative_agents CSV files to build a SemanticMap equivalent to maze.py
 */

import type { SerializedSemanticMap, TileSemantics } from '../convex/aiTown/semanticMap';
import { readCsvFile, parse1DArrayTo2D, buildTileIdMap } from './csvUtils';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Paths to CSV files (relative to project root)
 */
interface SemanticCsvPaths {
  mazePath: string; // Directory containing maze CSVs
  blocksPath: string; // Directory containing blocks CSVs
}

/**
 * Parse semantic map from generative_agents CSV files
 * Equivalent to maze.py's __init__() method
 *
 * @param width - Map width in tiles
 * @param height - Map height in tiles
 * @param csvPaths - Paths to CSV directories
 * @param worldName - Default world name (default: "the_ville")
 * @returns SerializedSemanticMap ready for use
 *
 * Expected CSV structure:
 * - maze/sector_maze.csv: 1D array of tile IDs
 * - maze/arena_maze.csv: 1D array of tile IDs
 * - maze/game_object_maze.csv: 1D array of tile IDs
 * - maze/spawning_location_maze.csv: 1D array of tile IDs
 * - special_blocks/sector_blocks.csv: tile_id, world, sector
 * - special_blocks/arena_blocks.csv: tile_id, world, sector, arena
 * - special_blocks/game_object_blocks.csv: tile_id, world, sector/all, object
 * - special_blocks/spawning_location_blocks.csv: tile_id, spawning_location
 */
export function parseSemanticMapFromCSV(
  width: number,
  height: number,
  csvPaths: SemanticCsvPaths,
  worldName: string = 'the_ville'
): SerializedSemanticMap {
  const { mazePath, blocksPath } = csvPaths;

  console.log(`[SemanticMapParser] Parsing CSV files from ${mazePath} and ${blocksPath}`);

  // ============================================================
  // STEP 1: Read maze layout CSVs (1D arrays of tile IDs)
  // ============================================================

  console.log(`[SemanticMapParser] Reading maze layout CSVs...`);

  const sectorMazeRaw = readCsvFile(path.join(mazePath, 'sector_maze.csv'))[0];
  const arenaMazeRaw = readCsvFile(path.join(mazePath, 'arena_maze.csv'))[0];
  const gameObjectMazeRaw = readCsvFile(path.join(mazePath, 'game_object_maze.csv'))[0];
  const spawningMazeRaw = readCsvFile(path.join(mazePath, 'spawning_location_maze.csv'))[0];

  // Convert 1D arrays to 2D
  const sectorMaze = parse1DArrayTo2D(sectorMazeRaw, width, height);
  const arenaMaze = parse1DArrayTo2D(arenaMazeRaw, width, height);
  const gameObjectMaze = parse1DArrayTo2D(gameObjectMazeRaw, width, height);
  const spawningMaze = parse1DArrayTo2D(spawningMazeRaw, width, height);

  console.log(`[SemanticMapParser] Converted ${width}x${height} maze layouts to 2D arrays`);

  // ============================================================
  // STEP 2: Read block definition CSVs (tile ID -> semantic meaning)
  // ============================================================

  console.log(`[SemanticMapParser] Reading block definition CSVs...`);

  const worldBlocksRaw = readCsvFile(path.join(blocksPath, 'world_blocks.csv'));
  const sectorBlocksRaw = readCsvFile(path.join(blocksPath, 'sector_blocks.csv'));
  const arenaBlocksRaw = readCsvFile(path.join(blocksPath, 'arena_blocks.csv'));
  const gameObjectBlocksRaw = readCsvFile(path.join(blocksPath, 'game_object_blocks.csv'));
  const spawningBlocksRaw = readCsvFile(path.join(blocksPath, 'spawning_location_blocks.csv'));

  // Build lookup maps: tile ID -> semantic data
  const worldBlocksMap = buildTileIdMap(worldBlocksRaw);
  const sectorBlocksMap = buildTileIdMap(sectorBlocksRaw);
  const arenaBlocksMap = buildTileIdMap(arenaBlocksRaw);
  const gameObjectBlocksMap = buildTileIdMap(gameObjectBlocksRaw);
  const spawningBlocksMap = buildTileIdMap(spawningBlocksRaw);

  console.log(`[SemanticMapParser] Built block definition maps`);
  console.log(`  - ${sectorBlocksMap.size} sector blocks`);
  console.log(`  - ${arenaBlocksMap.size} arena blocks`);
  console.log(`  - ${gameObjectBlocksMap.size} game object blocks`);
  console.log(`  - ${spawningBlocksMap.size} spawning location blocks`);

  // Get default world name from world_blocks (usually just one entry)
  const defaultWorld =
    worldBlocksMap.size > 0 ? Array.from(worldBlocksMap.values())[0][0] : worldName;

  // ============================================================
  // STEP 3: Build tiles[][] 2D array
  // Equivalent to maze.py's self.tiles
  // ============================================================

  console.log(`[SemanticMapParser] Building tiles[][] array...`);

  const tiles: TileSemantics[][] = [];
  const addressTilesMap = new Map<string, Set<{ x: number; y: number }>>();

  for (let y = 0; y < height; y++) {
    const row: TileSemantics[] = [];

    for (let x = 0; x < width; x++) {
      // Get tile IDs from each maze layer
      const sectorTileId = sectorMaze[y][x];
      const arenaTileId = arenaMaze[y][x];
      const gameObjectTileId = gameObjectMaze[y][x];
      const spawningTileId = spawningMaze[y][x];

      // Look up semantic data for each tile ID
      const sectorData = sectorBlocksMap.get(sectorTileId);
      const arenaData = arenaBlocksMap.get(arenaTileId);
      const gameObjectData = gameObjectBlocksMap.get(gameObjectTileId);
      const spawningData = spawningBlocksMap.get(spawningTileId);

      // Build tile semantics
      // Format from CSV:
      // - sector: [world, sector]
      // - arena: [world, sector, arena]
      // - game_object: [world, sector/all, object]
      // - spawning: [spawning_location]

      const tileSemantics: TileSemantics = {
        world: defaultWorld,
        sector: sectorData ? sectorData[1] || '' : '',
        arena: arenaData ? arenaData[2] || '' : '',
        game_object: gameObjectData ? gameObjectData[2] || '' : '',
        spawning_location: spawningData ? spawningData[0] || '' : '',
      };

      row.push(tileSemantics);

      // ============================================================
      // STEP 4: Build addressTiles reverse lookup
      // Equivalent to maze.py's self.address_tiles
      // ============================================================

      const addresses: string[] = [];

      // Sector address: "world:sector"
      if (tileSemantics.sector) {
        addresses.push(`${tileSemantics.world}:${tileSemantics.sector}`);
      }

      // Arena address: "world:sector:arena"
      if (tileSemantics.arena) {
        addresses.push(
          `${tileSemantics.world}:${tileSemantics.sector}:${tileSemantics.arena}`
        );
      }

      // Game object address: "world:sector:arena:object"
      if (tileSemantics.game_object) {
        addresses.push(
          `${tileSemantics.world}:${tileSemantics.sector}:${tileSemantics.arena}:${tileSemantics.game_object}`
        );
      }

      // Spawning location address: "<spawn_loc>location_name"
      if (tileSemantics.spawning_location) {
        addresses.push(`<spawn_loc>${tileSemantics.spawning_location}`);
      }

      // Add coordinates to each address
      for (const address of addresses) {
        if (!addressTilesMap.has(address)) {
          addressTilesMap.set(address, new Set());
        }
        addressTilesMap.get(address)!.add({ x, y });
      }
    }

    tiles.push(row);
  }

  console.log(`[SemanticMapParser] Built ${height}x${width} tiles array`);

  // ============================================================
  // STEP 5: Convert to serializable format
  // ============================================================

  const addressTiles = Array.from(addressTilesMap.entries()).map(([address, coordSet]) => ({
    address,
    coordinates: Array.from(coordSet),
  }));

  console.log(`[SemanticMapParser] Built ${addressTiles.length} address entries`);
  console.log(`[SemanticMapParser] ✓ Semantic map parsing complete`);

  return { tiles, addressTiles };
}

/**
 * Helper: Get standard CSV paths for a map
 * @param mapName - Name of the map (e.g., "the_ville")
 * @param baseDir - Base directory (default: project root)
 */
export function getStandardCsvPaths(
  mapName: string,
  baseDir: string = process.cwd()
): SemanticCsvPaths {
  const matrixPath = path.join(
    baseDir,
    'environment',
    'frontend_server',
    'static_dirs',
    'assets',
    mapName,
    'matrix'
  );

  return {
    mazePath: path.join(matrixPath, 'maze'),
    blocksPath: path.join(matrixPath, 'special_blocks'),
  };
}
