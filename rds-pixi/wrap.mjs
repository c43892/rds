// Wrap the concatenated game code in an IIFE so its global `class Map`
// (the game board) cannot shadow the native Map that PixiJS/the shim rely on.
// The game uses no dynamic global class lookups, so only the entry class needs
// to be exposed for the bootstrap.
import fs from 'fs';

const p = 'public/lib/gamelogic.js';
let s = fs.readFileSync(p, 'utf8');
s = '/*WRAPPED*/;(function(){\n' + s +
    '\n;try{ window.Main = Main; }catch(e){ console.error("expose Main failed", e); }\n})();\n';
fs.writeFileSync(p, s);
console.log('wrapped gamelogic.js (' + s.length + ' bytes)');
