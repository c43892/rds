// ============================================================================
// DragonBones : REAL runtime adapter (Pixi v7)
// The genuine DragonBones 5.7 Pixi runtime (pixi5-dragonbones) is loaded as a
// global <script> BEFORE this shim. Here we adapt it to the API the Egret game
// expects:
//   - dragonBones.EgretFactory  (== a PixiFactory that unwraps egret.Texture)
//   - dragonBones.AnimationEvent (== EventObject, for .COMPLETE etc.)
//   - dragonBones.WorldClock.clock  (default instance the game drives each frame)
//   - egret-style addEventListener/removeEventListener on the armature display
// The factory's own shared-ticker is disabled; the game advances WorldClock.clock
// via egret.Ticker (AnimationFactory), so armatures update exactly once per frame.
// ============================================================================

declare var dragonBones: any;

(function () {
  try {
    if (typeof dragonBones === "undefined" || !dragonBones.PixiFactory) {
        console.error("DragonBones Pixi runtime not loaded before egret-shim.");
        return;
    }

    // Events: the game references dragonBones.AnimationEvent.COMPLETE etc.
    if (!dragonBones.AnimationEvent) dragonBones.AnimationEvent = dragonBones.EventObject;

    // A default WorldClock the game adds armatures to and advances each frame.
    if (!dragonBones.WorldClock.clock) dragonBones.WorldClock.clock = new dragonBones.WorldClock();

    // The game owns the frame clock; don't let the factory double-advance.
    dragonBones.PixiFactory.useSharedTicker = false;

    // egret-style event API on the armature display (PIXI EventEmitter under the hood).
    const P = dragonBones.PixiArmatureDisplay && dragonBones.PixiArmatureDisplay.prototype;
    if (P && !P.addEventListener) {
        P.addEventListener = function (type: string, listener: Function, thiz?: any) { this.on(type, listener, thiz); };
        P.removeEventListener = function (type: string, listener: Function, thiz?: any) { this.off(type, listener, thiz); };
        P.hasEventListener = function (type: string) { return this.listenerCount(type) > 0; };
        P.dispatchEvent = function (ev: any) { this.emit(ev && ev.type ? ev.type : ev, ev); };
    }

    // EgretFactory shim: a PixiFactory whose parseTextureAtlasData accepts an
    // egret.Texture (our shim) / PIXI.Texture / BaseTexture interchangeably.
    function EgretFactory(this: any) {
        dragonBones.PixiFactory.call(this);
    }
    EgretFactory.prototype = Object.create(dragonBones.PixiFactory.prototype);
    EgretFactory.prototype.constructor = EgretFactory;
    EgretFactory.prototype.parseTextureAtlasData = function (rawData: any, textureAtlas: any, name?: string, scale?: number) {
        let tex = textureAtlas;
        if (tex && tex.$pixiTexture) tex = tex.$pixiTexture;     // egret.Texture -> PIXI.Texture
        if (tex && tex.baseTexture) tex = tex.baseTexture;        // PIXI.Texture  -> BaseTexture
        return dragonBones.PixiFactory.prototype.parseTextureAtlasData.call(this, rawData, tex, name, scale);
    };
    dragonBones.EgretFactory = EgretFactory;
  } catch (e) {
    console.error("DragonBones adapter init failed (continuing):", e);
  }
})();
