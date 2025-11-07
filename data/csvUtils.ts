"use node";

/**
 * CSV Parsing Utilities
 * Utilities for reading and parsing CSV files from generative_agents format
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Read and parse a CSV file
 * @param filePath - Absolute path to CSV file
 * @param hasHeader - Whether the first row is a header (default: false)
 * @returns Array of rows, where each row is an array of strings
 */
export function readCsvFile(filePath: string, hasHeader: boolean = false): string[][] {

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    // Skip header if present
    const dataLines = hasHeader ? lines.slice(1) : lines;

    // Parse each line
    const rows = dataLines.map((line: string) => {
      // Split by comma and trim whitespace
      return line.split(',').map((cell: string) => cell.trim());
    });

    return rows;
  } catch (error) {
    console.error(`Failed to read CSV file: ${filePath}`, error);
    throw error;
  }
}

/**
 * Parse a 1D tile array (single row CSV) into 2D array
 * Format: "0, 0, 32135, 32135, ..." (width * height values)
 * @param csvRow - Single row of comma-separated tile IDs
 * @param width - Map width
 * @param height - Map height
 * @returns 2D array where [y][x] is the tile ID at that position
 */
export function parse1DArrayTo2D(csvRow: string[], width: number, height: number): string[][] {
  // csvRow is already split by commas, just convert to 2D
  const tiles: string[][] = [];

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      row.push(csvRow[idx] || '0');
    }
    tiles.push(row);
  }

  return tiles;
}

/**
 * Build a dictionary mapping tile ID to semantic data
 * @param csvRows - Array of CSV rows
 * @returns Map from tile ID (string) to semantic data array
 */
export function buildTileIdMap(csvRows: string[][]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const row of csvRows) {
    if (row.length === 0) continue;

    const tileId = row[0]; // First column is tile ID
    const semanticData = row.slice(1); // Rest is semantic data

    map.set(tileId, semanticData);
  }

  return map;
}
