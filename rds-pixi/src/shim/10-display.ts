// ============================================================================
// Egret -> PixiJS shim : DISPLAY
// DisplayObject (mixin), DisplayObjectContainer, Bitmap, Sprite, Shape,
// Graphics, Texture, BitmapData.
// ============================================================================

namespace egret {

    const PIXIClass = PIXI;

    // egret.DisplayObject — the game uses `x instanceof egret.DisplayObject` (coinsFly,
    // bloodFly, …). Our display classes extend native PIXI classes, not a shared egret
    // base, so DisplayObject is a marker whose `instanceof` returns true for anything
    // built on PIXI.DisplayObject. Without this, `instanceof undefined` THREW inside
    // fireEvent handlers → lastEventType never cleared → whole battle froze on the next
    // event (e.g. clicking a coin/food after a kill).
    export const DisplayObject: any = function () {};
    Object.defineProperty(DisplayObject, Symbol.hasInstance, {
        value: (inst: any) => !!inst && (inst instanceof PIXI.DisplayObject),
        configurable: true,
    });

    // ---- shared property/method mixin applied to every shim display class --
    // Maps egret semantics onto a PIXI.Container-derived prototype.
    export function installDisplayObject(cls: any) {
        const p = cls.prototype;

        Object.defineProperty(p, "scaleX", {
            get(): number { return this.scale.x; },
            set(v: number) { this.scale.x = v; }, configurable: true
        });
        Object.defineProperty(p, "scaleY", {
            get(): number { return this.scale.y; },
            set(v: number) { this.scale.y = v; }, configurable: true
        });
        // egret rotation/skew are in DEGREES; PIXI .angle is degrees, .skew is radians.
        Object.defineProperty(p, "rotation", {
            get(): number { return this.angle; },
            set(v: number) { this.angle = v; }, configurable: true
        });
        Object.defineProperty(p, "skewX", {
            get(): number { return this.skew.x * 180 / Math.PI; },
            set(v: number) { this.skew.x = v * Math.PI / 180; }, configurable: true
        });
        Object.defineProperty(p, "skewY", {
            get(): number { return this.skew.y * 180 / Math.PI; },
            set(v: number) { this.skew.y = v * Math.PI / 180; }, configurable: true
        });
        // egret registration point (pixels) == PIXI pivot.
        Object.defineProperty(p, "anchorOffsetX", {
            get(): number { return this.pivot.x; },
            set(v: number) { this.pivot.x = v; }, configurable: true
        });
        Object.defineProperty(p, "anchorOffsetY", {
            get(): number { return this.pivot.y; },
            set(v: number) { this.pivot.y = v; }, configurable: true
        });
        Object.defineProperty(p, "touchEnabled", {
            get(): boolean { return this.eventMode === "static" || this.eventMode === "dynamic"; },
            set(v: boolean) { this.eventMode = v ? "static" : "auto"; if (v) this.__ensureHitArea(); }, configurable: true
        });
        Object.defineProperty(p, "touchChildren", {
            get(): boolean { return this.interactiveChildren; },
            set(v: boolean) { this.interactiveChildren = v; }, configurable: true
        });

        // egret hit-tests an interactive CONTAINER by its bounds. PIXI v7 does not:
        // a `static` container with no hitArea and only non-interactive children is
        // unhittable, so real pointer events never reach e.g. GridView. Give such
        // containers a lazy bounds-based hitArea. Sprites/Graphics self-hit-test
        // (texture/shape), and pixelHitTest bitmaps set their own hitArea, so skip
        // those. The hitArea also gates on eventMode so it's inert when not enabled.
        p.__ensureHitArea = function () {
            // Only CONTAINERS need a synthetic bounds hitArea. Sprites/Graphics
            // self-hit-test via their texture/shape; a textureless Bitmap (e.g. the
            // AniView block cover) must stay non-hittable, matching egret.
            if (this instanceof PIXIClass.Sprite || this instanceof PIXIClass.Graphics) return;
            if (this.__isBitmapLike) return;
            if (this.__bhit) { this.hitArea = this.__bhit; return; }
            const self = this;
            this.__bhit = {
                contains(x: number, y: number): boolean {
                    if (self.eventMode !== "static" && self.eventMode !== "dynamic") return false;
                    // Fast path: egret containers carry an EXPLICIT size (GridView cells
                    // get width/height from MapView) — hit the [0..w]x[0..h] box in O(1).
                    // getLocalBounds() here was a full subtree-bounds walk per grid per
                    // hit-test per mousemove (~62 grids x 2 hit-tests), which made drags
                    // visibly laggy with a direction-dependent bias (traversal order).
                    const w = (self as any).__w, h = (self as any).__h;
                    if (w !== undefined && h !== undefined)
                        return w > 0 && h > 0 && x >= 0 && x < w && y >= 0 && y < h;
                    let b: any;
                    try { b = self.getLocalBounds(); } catch (e) { return false; }
                    return b.width > 0 && b.height > 0 &&
                           x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height;
                }
            };
            this.hitArea = this.__bhit;
        };
        // egret .stage : walk up to the stage root (flagged __isStage).
        Object.defineProperty(p, "stage", {
            get(): any { let c = this; while (c) { if (c.__isStage) return c; c = c.parent; } return null; },
            configurable: true
        });
        // egret `filters` accepts egret filter wrappers exposing `$pixi`.
        Object.defineProperty(p, "filters", {
            get(): any { return this.__egFilters; },
            set(arr: any) {
                this.__egFilters = arr;
                if (!arr) { (this as any).__setPixiFilters(null); return; }
                (this as any).__setPixiFilters(arr.map((f: any) => f && f.$pixi ? f.$pixi : f));
            }, configurable: true
        });

        // localToGlobal / globalToLocal -------------------------------------
        p.localToGlobal = function (x = 0, y = 0, result?: any): Point {
            const gp = this.toGlobal(new PIXIClass.Point(x, y));
            return new Point(gp.x, gp.y);
        };
        p.globalToLocal = function (x = 0, y = 0, result?: any): Point {
            const lp = this.toLocal(new PIXIClass.Point(x, y));
            return new Point(lp.x, lp.y);
        };

        // egret hitTestPoint: x,y are in STAGE (global) coords. We test against the
        // object's local bounds (shapeFlag pixel-precision is approximated by bbox).
        // Don't clobber a subclass's own hitTestPoint (e.g. Bitmap, which must use its
        // explicit box for textureless click targets — installDisplayObject runs AFTER
        // the class body, so guard with hasOwnProperty).
        if (!p.hasOwnProperty("hitTestPoint")) {
            p.hitTestPoint = function (x: number, y: number, _shapeFlag?: boolean): boolean {
                let lp: any, b: any;
                try { lp = this.toLocal(new PIXIClass.Point(x, y)); } catch (e) { return false; }
                try { b = this.getLocalBounds(); } catch (e) { return false; }
                if (!b || b.width <= 0 || b.height <= 0) return false;
                return lp.x >= b.x && lp.x < b.x + b.width && lp.y >= b.y && lp.y < b.y + b.height;
            };
        }

        // event system ------------------------------------------------------
        p.addEventListener = function (type: string, listener: Function, thiz?: any, useCapture?: boolean, priority?: number) {
            if (type === Event.ENTER_FRAME) {
                const cb = () => listener.call(thiz, new Event(Event.ENTER_FRAME));
                (this.__ef || (this.__ef = [])).push({ listener, thiz, cb });
                PIXIClass.Ticker.shared.add(cb);
                return;
            }
            const reg = this.__listeners || (this.__listeners = {});
            (reg[type] || (reg[type] = [])).push({ fn: listener, thiz });

            const pixiName = PIXI_EVENT_MAP[type];
            if (pixiName) {
                const hooks = this.__pixiHooked || (this.__pixiHooked = {});
                if (!hooks[pixiName]) {
                    if (pixiName.indexOf("pointer") === 0) { this.eventMode = "static"; this.__ensureHitArea(); }
                    const hook = (ev: any) => fanEvent(this, type, ev, false);
                    hooks[pixiName] = hook;
                    this.on(pixiName, hook);
                }
            }
        };
        p.once = function (type: string, listener: Function, thiz?: any) {
            const self = this;
            const wrap = function (e: any) { self.removeEventListener(type, wrap, thiz); listener.call(thiz, e); };
            this.addEventListener(type, wrap, thiz);
        };
        p.removeEventListener = function (type: string, listener: Function, thiz?: any) {
            if (type === Event.ENTER_FRAME) {
                if (!this.__ef) return;
                for (let i = this.__ef.length - 1; i >= 0; i--) {
                    const e = this.__ef[i];
                    if (e.listener === listener && e.thiz === thiz) {
                        PIXIClass.Ticker.shared.remove(e.cb);
                        this.__ef.splice(i, 1);
                    }
                }
                return;
            }
            const reg = this.__listeners; if (!reg || !reg[type]) return;
            const arr = reg[type];
            for (let i = arr.length - 1; i >= 0; i--)
                if (arr[i].fn === listener && arr[i].thiz === thiz) arr.splice(i, 1);
        };
        p.hasEventListener = function (type: string) {
            return !!(this.__listeners && this.__listeners[type] && this.__listeners[type].length)
                || (type === Event.ENTER_FRAME && this.__ef && this.__ef.length);
        };
        p.dispatchEvent = function (event: Event) {
            fanEvent(this, event.type, event, true);
            return true;
        };
        p.dispatchEventWith = function (type: string, bubbles = false, data?: any) {
            this.dispatchEvent(new Event(type, bubbles, false, data));
        };
    }

    function fanEvent(target: any, type: string, evOrFed: any, isCustom: boolean) {
        // While a press-drag is bridged at the DOM level (see 90-stage.ts), PIXI's own
        // move/up routing is WRONG: it hit-tests pressed events at the press position,
        // so every touchMove/touchEnd lands on the press grid instead of the object
        // under the cursor. Suppress those two from PIXI here; the bridge re-dispatches
        // them (via dispatchTouchEvent → isCustom=true) at the true coordinates.
        // touchBegin/touchTap/touchReleaseOutside stay on the PIXI path (they work).
        if (!isCustom && (window as any).__bridgePress &&
            (type === "touchMove" || type === "touchEnd" || type === "touchReleaseOutside")) return;
        const reg = target.__listeners;
        if (!reg || !reg[type] || !reg[type].length) return;
        let ee: any;
        if (isCustom) {
            ee = evOrFed;
        } else if (evOrFed && evOrFed.global) {
            ee = new TouchEvent(type);
            ee.stageX = evOrFed.global.x;
            ee.stageY = evOrFed.global.y;
            const lp = target.toLocal(evOrFed.global);
            ee.localX = lp.x; ee.localY = lp.y;
            ee.touchPointID = evOrFed.pointerId || 0;
            // egret evt.target = the actual leaf object hit (PIXI federated .target),
            // NOT the listening container. The world map reads evt.target to find
            // which node Bitmap was tapped, so this MUST be the hit child.
            ee.target = evOrFed.target || target;
        } else {
            ee = new Event(type);
        }
        if (!ee.target) ee.target = target;
        ee.currentTarget = target;
        for (const l of reg[type].slice()) l.fn.call(l.thiz, ee);
    }

    // ---- BitmapData / Texture ---------------------------------------------
    export class BitmapData {
        public source: any;          // HTMLImageElement | canvas | PIXI.BaseTexture
        public width = 0;
        public height = 0;
        constructor(source?: any) {
            this.source = source;
            if (source) { this.width = source.width || 0; this.height = source.height || 0; }
        }
    }

    export class Texture {
        public $pixiTexture: any;    // PIXI.Texture
        constructor(pixiTexture?: any) { this.$pixiTexture = pixiTexture; }
        public get textureWidth(): number { return this.$pixiTexture ? this.$pixiTexture.orig.width : 0; }
        public get textureHeight(): number { return this.$pixiTexture ? this.$pixiTexture.orig.height : 0; }
        public get bitmapData(): any { return this.$pixiTexture ? this.$pixiTexture.baseTexture : undefined; }
        public set bitmapData(bd: any) {
            if (!bd) { this.$pixiTexture = PIXI.Texture.EMPTY; return; }
            const src = bd.source ? bd.source : bd;
            this.$pixiTexture = PIXI.Texture.from(src);
        }
        public dispose() {}
        public static fromPixi(t: any): Texture { return new Texture(t); }
    }

    // ---- DisplayObjectContainer (base of all views) -----------------------
    export class DisplayObjectContainer extends (PIXI.Container as any) {
        private __w: number | undefined;
        private __h: number | undefined;
        constructor() { super(); this.sortableChildren = false; }

        // egret containers carry an explicit size that does NOT scale children.
        public get width(): number {
            if (this.__w !== undefined) return this.__w;
            try { return this.getLocalBounds().width; } catch (e) { return 0; }
        }
        public set width(v: number) { this.__w = v; }
        public get height(): number {
            if (this.__h !== undefined) return this.__h;
            try { return this.getLocalBounds().height; } catch (e) { return 0; }
        }
        public set height(v: number) { this.__h = v; }

        public get numChildren(): number { return this.children.length; }

        public addChildAt(child: any, index: number): any { return super.addChildAt(child, index); }

        // egret: getChildIndex returns -1 for a non-child. PIXI's version THROWS, which
        // breaks game helpers that probe membership this way (ViewUtils.tyr2AddChild /
        // try2RemoveChild, LuxuryChestView.refreshRelics, …). Return indexOf (-1 if absent).
        public getChildIndex(child: any): number { return this.children.indexOf(child); }

        // egret: index < 0 or out of range means "bring to top".
        public setChildIndex(child: any, index: number): void {
            const n = this.children.length;
            if (index < 0 || index >= n) index = n - 1;
            super.setChildIndex(child, index);
        }

        public contains(child: any): boolean {
            let c = child;
            while (c) { if (c === this) return true; c = c.parent; }
            return false;
        }
    }
    // filters is overridden by the mixin; route through the real PIXI slot.
    installDisplayObject(DisplayObjectContainer);
    // Re-wire __setPixiFilters to the genuine PIXI filters slot.
    (DisplayObjectContainer.prototype as any).__setPixiFilters = function (arr: any) {
        const d = Object.getOwnPropertyDescriptor(PIXI.Container.prototype, "filters")
               || Object.getOwnPropertyDescriptor(PIXI.DisplayObject.prototype, "filters");
        if (d && d.set) d.set.call(this, arr); else this["_filters"] = arr;
    };

    // egret.Sprite == container with a `graphics` surface.
    export class Sprite extends DisplayObjectContainer {
        private _g: Graphics;
        private _gfx: any;
        constructor() {
            super();
            this._gfx = new PIXI.Graphics();
            super.addChildAt(this._gfx, 0);
            this._g = new Graphics(this._gfx);
        }
        public get graphics(): Graphics { return this._g; }
    }

    // ---- Bitmap (PIXI.Sprite based) ---------------------------------------
    // Native PIXI.Sprite width/height accessors (delegated to in normal mode).
    const _spriteW = Object.getOwnPropertyDescriptor(PIXI.Sprite.prototype, "width")
                  || Object.getOwnPropertyDescriptor(PIXI.Container.prototype, "width");
    const _spriteH = Object.getOwnPropertyDescriptor(PIXI.Sprite.prototype, "height")
                  || Object.getOwnPropertyDescriptor(PIXI.Container.prototype, "height");

    export class Bitmap extends (PIXI.Sprite as any) {
        private _tex: Texture | undefined;
        private _fillMode: string = BitmapFillMode.SCALE;
        private _tiling: any;          // child PIXI.TilingSprite for REPEAT fill
        public smoothing = true;
        private _s9: Rectangle | undefined;
        private _s9plane: any;
        private _ew: number | undefined;
        private _eh: number | undefined;
        private _bm: any;
        private _pht = false;          // pixelHitTest flag
        private _phtBuf: any;          // cached {tex,data,w,h} for alpha sampling

        public __isBitmapLike = true;

        constructor(texture?: Texture) {
            super(texture && texture.$pixiTexture ? texture.$pixiTexture : PIXI.Texture.EMPTY);
            this._tex = texture;
        }

        // egret BitmapFillMode.REPEAT tiles the texture across the bitmap's explicit
        // width/height (used by WorldMapBg, borders, exp bar). PIXI sprites only
        // STRETCH, which left a tall world-map bg as one giant stretched tile (a
        // bright/dark seam = the reported "half dark" background). For REPEAT we draw
        // via a child TilingSprite and blank the sprite's own texture; SCALE/CLIP keep
        // the normal sprite path.
        public get fillMode(): string { return this._fillMode; }
        public set fillMode(v: string) { this._fillMode = v; this.applyFill(); }

        private applyFill() {
            const pt = this._tex && this._tex.$pixiTexture;
            if (this._fillMode === BitmapFillMode.REPEAT && pt && pt !== PIXI.Texture.EMPTY) {
                const w = this._ew != null ? this._ew : (pt.orig ? pt.orig.width : 0);
                const h = this._eh != null ? this._eh : (pt.orig ? pt.orig.height : 0);
                if (!this._tiling) {
                    this._tiling = new PIXI.TilingSprite(pt, w, h);
                    (PIXI.Container.prototype as any).addChild.call(this, this._tiling);
                } else {
                    this._tiling.texture = pt; this._tiling.width = w; this._tiling.height = h;
                }
                this._tiling.visible = true;
                super.texture = PIXI.Texture.EMPTY;   // the tiling sprite does the drawing
            } else if (this._tiling) {
                this._tiling.visible = false;
                super.texture = pt || PIXI.Texture.EMPTY;
            }
        }

        // PIXI v7 passes containsPoint a GLOBAL point. For a real-texture sprite,
        // defer to PIXI's own pixel-accurate test. For the game's textureless click
        // catchers (TipConfirmView.bg, AniView.aniCover) and s9 bitmaps, hit-test the
        // explicit [0..w]x[0..h] box in local space (native scale is 1 there, so the
        // box equals the egret width/height).
        public containsPoint(global: any): boolean {
            // pixelHitTest: alpha-sample via our hitArea (maps local box → texture px),
            // so transparent regions pass taps through (SelView desc bg, guide masks).
            if (this._pht && (this as any).__phtHit) {
                const lp = this.worldTransform.applyInverse(global, (Bitmap as any).__tmpPt || ((Bitmap as any).__tmpPt = new PIXI.Point()));
                return (this as any).__phtHit.contains(lp.x, lp.y);
            }
            if (this._pht) return (PIXI.Sprite.prototype as any).containsPoint.call(this, global);
            if (!this._s9 && this.__hasRealTex())
                return (PIXI.Sprite.prototype as any).containsPoint.call(this, global);
            const w = this._s9 ? this.width : (this._ew != null ? this._ew : 0);
            const h = this._s9 ? this.height : (this._eh != null ? this._eh : 0);
            if (!(w > 0) || !(h > 0)) return false;
            const tp = this.worldTransform.applyInverse(global, (Bitmap as any).__tmpPt || ((Bitmap as any).__tmpPt = new PIXI.Point()));
            return tp.x >= 0 && tp.x < w && tp.y >= 0 && tp.y < h;
        }

        // egret hitTestPoint takes STAGE (global) coords. The generic mixin version
        // uses getLocalBounds(), which is empty (1x1) for a textureless Bitmap — so the
        // guide's hit gate failed on SelView's textureless target grids. Route through
        // containsPoint, which knows the explicit box / real texture / pixelHitTest.
        public hitTestPoint(x: number, y: number, _shapeFlag?: boolean): boolean {
            return this.containsPoint(new PIXI.Point(x, y));
        }

        public get texture(): any { return this._tex; }
        public set texture(t: Texture) {
            this._tex = t;
            this._phtBuf = undefined;
            if (this._s9) { this.applyScale9(); this.applyPixelHit(); return; }
            if (this._fillMode === BitmapFillMode.REPEAT) { this.applyFill(); this.applyPixelHit(); return; }
            super.texture = (t && t.$pixiTexture) ? t.$pixiTexture : PIXI.Texture.EMPTY;
            // re-apply any explicit box now that a real texture exists
            if (this.__hasRealTex()) {
                if (this._ew != null) _spriteW!.set!.call(this, this._ew);
                if (this._eh != null) _spriteH!.set!.call(this, this._eh);
            }
            this.applyPixelHit();
        }

        // egret pixelHitTest: only non-transparent pixels register hits. Used by masks
        // with a transparent "hole" (guide slide track, RenderTexture) AND by the
        // SelView description-panel bg (a normal selViewBg_png that is mostly
        // transparent + scaled to fill the screen — its transparent area MUST let taps
        // through to the target grids beneath, else target selection is dead).
        // We alpha-sample the source texture for ANY real-texture bitmap when enabled.
        public get pixelHitTest(): boolean { return this._pht; }
        public set pixelHitTest(v: boolean) { this._pht = v; this.applyPixelHit(); }

        private applyPixelHit() {
            const pt = this._tex && this._tex.$pixiTexture;
            const hasTex = pt && pt !== PIXI.Texture.EMPTY && pt.orig && pt.orig.width > 0;
            if (!this._pht || !hasTex) { if ((this as any).hitArea && (this as any).__phtHit === (this as any).hitArea) (this as any).hitArea = null; return; }
            const self = this;
            const isRT = PIXI.RenderTexture && (pt instanceof PIXI.RenderTexture);
            // RenderTexture masks (guide slide-track hole) use a strict >8 threshold —
            // only the transparent hole passes. But a normal decorative frame (e.g.
            // SelView's selViewBg_png) is a 9-slice border stretched over the whole play
            // area; its TRANSLUCENT edge bands (~179/255) are visual decoration and must
            // NOT capture gameplay taps, or targets under the frame border (e.g. a Door
            // near the top) become unselectable. Require a near-OPAQUE pixel (>=250) to
            // block for stretched normal-texture frames.
            const thresh = isRT ? 8 : 250;
            const ha = {
                contains: (x: number, y: number): boolean => {
                    const bw = self.width, bh = self.height;
                    if (!(bw > 0) || !(bh > 0) || x < 0 || y < 0 || x >= bw || y >= bh) return false;
                    return self.alphaAt((x / bw) * self.__texW(), (y / bh) * self.__texH()) >= thresh;
                }
            };
            (this as any).__phtHit = ha;
            (this as any).hitArea = ha;
        }

        private __texW(): number { const pt = this._tex && this._tex.$pixiTexture; return pt && pt.orig ? pt.orig.width : 0; }
        private __texH(): number { const pt = this._tex && this._tex.$pixiTexture; return pt && pt.orig ? pt.orig.height : 0; }

        // Sample alpha at texture-pixel (x,y). PIXI v7 renderer.extract.pixels() takes a
        // DisplayObject (not a Texture — that throws), so we read the texture's SOURCE
        // image/canvas via a 2D context once and cache the ImageData. Accounts for the
        // texture's frame offset within its atlas/base.
        private alphaAt(x: number, y: number): number {
            const pt = this._tex && this._tex.$pixiTexture;
            if (!pt) return 255;
            if (!this._phtBuf || this._phtBuf.tex !== pt) {
                this._phtBuf = { tex: pt, data: null, w: 0, h: 0, fx: 0, fy: 0 };
                try {
                    const base = pt.baseTexture;
                    const res = base && base.resource;
                    const src = res && (res.source || res.bitmap || res.canvas || (res as any).data);
                    const frame = pt.frame || { x: 0, y: 0, width: pt.orig.width, height: pt.orig.height };
                    if (src && (src.width || src.naturalWidth)) {
                        const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
                        const cv = document.createElement("canvas"); cv.width = sw; cv.height = sh;
                        const ctx = cv.getContext("2d");
                        if (ctx) {
                            ctx.drawImage(src, 0, 0);
                            const img = ctx.getImageData(0, 0, sw, sh);
                            this._phtBuf = { tex: pt, data: img.data, w: sw, h: sh,
                                             fx: Math.round(frame.x), fy: Math.round(frame.y) };
                        }
                    }
                } catch (e) { /* leave data null -> block */ }
            }
            const buf = this._phtBuf;
            if (!buf.data || !buf.w) return 255; // can't sample -> block (safe default)
            const ix = Math.floor(x) + buf.fx, iy = Math.floor(y) + buf.fy;
            if (ix < 0 || iy < 0 || ix >= buf.w || iy >= buf.h) return 0;
            return buf.data[(iy * buf.w + ix) * 4 + 3];
        }

        public get scale9Grid(): Rectangle | undefined { return this._s9; }
        public set scale9Grid(r: Rectangle | undefined) { this._s9 = r; this.applyScale9(); }

        private applyScale9() {
            const pt = this._tex && this._tex.$pixiTexture;
            if (!this._s9 || !pt) {
                if (this._s9plane) this._s9plane.visible = false;
                super.texture = pt || PIXI.Texture.EMPTY;
                return;
            }
            const g = this._s9;
            const tw = pt.orig.width, th = pt.orig.height;
            const left = Math.max(0, g.x), top = Math.max(0, g.y);
            const right = Math.max(0, tw - (g.x + g.width)), bottom = Math.max(0, th - (g.y + g.height));
            if (!this._s9plane) {
                this._s9plane = new PIXI.NineSlicePlane(pt, left, top, right, bottom);
                (PIXI.Container.prototype as any).addChild.call(this, this._s9plane);
            } else {
                this._s9plane.texture = pt;
                this._s9plane.leftWidth = left; this._s9plane.topHeight = top;
                this._s9plane.rightWidth = right; this._s9plane.bottomHeight = bottom;
            }
            this._s9plane.visible = true;
            this._s9plane.width = this._ew != null ? this._ew : tw;
            this._s9plane.height = this._eh != null ? this._eh : th;
            // The plane does the actual drawing, so mirror blendMode/tint onto it
            // (e.g. the guide's ERASE track punched into the dimmed overlay).
            this._s9plane.blendMode = this._bm != null ? this._bm : PIXI.BLEND_MODES.NORMAL;
            try { this._s9plane.tint = (this as any).tint; } catch (e) {}
            super.texture = PIXI.Texture.EMPTY; // the sprite itself renders nothing
        }

        // egret blendMode lives on the sprite, but in scale9 mode the child plane
        // draws, so forward it (otherwise ERASE/ADD on a 9-sliced bitmap is a no-op).
        // Backed by a field (PIXI v7 reads .blendMode off the object at render time).
        public get blendMode(): any { return this._bm != null ? this._bm : PIXI.BLEND_MODES.NORMAL; }
        public set blendMode(v: any) {
            this._bm = v;
            if (this._s9plane) this._s9plane.blendMode = v;
        }

        private __hasRealTex(): boolean {
            return !!(this._tex && this._tex.$pixiTexture && this._tex.$pixiTexture !== PIXI.Texture.EMPTY
                      && this._tex.$pixiTexture.orig && this._tex.$pixiTexture.orig.width > 0);
        }

        private __repeat(): boolean { return this._fillMode === BitmapFillMode.REPEAT && !!this._tiling && this._tiling.visible; }

        public get width(): number {
            if (this._s9) return this._ew != null ? this._ew : (this._tex ? this._tex.textureWidth : 0);
            if (this.__repeat()) return this._ew != null ? this._ew : 0;
            if (this.__hasRealTex()) return _spriteW!.get!.call(this);
            return this._ew != null ? this._ew : 0;   // textureless: explicit box
        }
        public set width(v: number) {
            this._ew = v;
            if (this._s9) { if (this._s9plane) this._s9plane.width = v; }
            else if (this._fillMode === BitmapFillMode.REPEAT) { if (this._tiling) this._tiling.width = v; }
            else if (this.__hasRealTex()) _spriteW!.set!.call(this, v);
        }
        public get height(): number {
            if (this._s9) return this._eh != null ? this._eh : (this._tex ? this._tex.textureHeight : 0);
            if (this.__repeat()) return this._eh != null ? this._eh : 0;
            if (this.__hasRealTex()) return _spriteH!.get!.call(this);
            return this._eh != null ? this._eh : 0;   // textureless: explicit box
        }
        public set height(v: number) {
            this._eh = v;
            if (this._s9) { if (this._s9plane) this._s9plane.height = v; }
            else if (this._fillMode === BitmapFillMode.REPEAT) { if (this._tiling) this._tiling.height = v; }
            else if (this.__hasRealTex()) _spriteH!.set!.call(this, v);
        }

        public __setPixiFilters(arr: any) {
            const d = Object.getOwnPropertyDescriptor(PIXI.DisplayObject.prototype, "filters");
            if (d && d.set) d.set.call(this, arr); else this["_filters"] = arr;
        }
    }
    installDisplayObject(Bitmap);

    // ---- Graphics (egret drawing API over a PIXI.Graphics) ----------------
    export class Graphics {
        private g: any;             // PIXI.Graphics target
        private _fillColor = 0;
        private _fillAlpha = 1;
        private _lineW = 0;
        private _lineColor = 0;
        private _lineAlpha = 1;
        constructor(pixiGraphics: any) { this.g = pixiGraphics; }

        clear() { this.g.clear(); }
        beginFill(color: number, alpha = 1) { this._fillColor = color; this._fillAlpha = alpha; this.g.beginFill(color, alpha); }
        beginGradientFill() { this.g.beginFill(0xffffff, 1); }
        endFill() { this.g.endFill(); }
        lineStyle(thickness = 0, color = 0, alpha = 1) {
            this._lineW = thickness; this._lineColor = color; this._lineAlpha = alpha;
            this.g.lineStyle(thickness, color, alpha);
        }
        drawRect(x: number, y: number, w: number, h: number) { this.g.drawRect(x, y, w, h); }
        drawRoundRect(x: number, y: number, w: number, h: number, ew: number, eh?: number) { this.g.drawRoundedRect(x, y, w, h, ew); }
        drawCircle(x: number, y: number, r: number) { this.g.drawCircle(x, y, r); }
        drawEllipse(x: number, y: number, w: number, h: number) { this.g.drawEllipse(x + w / 2, y + h / 2, w / 2, h / 2); }
        drawArc(x: number, y: number, r: number, start: number, end: number, anticlockwise = false) {
            this.g.arc(x, y, r, start, end, anticlockwise);
        }
        moveTo(x: number, y: number) { this.g.moveTo(x, y); }
        lineTo(x: number, y: number) { this.g.lineTo(x, y); }
        curveTo(cx: number, cy: number, x: number, y: number) { this.g.quadraticCurveTo(cx, cy, x, y); }
    }

    // ---- Shape ------------------------------------------------------------
    export class Shape extends (PIXI.Graphics as any) {
        private _g: Graphics;
        constructor() { super(); this._g = new Graphics(this); }
        public get graphics(): Graphics { return this._g; }
        public __setPixiFilters(arr: any) {
            const d = Object.getOwnPropertyDescriptor(PIXI.DisplayObject.prototype, "filters");
            if (d && d.set) d.set.call(this, arr); else this["_filters"] = arr;
        }
    }
    installDisplayObject(Shape);

    // ---- ColorMatrixFilter / GlowFilter -----------------------------------
    export class ColorMatrixFilter {
        public $pixi: any;
        public matrix: number[];
        constructor(matrix?: number[]) {
            this.matrix = matrix || [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];
            this.$pixi = new PIXI.ColorMatrixFilter();
            this.applyMatrix();
        }
        private applyMatrix() {
            // egret 4x5 (offset col in 0..255) -> PIXI expects offset normalized.
            const m = this.matrix.slice();
            [4, 9, 14, 19].forEach(i => { if (m[i] !== undefined) m[i] = m[i] / 255; });
            this.$pixi.matrix = m;
        }
    }

    export class BlurFilter {
        public $pixi: any;
        constructor(blurX = 4, blurY = 4) { this.$pixi = new PIXI.BlurFilter((blurX + blurY) / 2); }
    }

    export class GlowFilter {
        public $pixi: any;
        constructor(color = 0xffffff, alpha = 1, blurX = 6, blurY = 6, strength = 2) {
            // Approximate with a blur filter; PIXI core has no glow.
            this.$pixi = new PIXI.BlurFilter(Math.max(blurX, blurY));
        }
    }
}
