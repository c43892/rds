// Copy third-party runtimes into public/lib and patch DragonBones for Pixi v7.
// Run once after `npm install` (and re-run if those deps change).
import fs from 'fs';
import { execSync } from 'child_process';

fs.mkdirSync('public/lib', { recursive: true });

const copies = [
    ['node_modules/@capacitor/core/dist/capacitor.js', 'public/lib/capacitor.js'],
    ['node_modules/pixi.js/dist/pixi.min.js', 'public/lib/pixi.min.js'],
    ['node_modules/howler/dist/howler.min.js', 'public/lib/howler.min.js'],
    ['node_modules/pixi5-dragonbones/dragonBones.js', 'public/lib/dragonBones.js'],
];
for (const [src, dst] of copies) {
    fs.copyFileSync(src, dst);
    console.log('copied', dst);
}

// Patch DragonBones (PixiArmatureDisplay extends native PIXI.Sprite) for Pixi v7.
execSync('node patch-dragonbones.mjs', { stdio: 'inherit' });
