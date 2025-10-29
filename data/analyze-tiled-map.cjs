// Analyze Tiled JSON structure
const fs = require('fs');
const path = require('path');

const mapPath = process.argv[2] || '../generative_agents/environment/frontend_server/static_dirs/assets/the_ville/visuals/the_ville_jan7.json';
const tiledMap = JSON.parse(fs.readFileSync(path.resolve(__dirname, mapPath), 'utf8'));

console.log('=== Map Dimensions ===');
console.log('Width:', tiledMap.width);
console.log('Height:', tiledMap.height);
console.log('Tile Width:', tiledMap.tilewidth);
console.log('Tile Height:', tiledMap.tileheight);

console.log('\n=== Layers ===');
console.log('Total layers:', tiledMap.layers.length);
tiledMap.layers.forEach((layer, i) => {
  console.log(`Layer ${i}: ${layer.name} (${layer.type})`);
});

console.log('\n=== Tilesets ===');
console.log('Total tilesets:', tiledMap.tilesets.length);
tiledMap.tilesets.forEach((tileset, i) => {
  console.log(`Tileset ${i}: ${tileset.name}`);
  console.log(`  - firstgid: ${tileset.firstgid}`);
  console.log(`  - image: ${tileset.image}`);
  console.log(`  - imagewidth: ${tileset.imagewidth}, imageheight: ${tileset.imageheight}`);
  console.log(`  - tilecount: ${tileset.tilecount}`);
  console.log(`  - tilewidth: ${tileset.tilewidth}, tileheight: ${tileset.tileheight}`);
});

console.log('\n=== Data Size ===');
const jsonSize = JSON.stringify(tiledMap).length;
console.log('JSON size:', (jsonSize / 1024).toFixed(2), 'KB');
console.log('JSON size:', (jsonSize / 1024 / 1024).toFixed(2), 'MB');
