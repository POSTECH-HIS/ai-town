import { PixiComponent, applyDefaultProps } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { AnimatedSprite, WorldMap } from '../../convex/aiTown/worldMap';
import * as campfire from '../../data/animations/campfire.json';
import * as gentlesparkle from '../../data/animations/gentlesparkle.json';
import * as gentlewaterfall from '../../data/animations/gentlewaterfall.json';
import * as gentlesplash from '../../data/animations/gentlesplash.json';
import * as windmill from '../../data/animations/windmill.json';

const animations = {
  'campfire.json': { spritesheet: campfire, url: '/ai-town/assets/spritesheets/campfire.png' },
  'gentlesparkle.json': {
    spritesheet: gentlesparkle,
    url: '/ai-town/assets/spritesheets/gentlesparkle32.png',
  },
  'gentlewaterfall.json': {
    spritesheet: gentlewaterfall,
    url: '/ai-town/assets/spritesheets/gentlewaterfall32.png',
  },
  'windmill.json': { spritesheet: windmill, url: '/ai-town/assets/spritesheets/windmill.png' },
  'gentlesplash.json': { spritesheet: gentlesplash,
    url: '/ai-town/assets/spritesheets/gentlewaterfall32.png',},
};

export const PixiStaticMap = PixiComponent('StaticMap', {
  create: (props: { map: WorldMap; [k: string]: any }) => {
    const map = props.map;

    // Support both legacy single tileset and new multi-tileset
    let tileTextures: Map<number, PIXI.Texture> = new Map();

    if (map.tilesets && map.tilesets.length > 0) {
      // Multi-tileset support
      for (const tileset of map.tilesets) {
        const bt = PIXI.BaseTexture.from(tileset.imageUrl, {
          scaleMode: PIXI.SCALE_MODES.NEAREST,
        });

        const columns = tileset.columns;
        const rows = Math.ceil(tileset.tileCount / columns);

        // Create texture for each tile in this tileset
        for (let tileIndex = 0; tileIndex < tileset.tileCount; tileIndex++) {
          const col = tileIndex % columns;
          const row = Math.floor(tileIndex / columns);
          const globalId = tileset.firstgid + tileIndex;

          tileTextures.set(
            globalId,
            new PIXI.Texture(
              bt,
              new PIXI.Rectangle(
                col * tileset.tileWidth,
                row * tileset.tileHeight,
                tileset.tileWidth,
                tileset.tileHeight
              )
            )
          );
        }
      }
    } else if (map.tileSetUrl && map.tileSetDimX && map.tileSetDimY) {
      // Legacy single tileset support
      const numxtiles = Math.floor(map.tileSetDimX / map.tileDim);
      const numytiles = Math.floor(map.tileSetDimY / map.tileDim);
      const bt = PIXI.BaseTexture.from(map.tileSetUrl, {
        scaleMode: PIXI.SCALE_MODES.NEAREST,
      });

      for (let x = 0; x < numxtiles; x++) {
        for (let y = 0; y < numytiles; y++) {
          const tileIndex = x + y * numxtiles;
          tileTextures.set(
            tileIndex,
            new PIXI.Texture(
              bt,
              new PIXI.Rectangle(x * map.tileDim, y * map.tileDim, map.tileDim, map.tileDim)
            )
          );
        }
      }
    }

    const screenxtiles = map.bgTiles[0].length;
    const screenytiles = map.bgTiles[0][0].length;

    const container = new PIXI.Container();
    // Only render background tiles (bgTiles)
    // objectTiles is used for collision detection only, not rendering
    const allLayers = [...map.bgTiles];

    // Tiled flip flags
    const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
    const FLIPPED_VERTICALLY_FLAG = 0x40000000;
    const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
    const ALL_FLIP_FLAGS = FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG;

    // blit bg layers of map onto canvas
    for (let i = 0; i < screenxtiles * screenytiles; i++) {
      const x = i % screenxtiles;
      const y = Math.floor(i / screenxtiles);
      const xPx = x * map.tileDim;
      const yPx = y * map.tileDim;

      // Add all layers of backgrounds.
      for (const layer of allLayers) {
        const rawTileIndex = layer[x][y];
        // Some layers may not have tiles at this location.
        if (rawTileIndex === -1) continue;

        // Extract flip flags and actual tile ID
        const flippedH = (rawTileIndex & FLIPPED_HORIZONTALLY_FLAG) !== 0;
        const flippedV = (rawTileIndex & FLIPPED_VERTICALLY_FLAG) !== 0;
        const flippedD = (rawTileIndex & FLIPPED_DIAGONALLY_FLAG) !== 0;
        const tileIndex = rawTileIndex & ~ALL_FLIP_FLAGS;

        const texture = tileTextures.get(tileIndex);
        if (!texture) {
          console.warn(`Missing texture for tile index ${tileIndex} at (${x}, ${y})`);
          continue;
        }

        const ctile = new PIXI.Sprite(texture);

        // Tiled flip handling: use transformation matrix approach
        // D, H, V flags create 8 possible transformations
        // Reference: https://doc.mapeditor.org/en/stable/reference/tmx-map-format/#tile-flipping

        // Set anchor to center for all transformations
        ctile.anchor.set(0.5, 0.5);
        ctile.x = xPx + map.tileDim / 2;
        ctile.y = yPx + map.tileDim / 2;

        // Handle all 8 combinations explicitly
        if (!flippedD && !flippedH && !flippedV) {
          // 000: No transformation
          // default state
        } else if (!flippedD && !flippedH && flippedV) {
          // 001: Flip vertically
          ctile.scale.y = -1;
        } else if (!flippedD && flippedH && !flippedV) {
          // 010: Flip horizontally
          ctile.scale.x = -1;
        } else if (!flippedD && flippedH && flippedV) {
          // 011: Flip horizontally and vertically (= rotate 180°)
          ctile.scale.x = -1;
          ctile.scale.y = -1;
        } else if (flippedD && !flippedH && !flippedV) {
          // 100: Diagonal flip (transpose) = rotate 90° CW + flip vertically
          ctile.rotation = Math.PI / 2; // 90° clockwise
          ctile.scale.y = -1;
        } else if (flippedD && !flippedH && flippedV) {
          // 101: Diagonal + flip V = rotate 270° CW (or 90° CCW)
          ctile.rotation = -Math.PI / 2; // 90° counter-clockwise
        } else if (flippedD && flippedH && !flippedV) {
          // 110: Diagonal + flip H = rotate 90° CW
          ctile.rotation = Math.PI / 2; // 90° clockwise
        } else if (flippedD && flippedH && flippedV) {
          // 111: Diagonal + flip H + flip V = rotate 270° CW + flip V
          ctile.rotation = -Math.PI / 2; // 90° counter-clockwise
          ctile.scale.y = -1;
        }

        container.addChild(ctile);
      }
    }

    // TODO: Add layers.
    const spritesBySheet = new Map<string, AnimatedSprite[]>();
    for (const sprite of map.animatedSprites) {
      const sheet = sprite.sheet;
      if (!spritesBySheet.has(sheet)) {
        spritesBySheet.set(sheet, []);
      }
      spritesBySheet.get(sheet)!.push(sprite);
    }
    for (const [sheet, sprites] of spritesBySheet.entries()) {
      const animation = (animations as any)[sheet];
      if (!animation) {
        console.error('Could not find animation', sheet);
        continue;
      }
      const { spritesheet, url } = animation;
      const texture = PIXI.BaseTexture.from(url, {
        scaleMode: PIXI.SCALE_MODES.NEAREST,
      });
      const spriteSheet = new PIXI.Spritesheet(texture, spritesheet);
      spriteSheet.parse().then(() => {
        for (const sprite of sprites) {
          const pixiAnimation = spriteSheet.animations[sprite.animation];
          if (!pixiAnimation) {
            console.error('Failed to load animation', sprite);
            continue;
          }
          const pixiSprite = new PIXI.AnimatedSprite(pixiAnimation);
          pixiSprite.animationSpeed = 0.1;
          pixiSprite.autoUpdate = true;
          pixiSprite.x = sprite.x;
          pixiSprite.y = sprite.y;
          pixiSprite.width = sprite.w;
          pixiSprite.height = sprite.h;
          container.addChild(pixiSprite);
          pixiSprite.play();
        }
      });
    }

    container.x = 0;
    container.y = 0;

    // Set the hit area manually to ensure `pointerdown` events are delivered to this container.
    container.interactive = true;
    container.hitArea = new PIXI.Rectangle(
      0,
      0,
      screenxtiles * map.tileDim,
      screenytiles * map.tileDim,
    );

    return container;
  },

  applyProps: (instance, oldProps, newProps) => {
    applyDefaultProps(instance, oldProps, newProps);
  },
});
