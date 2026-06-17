// Patch the ES5 DragonBones Pixi runtime so its one class that subclasses a PIXI
// native (PixiArmatureDisplay extends PIXI.Sprite) works under PixiJS v7, whose
// classes are native ES classes (ES5 __extends `_super.apply(this)` is illegal on
// them). We route the base through a Reflect.construct wrapper that IS ES5-callable.
import fs from 'fs';

const p = 'public/lib/dragonBones.js';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('__DBPixiBase')) {
    console.log('dragonBones.js already patched');
} else {
    const shim =
`"use strict";
var __DBPixiBase = function () {
    return Reflect.construct(PIXI.Sprite, arguments, (this && this.constructor) ? this.constructor : __DBPixiBase);
};
__DBPixiBase.prototype = Object.create(PIXI.Sprite.prototype);
__DBPixiBase.prototype.constructor = __DBPixiBase;
`;
    // inject shim right after the opening "use strict";
    s = s.replace('"use strict";', shim);
    // route PixiArmatureDisplay's base (PIXI.Sprite) through the ES5-callable wrapper
    const before = s;
    s = s.replace('}(PIXI.Sprite));', '}(__DBPixiBase));');
    if (s === before) throw new Error('patch target "}(PIXI.Sprite));" not found');
    fs.writeFileSync(p, s);
    console.log('patched dragonBones.js for Pixi v7 (PixiArmatureDisplay base)');
}
