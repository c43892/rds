// ============================================================================
// Egret -> PixiJS compatibility shim : CORE
// namespace egret { geometry, events, enums, capabilities, logging }
// Backed by global PIXI (v7 UMD) which is loaded before this script.
// ============================================================================
var egret;
(function (egret) {
    // ---- logging -----------------------------------------------------------
    function log(...args) { console.log(...args); }
    egret.log = log;
    function warn(...args) { console.warn(...args); }
    egret.warn = warn;
    function error(...args) { console.error(...args); }
    egret.error = error;
    class Logger {
    }
    Logger.ALL = "all";
    Logger.DEBUG = "debug";
    Logger.INFO = "info";
    Logger.WARN = "warn";
    Logger.ERROR = "error";
    Logger.OFF = "off";
    Logger.logLevel = "all";
    egret.Logger = Logger;
    let _hashCount = 1;
    class HashObject {
        constructor() { this.hashCode = _hashCount++; }
    }
    egret.HashObject = HashObject;
    // ---- geometry ----------------------------------------------------------
    class Point {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        setTo(x, y) { this.x = x; this.y = y; return this; }
        clone() { return new Point(this.x, this.y); }
        static distance(a, b) {
            const dx = a.x - b.x, dy = a.y - b.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
    egret.Point = Point;
    class Rectangle {
        constructor(x = 0, y = 0, width = 0, height = 0) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        get right() { return this.x + this.width; }
        get bottom() { return this.y + this.height; }
        setTo(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
            return this;
        }
        contains(x, y) {
            return x >= this.x && x < this.x + this.width &&
                y >= this.y && y < this.y + this.height;
        }
        clone() { return new Rectangle(this.x, this.y, this.width, this.height); }
    }
    egret.Rectangle = Rectangle;
    class Matrix {
        constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.tx = tx;
            this.ty = ty;
        }
    }
    egret.Matrix = Matrix;
    // ---- enums -------------------------------------------------------------
    egret.HorizontalAlign = { LEFT: "left", RIGHT: "right", CENTER: "center", JUSTIFY: "justify", CONTENT_JUSTIFY: "contentJustify" };
    egret.VerticalAlign = { TOP: "top", BOTTOM: "bottom", MIDDLE: "middle", JUSTIFY: "justify", CONTENT_JUSTIFY: "contentJustify" };
    egret.BitmapFillMode = { REPEAT: "repeat", SCALE: "scale", CLIP: "clip" };
    egret.OrientationMode = { AUTO: "auto", PORTRAIT: "portrait", LANDSCAPE: "landscape", LANDSCAPE_FLIPPED: "landscapeFlipped" };
    egret.TextFieldType = { DYNAMIC: "dynamic", INPUT: "input" };
    egret.TextFieldInputType = { TEXT: "text", TEL: "tel", PASSWORD: "password" };
    egret.StageScaleMode = { NO_SCALE: "noScale", SHOW_ALL: "showAll", NO_BORDER: "noBorder", EXACT_FIT: "exactFit", FIXED_WIDTH: "fixedWidth", FIXED_HEIGHT: "fixedHeight" };
    // ---- event types -------------------------------------------------------
    class Event {
        constructor(type, bubbles = false, cancelable = false, data) {
            this.type = type;
            this.$bubbles = bubbles;
            this.$cancelable = cancelable;
            this.data = data;
        }
        stopPropagation() { }
        stopImmediatePropagation() { }
        preventDefault() { }
    }
    Event.ADDED_TO_STAGE = "addedToStage";
    Event.REMOVED_FROM_STAGE = "removedFromStage";
    Event.ADDED = "added";
    Event.REMOVED = "removed";
    Event.ENTER_FRAME = "enterFrame";
    Event.RENDER = "render";
    Event.RESIZE = "resize";
    Event.COMPLETE = "complete";
    Event.CHANGE = "change";
    Event.CLOSE = "close";
    Event.OPEN = "open";
    Event.LOOP_COMPLETE = "loopComplete";
    Event.SOUND_COMPLETE = "soundComplete";
    egret.Event = Event;
    class TouchEvent extends Event {
        constructor() {
            super(...arguments);
            this.stageX = 0;
            this.stageY = 0;
            this.localX = 0;
            this.localY = 0;
            this.touchPointID = 0;
            this.touchDown = false;
        }
        // egret static helper used to synthesize/forward touches (e.g. the guide layer).
        static dispatchTouchEvent(target, type, bubbles = false, cancelable = false, stageX = 0, stageY = 0, touchPointID = 0, touchDown = false) {
            if (!target || !target.dispatchEvent)
                return false;
            const e = new TouchEvent(type, bubbles, cancelable);
            e.stageX = stageX;
            e.stageY = stageY;
            e.touchPointID = touchPointID;
            e.touchDown = touchDown;
            if (target.globalToLocal) {
                try {
                    const lp = target.globalToLocal(stageX, stageY);
                    e.localX = lp.x;
                    e.localY = lp.y;
                }
                catch (_) { }
            }
            e.target = target;
            target.dispatchEvent(e);
            return true;
        }
    }
    TouchEvent.TOUCH_BEGIN = "touchBegin";
    TouchEvent.TOUCH_MOVE = "touchMove";
    TouchEvent.TOUCH_END = "touchEnd";
    TouchEvent.TOUCH_TAP = "touchTap";
    TouchEvent.TOUCH_RELEASE_OUTSIDE = "touchReleaseOutside";
    TouchEvent.TOUCH_CANCEL = "touchCancel";
    egret.TouchEvent = TouchEvent;
    class TimerEvent extends Event {
    }
    TimerEvent.TIMER = "timer";
    TimerEvent.TIMER_COMPLETE = "timerComplete";
    egret.TimerEvent = TimerEvent;
    // Map egret event type -> PIXI federated event name (for display objects).
    egret.PIXI_EVENT_MAP = {
        touchBegin: "pointerdown",
        touchMove: "pointermove",
        touchEnd: "pointerup",
        touchTap: "pointertap",
        touchReleaseOutside: "pointerupoutside",
        touchCancel: "pointercancel",
        added: "added",
        removed: "removed",
        addedToStage: "added",
        removedFromStage: "removed",
    };
    // ---- a standalone dispatcher (for non-display objects) -----------------
    class EventDispatcher extends HashObject {
        constructor(target) {
            super();
            this._listeners = {};
        }
        addEventListener(type, listener, thiz, useCapture, priority) {
            (this._listeners[type] || (this._listeners[type] = [])).push({ fn: listener, thiz });
        }
        once(type, listener, thiz) {
            const wrap = (e) => { this.removeEventListener(type, wrap, thiz); listener.call(thiz, e); };
            this.addEventListener(type, wrap, thiz);
        }
        removeEventListener(type, listener, thiz) {
            const arr = this._listeners[type];
            if (!arr)
                return;
            for (let i = arr.length - 1; i >= 0; i--)
                if (arr[i].fn === listener && arr[i].thiz === thiz)
                    arr.splice(i, 1);
        }
        hasEventListener(type) { return !!(this._listeners[type] && this._listeners[type].length); }
        dispatchEvent(event) {
            const arr = this._listeners[event.type];
            if (!arr)
                return true;
            event.target = event.target || this;
            event.currentTarget = this;
            for (const l of arr.slice())
                l.fn.call(l.thiz, event);
            return true;
        }
        dispatchEventWith(type, bubbles = false, data) {
            this.dispatchEvent(new Event(type, bubbles, false, data));
        }
    }
    egret.EventDispatcher = EventDispatcher;
    // ---- capabilities ------------------------------------------------------
    class Capabilities {
        static get os() {
            const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "") || "";
            if (/iPhone|iPad|iPod/i.test(ua))
                return "iOS";
            if (/Android/i.test(ua))
                return "Android";
            if (/Windows/i.test(ua))
                return "Windows PC";
            if (/Mac/i.test(ua))
                return "Mac OS";
            return "Unknown";
        }
        static get isMobile() {
            const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "") || "";
            return /iPhone|iPad|iPod|Android/i.test(ua);
        }
    }
    Capabilities.runtimeType = "web";
    Capabilities.language = (typeof navigator !== "undefined" ? navigator.language : "zh-CN");
    egret.Capabilities = Capabilities;
    // ---- misc helpers used by game ----------------------------------------
    function getTimer() { return Date.now(); }
    egret.getTimer = getTimer;
    function callLater(fn, thiz, ...args) {
        Promise.resolve().then(() => fn.apply(thiz, args));
    }
    egret.callLater = callLater;
    function registerClass(..._a) { }
    egret.registerClass = registerClass;
    function getQualifiedClassName(o) {
        return o && o.constructor ? o.constructor.name : typeof o;
    }
    egret.getQualifiedClassName = getQualifiedClassName;
})(egret || (egret = {}));
// ============================================================================
// Egret -> PixiJS shim : DISPLAY
// DisplayObject (mixin), DisplayObjectContainer, Bitmap, Sprite, Shape,
// Graphics, Texture, BitmapData.
// ============================================================================
var egret;
(function (egret) {
    const PIXIClass = PIXI;
    // egret.DisplayObject — the game uses `x instanceof egret.DisplayObject` (coinsFly,
    // bloodFly, …). Our display classes extend native PIXI classes, not a shared egret
    // base, so DisplayObject is a marker whose `instanceof` returns true for anything
    // built on PIXI.DisplayObject. Without this, `instanceof undefined` THREW inside
    // fireEvent handlers → lastEventType never cleared → whole battle froze on the next
    // event (e.g. clicking a coin/food after a kill).
    egret.DisplayObject = function () { };
    Object.defineProperty(egret.DisplayObject, Symbol.hasInstance, {
        value: (inst) => !!inst && (inst instanceof PIXI.DisplayObject),
        configurable: true,
    });
    // ---- shared property/method mixin applied to every shim display class --
    // Maps egret semantics onto a PIXI.Container-derived prototype.
    function installDisplayObject(cls) {
        const p = cls.prototype;
        Object.defineProperty(p, "scaleX", {
            get() { return this.scale.x; },
            set(v) { this.scale.x = v; }, configurable: true
        });
        Object.defineProperty(p, "scaleY", {
            get() { return this.scale.y; },
            set(v) { this.scale.y = v; }, configurable: true
        });
        // egret rotation/skew are in DEGREES; PIXI .angle is degrees, .skew is radians.
        Object.defineProperty(p, "rotation", {
            get() { return this.angle; },
            set(v) { this.angle = v; }, configurable: true
        });
        Object.defineProperty(p, "skewX", {
            get() { return this.skew.x * 180 / Math.PI; },
            set(v) { this.skew.x = v * Math.PI / 180; }, configurable: true
        });
        Object.defineProperty(p, "skewY", {
            get() { return this.skew.y * 180 / Math.PI; },
            set(v) { this.skew.y = v * Math.PI / 180; }, configurable: true
        });
        // egret registration point (pixels) == PIXI pivot.
        Object.defineProperty(p, "anchorOffsetX", {
            get() { return this.pivot.x; },
            set(v) { this.pivot.x = v; }, configurable: true
        });
        Object.defineProperty(p, "anchorOffsetY", {
            get() { return this.pivot.y; },
            set(v) { this.pivot.y = v; }, configurable: true
        });
        Object.defineProperty(p, "touchEnabled", {
            get() { return this.eventMode === "static" || this.eventMode === "dynamic"; },
            set(v) { this.eventMode = v ? "static" : "auto"; if (v)
                this.__ensureHitArea(); }, configurable: true
        });
        Object.defineProperty(p, "touchChildren", {
            get() { return this.interactiveChildren; },
            set(v) { this.interactiveChildren = v; }, configurable: true
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
            if (this instanceof PIXIClass.Sprite || this instanceof PIXIClass.Graphics)
                return;
            if (this.__isBitmapLike)
                return;
            if (this.__bhit) {
                this.hitArea = this.__bhit;
                return;
            }
            const self = this;
            this.__bhit = {
                contains(x, y) {
                    if (self.eventMode !== "static" && self.eventMode !== "dynamic")
                        return false;
                    // Fast path: egret containers carry an EXPLICIT size (GridView cells
                    // get width/height from MapView) — hit the [0..w]x[0..h] box in O(1).
                    // getLocalBounds() here was a full subtree-bounds walk per grid per
                    // hit-test per mousemove (~62 grids x 2 hit-tests), which made drags
                    // visibly laggy with a direction-dependent bias (traversal order).
                    const w = self.__w, h = self.__h;
                    if (w !== undefined && h !== undefined)
                        return w > 0 && h > 0 && x >= 0 && x < w && y >= 0 && y < h;
                    let b;
                    try {
                        b = self.getLocalBounds();
                    }
                    catch (e) {
                        return false;
                    }
                    return b.width > 0 && b.height > 0 &&
                        x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height;
                }
            };
            this.hitArea = this.__bhit;
        };
        // egret .stage : walk up to the stage root (flagged __isStage).
        Object.defineProperty(p, "stage", {
            get() { let c = this; while (c) {
                if (c.__isStage)
                    return c;
                c = c.parent;
            } return null; },
            configurable: true
        });
        // egret `filters` accepts egret filter wrappers exposing `$pixi`.
        Object.defineProperty(p, "filters", {
            get() { return this.__egFilters; },
            set(arr) {
                this.__egFilters = arr;
                if (!arr) {
                    this.__setPixiFilters(null);
                    return;
                }
                this.__setPixiFilters(arr.map((f) => f && f.$pixi ? f.$pixi : f));
            }, configurable: true
        });
        // localToGlobal / globalToLocal -------------------------------------
        p.localToGlobal = function (x = 0, y = 0, result) {
            const gp = this.toGlobal(new PIXIClass.Point(x, y));
            return new egret.Point(gp.x, gp.y);
        };
        p.globalToLocal = function (x = 0, y = 0, result) {
            const lp = this.toLocal(new PIXIClass.Point(x, y));
            return new egret.Point(lp.x, lp.y);
        };
        // egret hitTestPoint: x,y are in STAGE (global) coords. We test against the
        // object's local bounds (shapeFlag pixel-precision is approximated by bbox).
        // Don't clobber a subclass's own hitTestPoint (e.g. Bitmap, which must use its
        // explicit box for textureless click targets — installDisplayObject runs AFTER
        // the class body, so guard with hasOwnProperty).
        if (!p.hasOwnProperty("hitTestPoint")) {
            p.hitTestPoint = function (x, y, _shapeFlag) {
                let lp, b;
                try {
                    lp = this.toLocal(new PIXIClass.Point(x, y));
                }
                catch (e) {
                    return false;
                }
                try {
                    b = this.getLocalBounds();
                }
                catch (e) {
                    return false;
                }
                if (!b || b.width <= 0 || b.height <= 0)
                    return false;
                return lp.x >= b.x && lp.x < b.x + b.width && lp.y >= b.y && lp.y < b.y + b.height;
            };
        }
        // event system ------------------------------------------------------
        p.addEventListener = function (type, listener, thiz, useCapture, priority) {
            if (type === egret.Event.ENTER_FRAME) {
                const cb = () => listener.call(thiz, new egret.Event(egret.Event.ENTER_FRAME));
                (this.__ef || (this.__ef = [])).push({ listener, thiz, cb });
                PIXIClass.Ticker.shared.add(cb);
                return;
            }
            const reg = this.__listeners || (this.__listeners = {});
            (reg[type] || (reg[type] = [])).push({ fn: listener, thiz });
            const pixiName = egret.PIXI_EVENT_MAP[type];
            if (pixiName) {
                const hooks = this.__pixiHooked || (this.__pixiHooked = {});
                if (!hooks[pixiName]) {
                    if (pixiName.indexOf("pointer") === 0) {
                        this.eventMode = "static";
                        this.__ensureHitArea();
                    }
                    const hook = (ev) => fanEvent(this, type, ev, false);
                    hooks[pixiName] = hook;
                    this.on(pixiName, hook);
                }
            }
        };
        p.once = function (type, listener, thiz) {
            const self = this;
            const wrap = function (e) { self.removeEventListener(type, wrap, thiz); listener.call(thiz, e); };
            this.addEventListener(type, wrap, thiz);
        };
        p.removeEventListener = function (type, listener, thiz) {
            if (type === egret.Event.ENTER_FRAME) {
                if (!this.__ef)
                    return;
                for (let i = this.__ef.length - 1; i >= 0; i--) {
                    const e = this.__ef[i];
                    if (e.listener === listener && e.thiz === thiz) {
                        PIXIClass.Ticker.shared.remove(e.cb);
                        this.__ef.splice(i, 1);
                    }
                }
                return;
            }
            const reg = this.__listeners;
            if (!reg || !reg[type])
                return;
            const arr = reg[type];
            for (let i = arr.length - 1; i >= 0; i--)
                if (arr[i].fn === listener && arr[i].thiz === thiz)
                    arr.splice(i, 1);
        };
        p.hasEventListener = function (type) {
            return !!(this.__listeners && this.__listeners[type] && this.__listeners[type].length)
                || (type === egret.Event.ENTER_FRAME && this.__ef && this.__ef.length);
        };
        p.dispatchEvent = function (event) {
            fanEvent(this, event.type, event, true);
            return true;
        };
        p.dispatchEventWith = function (type, bubbles = false, data) {
            this.dispatchEvent(new egret.Event(type, bubbles, false, data));
        };
    }
    egret.installDisplayObject = installDisplayObject;
    function fanEvent(target, type, evOrFed, isCustom) {
        // While a press-drag is bridged at the DOM level (see 90-stage.ts), PIXI's own
        // move/up routing is WRONG: it hit-tests pressed events at the press position,
        // so every touchMove/touchEnd lands on the press grid instead of the object
        // under the cursor. Suppress those two from PIXI here; the bridge re-dispatches
        // them (via dispatchTouchEvent → isCustom=true) at the true coordinates.
        // touchBegin/touchTap/touchReleaseOutside stay on the PIXI path (they work).
        if (!isCustom && window.__bridgePress &&
            (type === "touchMove" || type === "touchEnd" || type === "touchReleaseOutside"))
            return;
        const reg = target.__listeners;
        if (!reg || !reg[type] || !reg[type].length)
            return;
        let ee;
        if (isCustom) {
            ee = evOrFed;
        }
        else if (evOrFed && evOrFed.global) {
            ee = new egret.TouchEvent(type);
            ee.stageX = evOrFed.global.x;
            ee.stageY = evOrFed.global.y;
            const lp = target.toLocal(evOrFed.global);
            ee.localX = lp.x;
            ee.localY = lp.y;
            ee.touchPointID = evOrFed.pointerId || 0;
            // egret evt.target = the actual leaf object hit (PIXI federated .target),
            // NOT the listening container. The world map reads evt.target to find
            // which node Bitmap was tapped, so this MUST be the hit child.
            ee.target = evOrFed.target || target;
        }
        else {
            ee = new egret.Event(type);
        }
        if (!ee.target)
            ee.target = target;
        ee.currentTarget = target;
        for (const l of reg[type].slice())
            l.fn.call(l.thiz, ee);
    }
    // ---- BitmapData / Texture ---------------------------------------------
    class BitmapData {
        constructor(source) {
            this.width = 0;
            this.height = 0;
            this.source = source;
            if (source) {
                this.width = source.width || 0;
                this.height = source.height || 0;
            }
        }
    }
    egret.BitmapData = BitmapData;
    class Texture {
        constructor(pixiTexture) { this.$pixiTexture = pixiTexture; }
        get textureWidth() { return this.$pixiTexture ? this.$pixiTexture.orig.width : 0; }
        get textureHeight() { return this.$pixiTexture ? this.$pixiTexture.orig.height : 0; }
        get bitmapData() { return this.$pixiTexture ? this.$pixiTexture.baseTexture : undefined; }
        set bitmapData(bd) {
            if (!bd) {
                this.$pixiTexture = PIXI.Texture.EMPTY;
                return;
            }
            const src = bd.source ? bd.source : bd;
            this.$pixiTexture = PIXI.Texture.from(src);
        }
        dispose() { }
        static fromPixi(t) { return new Texture(t); }
    }
    egret.Texture = Texture;
    // ---- DisplayObjectContainer (base of all views) -----------------------
    class DisplayObjectContainer extends PIXI.Container {
        constructor() { super(); this.sortableChildren = false; }
        // egret containers carry an explicit size that does NOT scale children.
        get width() {
            if (this.__w !== undefined)
                return this.__w;
            try {
                return this.getLocalBounds().width;
            }
            catch (e) {
                return 0;
            }
        }
        set width(v) { this.__w = v; }
        get height() {
            if (this.__h !== undefined)
                return this.__h;
            try {
                return this.getLocalBounds().height;
            }
            catch (e) {
                return 0;
            }
        }
        set height(v) { this.__h = v; }
        get numChildren() { return this.children.length; }
        addChildAt(child, index) { return super.addChildAt(child, index); }
        // egret: index < 0 or out of range means "bring to top".
        setChildIndex(child, index) {
            const n = this.children.length;
            if (index < 0 || index >= n)
                index = n - 1;
            super.setChildIndex(child, index);
        }
        contains(child) {
            let c = child;
            while (c) {
                if (c === this)
                    return true;
                c = c.parent;
            }
            return false;
        }
    }
    egret.DisplayObjectContainer = DisplayObjectContainer;
    // filters is overridden by the mixin; route through the real PIXI slot.
    installDisplayObject(DisplayObjectContainer);
    // Re-wire __setPixiFilters to the genuine PIXI filters slot.
    DisplayObjectContainer.prototype.__setPixiFilters = function (arr) {
        const d = Object.getOwnPropertyDescriptor(PIXI.Container.prototype, "filters")
            || Object.getOwnPropertyDescriptor(PIXI.DisplayObject.prototype, "filters");
        if (d && d.set)
            d.set.call(this, arr);
        else
            this["_filters"] = arr;
    };
    // egret.Sprite == container with a `graphics` surface.
    class Sprite extends DisplayObjectContainer {
        constructor() {
            super();
            this._gfx = new PIXI.Graphics();
            super.addChildAt(this._gfx, 0);
            this._g = new Graphics(this._gfx);
        }
        get graphics() { return this._g; }
    }
    egret.Sprite = Sprite;
    // ---- Bitmap (PIXI.Sprite based) ---------------------------------------
    // Native PIXI.Sprite width/height accessors (delegated to in normal mode).
    const _spriteW = Object.getOwnPropertyDescriptor(PIXI.Sprite.prototype, "width")
        || Object.getOwnPropertyDescriptor(PIXI.Container.prototype, "width");
    const _spriteH = Object.getOwnPropertyDescriptor(PIXI.Sprite.prototype, "height")
        || Object.getOwnPropertyDescriptor(PIXI.Container.prototype, "height");
    class Bitmap extends PIXI.Sprite {
        constructor(texture) {
            super(texture && texture.$pixiTexture ? texture.$pixiTexture : PIXI.Texture.EMPTY);
            this._fillMode = egret.BitmapFillMode.SCALE;
            this.smoothing = true;
            this._pht = false; // pixelHitTest flag
            this.__isBitmapLike = true;
            this._tex = texture;
        }
        // egret BitmapFillMode.REPEAT tiles the texture across the bitmap's explicit
        // width/height (used by WorldMapBg, borders, exp bar). PIXI sprites only
        // STRETCH, which left a tall world-map bg as one giant stretched tile (a
        // bright/dark seam = the reported "half dark" background). For REPEAT we draw
        // via a child TilingSprite and blank the sprite's own texture; SCALE/CLIP keep
        // the normal sprite path.
        get fillMode() { return this._fillMode; }
        set fillMode(v) { this._fillMode = v; this.applyFill(); }
        applyFill() {
            const pt = this._tex && this._tex.$pixiTexture;
            if (this._fillMode === egret.BitmapFillMode.REPEAT && pt && pt !== PIXI.Texture.EMPTY) {
                const w = this._ew != null ? this._ew : (pt.orig ? pt.orig.width : 0);
                const h = this._eh != null ? this._eh : (pt.orig ? pt.orig.height : 0);
                if (!this._tiling) {
                    this._tiling = new PIXI.TilingSprite(pt, w, h);
                    PIXI.Container.prototype.addChild.call(this, this._tiling);
                }
                else {
                    this._tiling.texture = pt;
                    this._tiling.width = w;
                    this._tiling.height = h;
                }
                this._tiling.visible = true;
                super.texture = PIXI.Texture.EMPTY; // the tiling sprite does the drawing
            }
            else if (this._tiling) {
                this._tiling.visible = false;
                super.texture = pt || PIXI.Texture.EMPTY;
            }
        }
        // PIXI v7 passes containsPoint a GLOBAL point. For a real-texture sprite,
        // defer to PIXI's own pixel-accurate test. For the game's textureless click
        // catchers (TipConfirmView.bg, AniView.aniCover) and s9 bitmaps, hit-test the
        // explicit [0..w]x[0..h] box in local space (native scale is 1 there, so the
        // box equals the egret width/height).
        containsPoint(global) {
            // pixelHitTest: alpha-sample via our hitArea (maps local box → texture px),
            // so transparent regions pass taps through (SelView desc bg, guide masks).
            if (this._pht && this.__phtHit) {
                const lp = this.worldTransform.applyInverse(global, Bitmap.__tmpPt || (Bitmap.__tmpPt = new PIXI.Point()));
                return this.__phtHit.contains(lp.x, lp.y);
            }
            if (this._pht)
                return PIXI.Sprite.prototype.containsPoint.call(this, global);
            if (!this._s9 && this.__hasRealTex())
                return PIXI.Sprite.prototype.containsPoint.call(this, global);
            const w = this._s9 ? this.width : (this._ew != null ? this._ew : 0);
            const h = this._s9 ? this.height : (this._eh != null ? this._eh : 0);
            if (!(w > 0) || !(h > 0))
                return false;
            const tp = this.worldTransform.applyInverse(global, Bitmap.__tmpPt || (Bitmap.__tmpPt = new PIXI.Point()));
            return tp.x >= 0 && tp.x < w && tp.y >= 0 && tp.y < h;
        }
        // egret hitTestPoint takes STAGE (global) coords. The generic mixin version
        // uses getLocalBounds(), which is empty (1x1) for a textureless Bitmap — so the
        // guide's hit gate failed on SelView's textureless target grids. Route through
        // containsPoint, which knows the explicit box / real texture / pixelHitTest.
        hitTestPoint(x, y, _shapeFlag) {
            return this.containsPoint(new PIXI.Point(x, y));
        }
        get texture() { return this._tex; }
        set texture(t) {
            this._tex = t;
            this._phtBuf = undefined;
            if (this._s9) {
                this.applyScale9();
                this.applyPixelHit();
                return;
            }
            if (this._fillMode === egret.BitmapFillMode.REPEAT) {
                this.applyFill();
                this.applyPixelHit();
                return;
            }
            super.texture = (t && t.$pixiTexture) ? t.$pixiTexture : PIXI.Texture.EMPTY;
            // re-apply any explicit box now that a real texture exists
            if (this.__hasRealTex()) {
                if (this._ew != null)
                    _spriteW.set.call(this, this._ew);
                if (this._eh != null)
                    _spriteH.set.call(this, this._eh);
            }
            this.applyPixelHit();
        }
        // egret pixelHitTest: only non-transparent pixels register hits. Used by masks
        // with a transparent "hole" (guide slide track, RenderTexture) AND by the
        // SelView description-panel bg (a normal selViewBg_png that is mostly
        // transparent + scaled to fill the screen — its transparent area MUST let taps
        // through to the target grids beneath, else target selection is dead).
        // We alpha-sample the source texture for ANY real-texture bitmap when enabled.
        get pixelHitTest() { return this._pht; }
        set pixelHitTest(v) { this._pht = v; this.applyPixelHit(); }
        applyPixelHit() {
            const pt = this._tex && this._tex.$pixiTexture;
            const hasTex = pt && pt !== PIXI.Texture.EMPTY && pt.orig && pt.orig.width > 0;
            if (!this._pht || !hasTex) {
                if (this.hitArea && this.__phtHit === this.hitArea)
                    this.hitArea = null;
                return;
            }
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
                contains: (x, y) => {
                    const bw = self.width, bh = self.height;
                    if (!(bw > 0) || !(bh > 0) || x < 0 || y < 0 || x >= bw || y >= bh)
                        return false;
                    return self.alphaAt((x / bw) * self.__texW(), (y / bh) * self.__texH()) >= thresh;
                }
            };
            this.__phtHit = ha;
            this.hitArea = ha;
        }
        __texW() { const pt = this._tex && this._tex.$pixiTexture; return pt && pt.orig ? pt.orig.width : 0; }
        __texH() { const pt = this._tex && this._tex.$pixiTexture; return pt && pt.orig ? pt.orig.height : 0; }
        // Sample alpha at texture-pixel (x,y). PIXI v7 renderer.extract.pixels() takes a
        // DisplayObject (not a Texture — that throws), so we read the texture's SOURCE
        // image/canvas via a 2D context once and cache the ImageData. Accounts for the
        // texture's frame offset within its atlas/base.
        alphaAt(x, y) {
            const pt = this._tex && this._tex.$pixiTexture;
            if (!pt)
                return 255;
            if (!this._phtBuf || this._phtBuf.tex !== pt) {
                this._phtBuf = { tex: pt, data: null, w: 0, h: 0, fx: 0, fy: 0 };
                try {
                    const base = pt.baseTexture;
                    const res = base && base.resource;
                    const src = res && (res.source || res.bitmap || res.canvas || res.data);
                    const frame = pt.frame || { x: 0, y: 0, width: pt.orig.width, height: pt.orig.height };
                    if (src && (src.width || src.naturalWidth)) {
                        const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
                        const cv = document.createElement("canvas");
                        cv.width = sw;
                        cv.height = sh;
                        const ctx = cv.getContext("2d");
                        if (ctx) {
                            ctx.drawImage(src, 0, 0);
                            const img = ctx.getImageData(0, 0, sw, sh);
                            this._phtBuf = { tex: pt, data: img.data, w: sw, h: sh,
                                fx: Math.round(frame.x), fy: Math.round(frame.y) };
                        }
                    }
                }
                catch (e) { /* leave data null -> block */ }
            }
            const buf = this._phtBuf;
            if (!buf.data || !buf.w)
                return 255; // can't sample -> block (safe default)
            const ix = Math.floor(x) + buf.fx, iy = Math.floor(y) + buf.fy;
            if (ix < 0 || iy < 0 || ix >= buf.w || iy >= buf.h)
                return 0;
            return buf.data[(iy * buf.w + ix) * 4 + 3];
        }
        get scale9Grid() { return this._s9; }
        set scale9Grid(r) { this._s9 = r; this.applyScale9(); }
        applyScale9() {
            const pt = this._tex && this._tex.$pixiTexture;
            if (!this._s9 || !pt) {
                if (this._s9plane)
                    this._s9plane.visible = false;
                super.texture = pt || PIXI.Texture.EMPTY;
                return;
            }
            const g = this._s9;
            const tw = pt.orig.width, th = pt.orig.height;
            const left = Math.max(0, g.x), top = Math.max(0, g.y);
            const right = Math.max(0, tw - (g.x + g.width)), bottom = Math.max(0, th - (g.y + g.height));
            if (!this._s9plane) {
                this._s9plane = new PIXI.NineSlicePlane(pt, left, top, right, bottom);
                PIXI.Container.prototype.addChild.call(this, this._s9plane);
            }
            else {
                this._s9plane.texture = pt;
                this._s9plane.leftWidth = left;
                this._s9plane.topHeight = top;
                this._s9plane.rightWidth = right;
                this._s9plane.bottomHeight = bottom;
            }
            this._s9plane.visible = true;
            this._s9plane.width = this._ew != null ? this._ew : tw;
            this._s9plane.height = this._eh != null ? this._eh : th;
            // The plane does the actual drawing, so mirror blendMode/tint onto it
            // (e.g. the guide's ERASE track punched into the dimmed overlay).
            this._s9plane.blendMode = this._bm != null ? this._bm : PIXI.BLEND_MODES.NORMAL;
            try {
                this._s9plane.tint = this.tint;
            }
            catch (e) { }
            super.texture = PIXI.Texture.EMPTY; // the sprite itself renders nothing
        }
        // egret blendMode lives on the sprite, but in scale9 mode the child plane
        // draws, so forward it (otherwise ERASE/ADD on a 9-sliced bitmap is a no-op).
        // Backed by a field (PIXI v7 reads .blendMode off the object at render time).
        get blendMode() { return this._bm != null ? this._bm : PIXI.BLEND_MODES.NORMAL; }
        set blendMode(v) {
            this._bm = v;
            if (this._s9plane)
                this._s9plane.blendMode = v;
        }
        __hasRealTex() {
            return !!(this._tex && this._tex.$pixiTexture && this._tex.$pixiTexture !== PIXI.Texture.EMPTY
                && this._tex.$pixiTexture.orig && this._tex.$pixiTexture.orig.width > 0);
        }
        __repeat() { return this._fillMode === egret.BitmapFillMode.REPEAT && !!this._tiling && this._tiling.visible; }
        get width() {
            if (this._s9)
                return this._ew != null ? this._ew : (this._tex ? this._tex.textureWidth : 0);
            if (this.__repeat())
                return this._ew != null ? this._ew : 0;
            if (this.__hasRealTex())
                return _spriteW.get.call(this);
            return this._ew != null ? this._ew : 0; // textureless: explicit box
        }
        set width(v) {
            this._ew = v;
            if (this._s9) {
                if (this._s9plane)
                    this._s9plane.width = v;
            }
            else if (this._fillMode === egret.BitmapFillMode.REPEAT) {
                if (this._tiling)
                    this._tiling.width = v;
            }
            else if (this.__hasRealTex())
                _spriteW.set.call(this, v);
        }
        get height() {
            if (this._s9)
                return this._eh != null ? this._eh : (this._tex ? this._tex.textureHeight : 0);
            if (this.__repeat())
                return this._eh != null ? this._eh : 0;
            if (this.__hasRealTex())
                return _spriteH.get.call(this);
            return this._eh != null ? this._eh : 0; // textureless: explicit box
        }
        set height(v) {
            this._eh = v;
            if (this._s9) {
                if (this._s9plane)
                    this._s9plane.height = v;
            }
            else if (this._fillMode === egret.BitmapFillMode.REPEAT) {
                if (this._tiling)
                    this._tiling.height = v;
            }
            else if (this.__hasRealTex())
                _spriteH.set.call(this, v);
        }
        __setPixiFilters(arr) {
            const d = Object.getOwnPropertyDescriptor(PIXI.DisplayObject.prototype, "filters");
            if (d && d.set)
                d.set.call(this, arr);
            else
                this["_filters"] = arr;
        }
    }
    egret.Bitmap = Bitmap;
    installDisplayObject(Bitmap);
    // ---- Graphics (egret drawing API over a PIXI.Graphics) ----------------
    class Graphics {
        constructor(pixiGraphics) {
            this._fillColor = 0;
            this._fillAlpha = 1;
            this._lineW = 0;
            this._lineColor = 0;
            this._lineAlpha = 1;
            this.g = pixiGraphics;
        }
        clear() { this.g.clear(); }
        beginFill(color, alpha = 1) { this._fillColor = color; this._fillAlpha = alpha; this.g.beginFill(color, alpha); }
        beginGradientFill() { this.g.beginFill(0xffffff, 1); }
        endFill() { this.g.endFill(); }
        lineStyle(thickness = 0, color = 0, alpha = 1) {
            this._lineW = thickness;
            this._lineColor = color;
            this._lineAlpha = alpha;
            this.g.lineStyle(thickness, color, alpha);
        }
        drawRect(x, y, w, h) { this.g.drawRect(x, y, w, h); }
        drawRoundRect(x, y, w, h, ew, eh) { this.g.drawRoundedRect(x, y, w, h, ew); }
        drawCircle(x, y, r) { this.g.drawCircle(x, y, r); }
        drawEllipse(x, y, w, h) { this.g.drawEllipse(x + w / 2, y + h / 2, w / 2, h / 2); }
        drawArc(x, y, r, start, end, anticlockwise = false) {
            this.g.arc(x, y, r, start, end, anticlockwise);
        }
        moveTo(x, y) { this.g.moveTo(x, y); }
        lineTo(x, y) { this.g.lineTo(x, y); }
        curveTo(cx, cy, x, y) { this.g.quadraticCurveTo(cx, cy, x, y); }
    }
    egret.Graphics = Graphics;
    // ---- Shape ------------------------------------------------------------
    class Shape extends PIXI.Graphics {
        constructor() { super(); this._g = new Graphics(this); }
        get graphics() { return this._g; }
        __setPixiFilters(arr) {
            const d = Object.getOwnPropertyDescriptor(PIXI.DisplayObject.prototype, "filters");
            if (d && d.set)
                d.set.call(this, arr);
            else
                this["_filters"] = arr;
        }
    }
    egret.Shape = Shape;
    installDisplayObject(Shape);
    // ---- ColorMatrixFilter / GlowFilter -----------------------------------
    class ColorMatrixFilter {
        constructor(matrix) {
            this.matrix = matrix || [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
            this.$pixi = new PIXI.ColorMatrixFilter();
            this.applyMatrix();
        }
        applyMatrix() {
            // egret 4x5 (offset col in 0..255) -> PIXI expects offset normalized.
            const m = this.matrix.slice();
            [4, 9, 14, 19].forEach(i => { if (m[i] !== undefined)
                m[i] = m[i] / 255; });
            this.$pixi.matrix = m;
        }
    }
    egret.ColorMatrixFilter = ColorMatrixFilter;
    class BlurFilter {
        constructor(blurX = 4, blurY = 4) { this.$pixi = new PIXI.BlurFilter((blurX + blurY) / 2); }
    }
    egret.BlurFilter = BlurFilter;
    class GlowFilter {
        constructor(color = 0xffffff, alpha = 1, blurX = 6, blurY = 6, strength = 2) {
            // Approximate with a blur filter; PIXI core has no glow.
            this.$pixi = new PIXI.BlurFilter(Math.max(blurX, blurY));
        }
    }
    egret.GlowFilter = GlowFilter;
})(egret || (egret = {}));
// ============================================================================
// Egret -> PixiJS shim : TEXT
// TextField, HtmlTextParser, BitmapFont, BitmapText
// ============================================================================
var egret;
(function (egret) {
    // ---- HtmlTextParser : strip/convert egret rich-text markup ------------
    class HtmlTextParser {
        parser(htmltext) {
            if (htmltext == null)
                return [{ text: "" }];
            const out = [];
            const styleStack = [{}];
            let i = 0;
            const re = /<\/?[^>]+>/g;
            let m;
            let last = 0;
            const push = (txt) => {
                if (!txt)
                    return;
                out.push({ text: txt, style: Object.assign({}, styleStack[styleStack.length - 1]) });
            };
            while ((m = re.exec(htmltext))) {
                push(htmltext.substring(last, m.index));
                last = re.lastIndex;
                const tag = m[0];
                if (tag[1] === "/") {
                    if (styleStack.length > 1)
                        styleStack.pop();
                }
                else {
                    const cur = Object.assign({}, styleStack[styleStack.length - 1]);
                    const lower = tag.toLowerCase();
                    if (lower.indexOf("<b") === 0)
                        cur.bold = true;
                    if (lower.indexOf("<i") === 0)
                        cur.italic = true;
                    if (lower.indexOf("<u") === 0)
                        cur.underline = true;
                    const cm = /color\s*=\s*['"]?#?([0-9a-fA-F]{6})/.exec(tag);
                    if (cm)
                        cur.textColor = parseInt(cm[1], 16);
                    const sm = /size\s*=\s*['"]?(\d+)/.exec(tag);
                    if (sm)
                        cur.size = parseInt(sm[1], 10);
                    styleStack.push(cur);
                }
            }
            push(htmltext.substring(last));
            if (out.length === 0)
                out.push({ text: "" });
            return out;
        }
    }
    egret.HtmlTextParser = HtmlTextParser;
    // ---- TextField --------------------------------------------------------
    class TextField extends egret.DisplayObjectContainer {
        constructor() {
            super();
            this._text = "";
            this._size = 30;
            this._color = 0xffffff;
            this._family = "LXGW WenKai, Microsoft YaHei, sans-serif";
            this._bold = false;
            this._italic = false;
            this._align = egret.HorizontalAlign.LEFT;
            this._valign = egret.VerticalAlign.TOP;
            this._lineSpacing = 0;
            this._stroke = 0;
            this._strokeColor = 0x000000;
            this._runs = []; // per-segment PIXI.Text pieces (rich mode)
            this._cw = 0; // measured content width  (rich mode)
            this._ch = 0; // measured content height (rich mode)
            this._type = egret.TextFieldType.DYNAMIC;
            this._inputTapHooked = false;
            this.inputType = egret.TextFieldInputType.TEXT;
            this.maxChars = 0;
            this.displayAsPassword = false;
            this.background = false;
            this.backgroundColor = 0xffffff;
            this.border = false;
            this._t = new PIXI.Text("", this.buildStyle());
            super.addChild(this._t);
        }
        get type() { return this._type; }
        set type(v) {
            this._type = v;
            if (v === egret.TextFieldType.INPUT && !this._inputTapHooked) {
                this._inputTapHooked = true;
                this.eventMode = "static";
                this.on("pointertap", () => this.openHtmlInput());
            }
        }
        openHtmlInput() {
            const app = egret.$app;
            if (!app || typeof document === "undefined")
                return;
            if (this._htmlInput && this._htmlInput.parentNode) {
                this._htmlInput.focus();
                return;
            }
            const canvas = app.view;
            const rect = canvas.getBoundingClientRect();
            const tl = this.toGlobal(new PIXI.Point(0, 0));
            const sx = rect.width / (canvas.width || 1);
            const sy = rect.height / (canvas.height || 1);
            const boxW = (this.width || 200);
            const boxH = (this.height || this._size + 12);
            const input = document.createElement("input");
            input.type = this.displayAsPassword ? "password" : "text";
            input.value = this._text || "";
            if (this.maxChars > 0)
                input.maxLength = this.maxChars;
            const st = input.style;
            st.position = "absolute";
            st.left = (rect.left + tl.x * sx) + "px";
            st.top = (rect.top + tl.y * sy) + "px";
            st.width = (boxW * sx) + "px";
            st.height = (boxH * sy) + "px";
            st.fontSize = (this._size * sy) + "px";
            st.fontFamily = this._family;
            st.textAlign = "center";
            st.color = "#" + ("000000" + this._color.toString(16)).slice(-6);
            st.border = "none";
            st.outline = "none";
            st.background = "transparent";
            st.padding = "0";
            st.margin = "0";
            st.zIndex = "10000";
            document.body.appendChild(input);
            this._htmlInput = input;
            input.focus();
            try {
                input.select();
            }
            catch (e) { }
            const commit = () => {
                if (!input.parentNode)
                    return;
                this.text = input.value;
                this.dispatchEventWith(egret.Event.CHANGE);
                document.body.removeChild(input);
                if (this._htmlInput === input)
                    this._htmlInput = undefined;
            };
            input.addEventListener("blur", commit);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    input.blur();
                }
            });
            input.addEventListener("input", () => { this._text = input.value; this.update(); });
        }
        // egret API some views may call; ensure overlay text reflects programmatic set
        setText(v) { this.text = v; if (this._htmlInput)
            this._htmlInput.value = v || ""; }
        buildStyle() {
            const s = {
                fontFamily: this._family,
                fontSize: this._size,
                fill: this._color,
                align: this._align,
                leading: this._lineSpacing,
                fontWeight: this._bold ? "bold" : "normal",
                fontStyle: this._italic ? "italic" : "normal",
                // egret advances each line by the FONT SIZE (+lineSpacing); PIXI defaults
                // to the font's ascent+descent (~1.27x the size), so multi-line text was
                // ~27% too tall and overflowed/overlapped egret-designed boxes (e.g. the
                // occupation description spilling onto the relic line). lineHeight=size
                // restores egret's tight line metric; `leading` adds lineSpacing on top.
                lineHeight: this._size,
            };
            if (this._stroke) {
                s.stroke = this._strokeColor;
                s.strokeThickness = this._stroke * 2;
            }
            if (this._bw !== undefined) {
                s.wordWrap = true;
                s.wordWrapWidth = this._bw;
                s.breakWords = true;
            }
            return s;
        }
        clearRuns() {
            if (!this._runs.length)
                return;
            for (const p of this._runs) {
                if (p.parent)
                    super.removeChild(p);
                try {
                    p.destroy();
                }
                catch (e) { }
            }
            this._runs.length = 0;
            this._cw = 0;
            this._ch = 0;
        }
        isRich() {
            return !!this._flow && this._flow.some(e => e.style &&
                (e.style.textColor !== undefined || e.style.size !== undefined || e.style.bold || e.style.italic));
        }
        update() {
            this.clearRuns();
            if (this.isRich()) {
                this._t.visible = false;
                this.layoutRich();
                return;
            }
            // ---- single-style fast path ----
            this._t.visible = true;
            this._t.style = this.buildStyle();
            this._t.text = this._text || "";
            // Horizontal alignment within the EXPLICIT width box. egret aligns the text
            // inside its width box; PIXI.Text's style.align only aligns wrapped lines
            // within their OWN bounds (maxLineWidth), so the whole block must be offset
            // to sit in the box — exactly what layoutRich() does for the rich path.
            // (Without this, every center/right field rendered flush-left: createTextField
            // defaults to CENTER, so nearly all UI labels were mis-positioned.)
            if (this._bw !== undefined) {
                if (this._align === egret.HorizontalAlign.CENTER)
                    this._t.x = (this._bw - this._t.width) / 2;
                else if (this._align === egret.HorizontalAlign.RIGHT)
                    this._t.x = this._bw - this._t.width;
                else
                    this._t.x = 0;
            }
            else {
                this._t.x = 0;
            }
            if (this._bh !== undefined) {
                if (this._valign === egret.VerticalAlign.MIDDLE)
                    this._t.y = (this._bh - this._t.height) / 2;
                else if (this._valign === egret.VerticalAlign.BOTTOM)
                    this._t.y = this._bh - this._t.height;
                else
                    this._t.y = 0;
            }
            else {
                this._t.y = 0;
            }
        }
        // per-run style = field defaults overlaid with the segment's own style
        styleFor(st) {
            st = st || {};
            const sz = st.size != null ? st.size : this._size;
            const o = {
                fontFamily: this._family,
                fontSize: sz,
                fill: st.textColor != null ? st.textColor : this._color,
                fontWeight: (st.bold || this._bold) ? "bold" : "normal",
                fontStyle: (st.italic || this._italic) ? "italic" : "normal",
                // match egret's per-line advance (= font size, not ascent+descent) so a
                // per-token piece measures `size` tall; layoutRich then stacks lines at the
                // egret height instead of PIXI's inflated metric. (see buildStyle note)
                lineHeight: sz,
            };
            if (this._stroke) {
                o.stroke = this._strokeColor;
                o.strokeThickness = this._stroke * 2;
            }
            return o;
        }
        // split into layout tokens: each CJK char, each latin "word", each whitespace run
        tokenize(text) {
            const tokens = [];
            const cjk = "\\u3000-\\u303f\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uff00-\\uffef";
            const re = new RegExp("[" + cjk + "]|[^\\s" + cjk + "]+|\\s+", "g");
            for (const part of text.split(/(\n)/)) {
                if (part === "\n") {
                    tokens.push("\n");
                    continue;
                }
                let m;
                while ((m = re.exec(part)))
                    tokens.push(m[0]);
            }
            return tokens;
        }
        // multi-style layout with word/CJK wrapping + h/v alignment inside the box
        layoutRich() {
            const wrap = this._bw != null ? this._bw : Infinity;
            const items = [];
            for (const seg of this._flow)
                for (const tk of this.tokenize(seg.text))
                    items.push({ tk, style: seg.style });
            // `h` = measured piece height (PIXI ~1.27x size) used only to bottom-align
            // mixed-size tokens WITHIN a line. `adv` = egret line advance (= max token
            // SIZE), used to stack lines — PIXI's measured height would make multi-line
            // rich text ~27% too tall and overflow its box (each piece is single-line, so
            // lineHeight can't shrink it; the advance must come from the size instead).
            const lines = [];
            let cur = [], x = 0, lineH = 0, lineAdv = 0;
            const pushLine = () => { lines.push({ pieces: cur, w: x, h: lineH || this._size, adv: lineAdv || this._size }); cur = []; x = 0; lineH = 0; lineAdv = 0; };
            for (const it of items) {
                if (it.tk === "\n") {
                    pushLine();
                    continue;
                }
                const isSpace = /^\s+$/.test(it.tk);
                const piece = new PIXI.Text(it.tk, this.styleFor(it.style));
                const w = piece.width, h = piece.height;
                const sz = (it.style && it.style.size != null) ? it.style.size : this._size;
                if (wrap !== Infinity && x > 0 && x + w > wrap && !isSpace)
                    pushLine();
                if (x === 0 && isSpace) {
                    try {
                        piece.destroy();
                    }
                    catch (e) { }
                    continue;
                } // drop leading space
                piece.x = x;
                piece.__h = h;
                cur.push(piece);
                x += w;
                if (h > lineH)
                    lineH = h;
                if (sz > lineAdv)
                    lineAdv = sz;
            }
            pushLine();
            let y = 0, maxW = 0;
            for (const ln of lines) {
                let off = 0;
                if (this._bw != null) {
                    if (this._align === egret.HorizontalAlign.CENTER)
                        off = (this._bw - ln.w) / 2;
                    else if (this._align === egret.HorizontalAlign.RIGHT)
                        off = this._bw - ln.w;
                }
                // Within the line, bottom-align mixed-size tokens by their MEASURED height
                // (baseline-ish). Advance to the next line by the egret SIZE so the taller
                // PIXI metric's descent just overhangs the gap (empty for CJK), matching
                // egret's tight line packing instead of stacking 38px boxes.
                for (const p of ln.pieces) {
                    p.x += off;
                    p.y = y + (ln.h - p.__h);
                    super.addChild(p);
                    this._runs.push(p);
                }
                y += ln.adv + this._lineSpacing;
                if (ln.w > maxW)
                    maxW = ln.w;
            }
            this._cw = this._bw != null ? this._bw : maxW;
            this._ch = y > 0 ? y - this._lineSpacing : 0;
            if (this._bh != null) {
                let vo = 0;
                if (this._valign === egret.VerticalAlign.MIDDLE)
                    vo = (this._bh - this._ch) / 2;
                else if (this._valign === egret.VerticalAlign.BOTTOM)
                    vo = this._bh - this._ch;
                if (vo)
                    for (const p of this._runs)
                        p.y += vo;
            }
        }
        get text() { return this._text; }
        set text(v) { this._text = (v == null ? "" : "" + v); this._flow = undefined; this.update(); }
        get textFlow() { return this._flow; }
        set textFlow(flow) {
            this._flow = flow;
            this._text = flow ? flow.map(e => e.text).join("") : "";
            this.update(); // multi-style flows render as colored runs (see layoutRich)
        }
        get size() { return this._size; }
        set size(v) { if (v) {
            this._size = v;
            this.update();
        } }
        get textColor() { return this._color; }
        set textColor(v) { this._color = v; this.update(); }
        get fontFamily() { return this._family; }
        set fontFamily(v) { this._family = v; this.update(); }
        get bold() { return this._bold; }
        set bold(v) { this._bold = v; this.update(); }
        get italic() { return this._italic; }
        set italic(v) { this._italic = v; this.update(); }
        get textAlign() { return this._align; }
        set textAlign(v) { this._align = v; this.update(); }
        get verticalAlign() { return this._valign; }
        set verticalAlign(v) { this._valign = v; this.update(); }
        get lineSpacing() { return this._lineSpacing; }
        set lineSpacing(v) { this._lineSpacing = v; this.update(); }
        get stroke() { return this._stroke; }
        set stroke(v) { this._stroke = v; this.update(); }
        get strokeColor() { return this._strokeColor; }
        set strokeColor(v) { this._strokeColor = v; this.update(); }
        get lineHeight() { return this._t.style.lineHeight || this._size; }
        // egret TextField width/height define the layout box (no scaling).
        get width() { return this._bw !== undefined ? this._bw : (this._runs.length ? this._cw : this._t.width); }
        set width(v) { this._bw = v; this.update(); }
        get height() { return this._bh !== undefined ? this._bh : (this._runs.length ? this._ch : this._t.height); }
        set height(v) { this._bh = v; this.update(); }
        get textWidth() { return this._runs.length ? this._cw : this._t.width; }
        get textHeight() { return this._runs.length ? this._ch : this._t.height; }
        get measuredWidth() { return this._runs.length ? this._cw : this._t.width; }
        get measuredHeight() { return this._runs.length ? this._ch : this._t.height; }
        get numLines() { return this._text ? this._text.split("\n").length : 0; }
        setFocus() { }
    }
    egret.TextField = TextField;
    // ---- BitmapFont -------------------------------------------------------
    class BitmapFont {
        constructor(texture, config) {
            this.cache = {};
            this.base = texture && texture.$pixiTexture ? texture.$pixiTexture.baseTexture : null;
            this.frames = (config && config.frames) ? config.frames : config;
        }
        getFrame(ch) { return this.frames ? this.frames[ch] : undefined; }
        getTexture(ch) {
            if (this.cache[ch])
                return this.cache[ch];
            const f = this.getFrame(ch);
            if (!f || !this.base)
                return null;
            const t = new PIXI.Texture(this.base, new PIXI.Rectangle(f.x, f.y, f.w, f.h));
            this.cache[ch] = t;
            return t;
        }
    }
    egret.BitmapFont = BitmapFont;
    // ---- BitmapText -------------------------------------------------------
    class BitmapText extends egret.DisplayObjectContainer {
        constructor() {
            super(...arguments);
            this._text = "";
            this.letterSpacing = 0;
            this.lineSpacing = 0;
            this.textAlign = egret.HorizontalAlign.LEFT;
            this.smoothing = true;
        }
        get font() { return this._font; }
        set font(f) { this._font = f; this.rebuild(); }
        get text() { return this._text; }
        set text(v) { this._text = (v == null ? "" : "" + v); this.rebuild(); }
        rebuild() {
            this.removeChildren();
            if (!this._font || !this._text)
                return;
            let cursorX = 0;
            let lineY = 0;
            for (const ch of this._text) {
                if (ch === "\n") {
                    cursorX = 0;
                    lineY += this.lineHeightGuess();
                    continue;
                }
                const f = this._font.getFrame(ch);
                const tex = this._font.getTexture(ch);
                if (!f || !tex) {
                    cursorX += this._size() / 2;
                    continue;
                }
                const spr = new PIXI.Sprite(tex);
                spr.x = cursorX + (f.offX || 0);
                spr.y = lineY + (f.offY || 0);
                super.addChild(spr);
                cursorX += (f.sourceW || f.w) + this.letterSpacing;
            }
        }
        _size() { return 24; }
        lineHeightGuess() {
            // any frame's sourceH
            const fr = this._font && this._font.frames;
            if (fr)
                for (const k in fr)
                    return (fr[k].sourceH || fr[k].h) + this.lineSpacing;
            return 24;
        }
    }
    egret.BitmapText = BitmapText;
})(egret || (egret = {}));
// ============================================================================
// Egret -> PixiJS shim : TWEEN + EASE
// Faithful re-implementation of egret.Tween driven by PIXI.Ticker.shared.
// ============================================================================
var egret;
(function (egret) {
    egret.Ease = (() => {
        const PI = Math.PI;
        const pow = Math.pow, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt;
        const E = {};
        E.none = E.linear = (t) => t;
        E.get = (amount) => {
            if (amount < -1)
                amount = -1;
            if (amount > 1)
                amount = 1;
            return (t) => (amount === 0) ? t : (amount < 0 ? t * (t * -amount + 1 + amount) : t * ((2 - t) * amount + (1 - amount)));
        };
        const mkIn = (p) => (t) => pow(t, p);
        const mkOut = (p) => (t) => 1 - pow(1 - t, p);
        const mkInOut = (p) => (t) => (t < 0.5) ? pow(t * 2, p) / 2 : 1 - pow(2 - t * 2, p) / 2;
        E.quadIn = mkIn(2);
        E.quadOut = mkOut(2);
        E.quadInOut = mkInOut(2);
        E.cubicIn = mkIn(3);
        E.cubicOut = mkOut(3);
        E.cubicInOut = mkInOut(3);
        E.quartIn = mkIn(4);
        E.quartOut = mkOut(4);
        E.quartInOut = mkInOut(4);
        E.quintIn = mkIn(5);
        E.quintOut = mkOut(5);
        E.quintInOut = mkInOut(5);
        E.sineIn = (t) => 1 - cos(t * PI / 2);
        E.sineOut = (t) => sin(t * PI / 2);
        E.sineInOut = (t) => -0.5 * (cos(PI * t) - 1);
        const backVal = 1.7;
        E.backIn = (t) => t * t * ((backVal + 1) * t - backVal);
        E.backOut = (t) => (--t * t * ((backVal + 1) * t + backVal) + 1);
        E.backInOut = (t) => {
            const b = backVal * 1.525;
            t *= 2;
            if (t < 1)
                return 0.5 * (t * t * ((b + 1) * t - b));
            return 0.5 * ((t -= 2) * t * ((b + 1) * t + b) + 2);
        };
        E.circIn = (t) => -(sqrt(1 - t * t) - 1);
        E.circOut = (t) => sqrt(1 - (--t) * t);
        E.circInOut = (t) => { t *= 2; if (t < 1)
            return -0.5 * (sqrt(1 - t * t) - 1); return 0.5 * (sqrt(1 - (t -= 2) * t) + 1); };
        E.expoIn = (t) => (t === 0) ? 0 : pow(2, 10 * (t - 1));
        E.expoOut = (t) => (t === 1) ? 1 : 1 - pow(2, -10 * t);
        E.expoInOut = (t) => { if (t === 0)
            return 0; if (t === 1)
            return 1; t *= 2; if (t < 1)
            return 0.5 * pow(2, 10 * (t - 1)); return 0.5 * (2 - pow(2, -10 * (t - 1))); };
        const elastic = (amp, period) => (t) => {
            if (t === 0 || t === 1)
                return t;
            const s = period / (2 * PI) * Math.asin(1 / amp);
            return -(amp * pow(2, 10 * (t -= 1)) * sin((t - s) * (2 * PI) / period));
        };
        E.elasticIn = elastic(1, 0.3);
        E.elasticOut = (t) => { if (t === 0 || t === 1)
            return t; const p = 0.3, s = p / 4; return (pow(2, -10 * t) * sin((t - s) * (2 * PI) / p) + 1); };
        E.elasticInOut = (t) => {
            if (t === 0 || t === 1)
                return t;
            const p = 0.45, a = 1;
            const s = p / (2 * PI) * Math.asin(1 / a);
            t *= 2;
            if (t < 1)
                return -0.5 * (a * pow(2, 10 * (t -= 1)) * sin((t - s) * (2 * PI) / p));
            return a * pow(2, -10 * (t -= 1)) * sin((t - s) * (2 * PI) / p) * 0.5 + 1;
        };
        E.bounceOut = (t) => {
            if (t < 1 / 2.75)
                return 7.5625 * t * t;
            if (t < 2 / 2.75)
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75)
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        };
        E.bounceIn = (t) => 1 - E.bounceOut(1 - t);
        E.bounceInOut = (t) => (t < 0.5) ? E.bounceIn(t * 2) * 0.5 : E.bounceOut(t * 2 - 1) * 0.5 + 0.5;
        return E;
    })();
    class Tween {
        constructor(target, props) {
            this.steps = [];
            this.stepIndex = 0;
            this.stepElapsed = 0;
            this._paused = false;
            this._loop = false;
            this._done = false;
            this._bornFrame = 0; // the frame this tween was created on
            this.target = target;
            this._bornFrame = Tween._frame;
            if (props) {
                this._loop = !!props.loop;
                this._onChange = props.onChange;
                this._onChangeObj = props.onChangeObj;
            }
        }
        static get(target, props) {
            Tween.ensureTicker();
            if (props && props.override)
                Tween.removeTweens(target);
            const t = new Tween(target, props);
            Tween._all.push(t);
            return t;
        }
        static removeTweens(target) {
            const removed = Tween._all.filter(t => t.target === target);
            Tween._all = Tween._all.filter(t => t.target !== target);
            for (const t of removed)
                t.flushCallsOnRemove();
        }
        static removeAllTweens() {
            const removed = Tween._all.slice();
            Tween._all.length = 0;
            for (const t of removed)
                t.flushCallsOnRemove();
        }
        // When a tween is cancelled (removeTweens), run its REMAINING `call` steps.
        // The game's AnimationFactory resolves its animation promises via a trailing
        // .call(resolve) — if a third party removes the tween mid-flight (init shuffle
        // cleanup, floating(stop), …) the promise would otherwise pend FOREVER, leaving
        // Battle.fireEvent's lastEventType set and poisoning every later event
        // ("event overlapped" → battle stops responding after e.g. killing a monster).
        // Other .call uses here are cleanup (remove mask shape, decBlockLayer) — safe
        // and desirable on cancellation as well.
        flushCallsOnRemove() {
            if (this._done)
                return;
            this._done = true;
            for (let i = Math.max(0, this.stepIndex); i < this.steps.length; i++) {
                const s = this.steps[i];
                if (s.kind === "call" && s.fn && !s.__begun) {
                    try {
                        s.fn.apply(s.thiz, s.params || []);
                    }
                    catch (e) { }
                }
            }
        }
        static pauseTweens(target) { Tween._all.forEach(t => { if (t.target === target)
            t._paused = true; }); }
        static resumeTweens(target) { Tween._all.forEach(t => { if (t.target === target)
            t._paused = false; }); }
        static ensureTicker() {
            if (Tween._started)
                return;
            Tween._started = true;
            PIXI.Ticker.shared.add(() => {
                Tween._frame++;
                const dt = PIXI.Ticker.shared.deltaMS;
                Tween.tickAll(dt);
            });
        }
        static tickAll(dt) {
            for (let i = Tween._all.length - 1; i >= 0; i--) {
                const t = Tween._all[i];
                if (t._paused || t._done)
                    continue;
                // Don't advance a tween on the same frame it was created. The game
                // builds a tween (often all zero-duration steps) then synchronously
                // pause()s it for chaining (aniSeq/aniGroup). If the ticker fired
                // between get() and pause(), a zero-duration tween would run to
                // completion + fire its onEnded BEFORE the sequence finished wiring its
                // siblings — leaving later children paused forever (animation promise
                // never resolves → event system poisoned → battle freeze on use/throw).
                // Deferring the first advance by one frame lets all synchronous setup
                // (pause, onStarted/onEnded wiring) settle first. Matches egret, where
                // the frame callback always runs after the current JS turn.
                if (t._bornFrame === Tween._frame)
                    continue;
                t.advance(dt);
                if (t._done)
                    Tween._all.splice(i, 1);
            }
        }
        to(props, duration = 0, ease) {
            this.steps.push({ kind: "to", props: Object.assign({}, props), duration, ease });
            return this;
        }
        wait(duration) {
            this.steps.push({ kind: "wait", duration });
            return this;
        }
        set(props) {
            this.steps.push({ kind: "set", props: Object.assign({}, props) });
            return this;
        }
        call(fn, thiz, params) {
            this.steps.push({ kind: "call", fn, thiz, params });
            return this;
        }
        play() { this._paused = false; return this; }
        pause() { this._paused = true; return this; }
        setPaused(p) { this._paused = p; return this; }
        get paused() { return this._paused; }
        beginStep(s) {
            if (s.kind === "to") {
                s.starts = {};
                for (const k in s.props)
                    s.starts[k] = +this.target[k] || 0;
                if (!s.duration || s.duration <= 0) {
                    for (const k in s.props)
                        this.target[k] = s.props[k];
                    if (this._onChange)
                        this._onChange.call(this._onChangeObj);
                }
            }
            else if (s.kind === "set") {
                for (const k in s.props)
                    this.target[k] = s.props[k];
            }
            else if (s.kind === "call") {
                if (s.fn)
                    s.fn.apply(s.thiz, s.params || []);
            }
        }
        advance(dt) {
            // initialise first step lazily
            if (this.stepElapsed === 0 && this.stepIndex < this.steps.length && !this.steps[this.stepIndex].__begun) {
                this.steps[this.stepIndex].__begun = true;
                this.beginStep(this.steps[this.stepIndex]);
            }
            let guard = 0;
            while (this.stepIndex < this.steps.length && guard++ < 1000) {
                const s = this.steps[this.stepIndex];
                const dur = s.duration || 0;
                if (s.kind === "to" && dur > 0) {
                    this.stepElapsed += dt;
                    let r = this.stepElapsed / dur;
                    if (r > 1)
                        r = 1;
                    const e = s.ease ? s.ease(r) : r;
                    for (const k in s.props) {
                        const a = s.starts[k];
                        const b = s.props[k];
                        this.target[k] = a + (b - a) * e;
                    }
                    if (this._onChange)
                        this._onChange.call(this._onChangeObj);
                    if (r >= 1) {
                        this.nextStep();
                        continue;
                    }
                    return; // still animating this step
                }
                else if (s.kind === "wait" && dur > 0) {
                    this.stepElapsed += dt;
                    if (this.stepElapsed >= dur) {
                        this.nextStep();
                        continue;
                    }
                    return;
                }
                else {
                    // zero-duration to/set/call already handled in beginStep
                    this.nextStep();
                    continue;
                }
            }
            if (this.stepIndex >= this.steps.length) {
                if (this._loop && this.steps.length) {
                    this.stepIndex = 0;
                    this.stepElapsed = 0;
                    for (const st of this.steps)
                        st.__begun = false;
                    this.steps[0].__begun = true;
                    this.beginStep(this.steps[0]);
                }
                else {
                    this._done = true;
                }
            }
        }
        nextStep() {
            this.stepIndex++;
            this.stepElapsed = 0;
            if (this.stepIndex < this.steps.length) {
                this.steps[this.stepIndex].__begun = true;
                this.beginStep(this.steps[this.stepIndex]);
            }
        }
    }
    Tween._all = [];
    Tween._started = false;
    Tween._frame = 0; // increments once per ticker frame
    egret.Tween = Tween;
})(egret || (egret = {}));
// ============================================================================
// Egret -> PixiJS shim : MOVIECLIP (sprite-sheet frame animation)
// Format: { mc: { clip: { frameRate, frames:[{res,x,y}] } }, res:{ key:{x,y,w,h} } }
// ============================================================================
var egret;
(function (egret) {
    class MovieClipDataFactory {
        constructor(data, texture) {
            this.data = data;
            this.base = texture && texture.$pixiTexture ? texture.$pixiTexture.baseTexture : null;
        }
        generateMovieClipData(clipName = "default") {
            const mc = this.data.mc[clipName] || this.data.mc[Object.keys(this.data.mc)[0]];
            const res = this.data.res;
            const frames = (mc.frames || []).map((fr) => {
                const r = res[fr.res];
                const tex = (r && this.base) ? new PIXI.Texture(this.base, new PIXI.Rectangle(r.x, r.y, r.w, r.h)) : PIXI.Texture.EMPTY;
                return { texture: tex, x: fr.x || 0, y: fr.y || 0, w: r ? r.w : 0, h: r ? r.h : 0 };
            });
            return { frames, frameRate: mc.frameRate || 24, clipName };
        }
    }
    egret.MovieClipDataFactory = MovieClipDataFactory;
    class MovieClip extends egret.DisplayObjectContainer {
        constructor(data) {
            super();
            this.totalFrames = 0;
            this.frameInterval = 1000 / 24;
            this.curFrame = 0;
            this.playing = false;
            this.playTimes = -1;
            this.loopCount = 0;
            this._acc = 0;
            this.frameRate = 24;
            this.spr = new PIXI.Sprite();
            super.addChild(this.spr);
            if (data)
                this.setMovieClipData(data);
            this._tick = ( /*delta*/) => this.update(PIXI.Ticker.shared.deltaMS);
        }
        setMovieClipData(d) {
            this.mcData = d;
            this.totalFrames = d.frames.length;
            this.frameRate = d.frameRate || 24;
            this.frameInterval = 1000 / this.frameRate;
            if (this.totalFrames)
                this.gotoFrame(0);
        }
        get totalFramesCount() { return this.totalFrames; }
        get currentFrame() { return this.curFrame; }
        gotoFrame(i) {
            if (!this.mcData)
                return;
            const f = this.mcData.frames[i];
            if (!f)
                return;
            this.spr.texture = f.texture;
            this.spr.x = f.x;
            this.spr.y = f.y;
            this.curFrame = i;
        }
        gotoAndPlay(frame, playTimes = 1) {
            this.gotoFrame(frame);
            this.playTimes = playTimes;
            this.loopCount = 0;
            this._acc = 0;
            this.startTick();
        }
        gotoAndStop(frame) { this.gotoFrame(frame); this.stop(); }
        play(playTimes = 1) { this.gotoAndPlay(this.curFrame, playTimes); }
        stop() { this.playing = false; PIXI.Ticker.shared.remove(this._tick); }
        startTick() {
            if (!this.playing) {
                this.playing = true;
                PIXI.Ticker.shared.add(this._tick);
            }
        }
        update(dt) {
            if (!this.playing || !this.totalFrames)
                return;
            this._acc += dt;
            while (this._acc >= this.frameInterval) {
                this._acc -= this.frameInterval;
                let next = this.curFrame + 1;
                if (next >= this.totalFrames) {
                    this.loopCount++;
                    const infinite = this.playTimes < 0;
                    if (!infinite && this.loopCount >= this.playTimes) {
                        this.gotoFrame(this.totalFrames - 1);
                        this.stop();
                        this.dispatchEvent(new egret.Event(egret.Event.COMPLETE));
                        return;
                    }
                    next = 0;
                    this.dispatchEvent(new egret.Event(egret.Event.LOOP_COMPLETE));
                }
                this.gotoFrame(next);
            }
        }
    }
    egret.MovieClip = MovieClip;
})(egret || (egret = {}));
// ============================================================================
// Egret RES -> PixiJS Assets resource manager
// Reads Egret's default.res.json (groups + resources) and loads via PIXI.Assets.
// ============================================================================
var RES;
(function (RES) {
    let prefix = "";
    const byName = {};
    const groups = {};
    const loaded = {};
    async function loadConfig(url, resourceRoot) {
        prefix = resourceRoot || "";
        const cfg = await (await fetch(url)).json();
        for (const item of cfg.resources || [])
            byName[item.name] = item;
        for (const g of cfg.groups || []) {
            const keys = (typeof g.keys === "string") ? g.keys.split(",") : (g.keys || []);
            groups[g.name] = keys.map((k) => k.trim()).filter((k) => k);
        }
    }
    RES.loadConfig = loadConfig;
    function getGroupByName(group) {
        return (groups[group] || []).map(n => byName[n]).filter(Boolean);
    }
    RES.getGroupByName = getGroupByName;
    function hasRes(name) { return loaded[name] !== undefined || !!byName[name]; }
    RES.hasRes = hasRes;
    function getRes(name) { return loaded[name]; }
    RES.getRes = getRes;
    function getResAsync(name, cb, thiz) {
        if (loaded[name] !== undefined) {
            if (cb)
                cb.call(thiz, loaded[name]);
            return Promise.resolve(loaded[name]);
        }
        const item = byName[name];
        if (!item) {
            if (cb)
                cb.call(thiz, null);
            return Promise.resolve(null);
        }
        return loadOne(item).then(r => { if (cb)
            cb.call(thiz, r); return r; });
    }
    RES.getResAsync = getResAsync;
    function getResByUrl(url, cb, thiz, type) {
        return loadByUrl(url, type || guessType(url)).then(r => { if (cb)
            cb.call(thiz, r); return r; });
    }
    RES.getResByUrl = getResByUrl;
    function setMaxLoadingThread(_n) { }
    RES.setMaxLoadingThread = setMaxLoadingThread;
    function setMaxRetryTimes(_n) { }
    RES.setMaxRetryTimes = setMaxRetryTimes;
    async function loadGroup(group, priority = 0, reporter) {
        const items = getGroupByName(group);
        const total = items.length;
        let done = 0;
        await Promise.all(items.map(async (item) => {
            try {
                await loadOne(item);
            }
            catch (e) {
                egret.warn("RES load failed: " + item.name, e);
            }
            done++;
            if (reporter && reporter.onProgress)
                reporter.onProgress(done, total);
        }));
    }
    RES.loadGroup = loadGroup;
    function guessType(url) {
        if (/\.(png|jpg|jpeg|webp)$/i.test(url))
            return "image";
        if (/\.(mp3|ogg|wav)$/i.test(url))
            return "sound";
        if (/\.(json|fnt)$/i.test(url))
            return "json";
        return "text";
    }
    async function loadOne(item) {
        if (loaded[item.name] !== undefined)
            return loaded[item.name];
        const url = prefix + item.url;
        const r = await loadByUrl(url, item.type);
        loaded[item.name] = r;
        return r;
    }
    async function loadByUrl(url, type) {
        if (type === "image") {
            const tex = await PIXI.Assets.load(url);
            return egret.Texture.fromPixi(tex);
        }
        if (type === "json") {
            const res = await fetch(url);
            return await res.json();
        }
        if (type === "sound") {
            const s = new egret.Sound();
            await s.load(url);
            return s;
        }
        // text / default
        const res = await fetch(url);
        return await res.text();
    }
})(RES || (RES = {}));
// ============================================================================
// Egret -> Howler shim : SOUND
// egret.Sound / SoundChannel backed by Howler.js (global Howl).
// ============================================================================
var egret;
(function (egret) {
    class SoundChannel extends egret.EventDispatcher {
        constructor(howl, id) { super(); this.howl = howl; this.id = id; }
        get volume() { return this.howl.volume(this.id); }
        set volume(v) { this.howl.volume(v, this.id); }
        get position() { return this.howl.seek(this.id) * 1000; }
        stop() { try {
            this.howl.stop(this.id);
        }
        catch (e) { } }
    }
    egret.SoundChannel = SoundChannel;
    class Sound extends egret.EventDispatcher {
        constructor() {
            super(...arguments);
            this.type = Sound.EFFECT;
            this.length = 0;
            this.url = "";
        }
        load(url) {
            this.url = url;
            return new Promise((resolve) => {
                this.howl = new Howl({
                    src: [url],
                    preload: true,
                    html5: false,
                    onload: () => { this.length = this.howl.duration() * 1000; resolve(); },
                    onloaderror: () => { egret.warn("sound load error: " + url); resolve(); },
                });
            });
        }
        // egret: play(startTime=0, loops=0). loops<0 => infinite.
        play(startTime = 0, loops = 1) {
            if (!this.howl)
                return new SoundChannel({ stop() { }, volume() { }, seek() { return 0; } }, 0);
            const infinite = loops < 0;
            this.howl.loop(infinite);
            const id = this.howl.play();
            if (startTime)
                this.howl.seek(startTime, id);
            const ch = new SoundChannel(this.howl, id);
            if (!infinite) {
                this.howl.once("end", () => ch.dispatchEventWith(egret.Event.SOUND_COMPLETE), id);
            }
            return ch;
        }
        close() { if (this.howl)
            this.howl.unload(); }
    }
    Sound.MUSIC = "music";
    Sound.EFFECT = "effect";
    egret.Sound = Sound;
})(egret || (egret = {}));
// ============================================================================
// Egret -> PixiJS shim : SYSTEM
// Ticker, timers, lifecycle, localStorage, ByteArray, Base64Util,
// ExternalInterface.
// ============================================================================
var egret;
(function (egret) {
    // ---- Ticker (frame callbacks; delta in ms) ----------------------------
    class Ticker {
        constructor() {
            this.map = new Map();
        }
        static getInstance() { return Ticker._inst || (Ticker._inst = new Ticker()); }
        register(fn, thiz) {
            const cb = () => fn.call(thiz, PIXI.Ticker.shared.deltaMS);
            this.map.set(fn, cb);
            PIXI.Ticker.shared.add(cb);
        }
        unregister(fn, thiz) {
            const cb = this.map.get(fn);
            if (cb) {
                PIXI.Ticker.shared.remove(cb);
                this.map.delete(fn);
            }
        }
        pause() { PIXI.Ticker.shared.stop(); }
        resume() { PIXI.Ticker.shared.start(); }
    }
    egret.Ticker = Ticker;
    egret.ticker = {
        pause() { PIXI.Ticker.shared.stop(); },
        resume() { PIXI.Ticker.shared.start(); },
    };
    // sys ticker namespace used by some egret APIs
    function startTick(callback, thiz) {
        const cb = () => callback.call(thiz, performance.now());
        PIXI.Ticker.shared.add(cb);
    }
    egret.startTick = startTick;
    // ---- timers -----------------------------------------------------------
    const intervalMap = {};
    let timerId = 1;
    function setInterval(fn, thiz, delay, ...args) {
        const id = timerId++;
        intervalMap[id] = window.setInterval(() => fn.apply(thiz, args), delay);
        return id;
    }
    egret.setInterval = setInterval;
    function clearInterval(id) {
        if (intervalMap[id]) {
            window.clearInterval(intervalMap[id]);
            delete intervalMap[id];
        }
    }
    egret.clearInterval = clearInterval;
    function setTimeout(fn, thiz, delay, ...args) {
        const id = timerId++;
        intervalMap[id] = window.setTimeout(() => fn.apply(thiz, args), delay);
        return id;
    }
    egret.setTimeout = setTimeout;
    function clearTimeout(id) {
        if (intervalMap[id]) {
            window.clearTimeout(intervalMap[id]);
            delete intervalMap[id];
        }
    }
    egret.clearTimeout = clearTimeout;
    // ---- Timer class ------------------------------------------------------
    class Timer extends egret.EventDispatcher {
        constructor(delay, repeatCount = 0) {
            super();
            this.currentCount = 0;
            this.running = false;
            this.delay = delay;
            this.repeatCount = repeatCount;
        }
        start() {
            if (this.running)
                return;
            this.running = true;
            this.handle = window.setInterval(() => {
                this.currentCount++;
                this.dispatchEventWith(egret.TimerEvent.TIMER);
                if (this.repeatCount > 0 && this.currentCount >= this.repeatCount) {
                    this.stop();
                    this.dispatchEventWith(egret.TimerEvent.TIMER_COMPLETE);
                }
            }, this.delay);
        }
        stop() { this.running = false; if (this.handle)
            window.clearInterval(this.handle); }
        reset() { this.stop(); this.currentCount = 0; }
    }
    egret.Timer = Timer;
    // ---- lifecycle --------------------------------------------------------
    egret.lifecycle = {
        onPause: () => { },
        onResume: () => { },
        contextResize: () => { },
        stage: null,
        addLifecycleListener(plugin) {
            const context = { onUpdate: () => { }, pause: () => { }, resume: () => { } };
            try {
                plugin(context);
            }
            catch (e) { }
        },
    };
    // ---- storage ----------------------------------------------------------
    egret.localStorage = {
        getItem(key) { try {
            return window.localStorage.getItem(key) || "";
        }
        catch (e) {
            return "";
        } },
        setItem(key, value) { try {
            window.localStorage.setItem(key, value);
        }
        catch (e) { } },
        removeItem(key) { try {
            window.localStorage.removeItem(key);
        }
        catch (e) { } },
        clear() { try {
            window.localStorage.clear();
        }
        catch (e) { } },
    };
    // ---- ByteArray (minimal, self-consistent UTF round-trip) --------------
    class ByteArray {
        constructor(buffer) {
            this.bytes = [];
            this.position = 0;
            if (buffer) {
                const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
                this.bytes = Array.from(u8);
            }
        }
        get length() { return this.bytes.length; }
        get bytesAvailable() { return this.bytes.length - this.position; }
        get buffer() { return new Uint8Array(this.bytes).buffer; }
        writeUTF(str) {
            const u8 = new TextEncoder().encode(str);
            this.bytes.push((u8.length >>> 8) & 0xff, u8.length & 0xff);
            for (let i = 0; i < u8.length; i++)
                this.bytes.push(u8[i]);
        }
        readUTF() {
            const len = (this.bytes[this.position] << 8) | this.bytes[this.position + 1];
            this.position += 2;
            const slice = this.bytes.slice(this.position, this.position + len);
            this.position += len;
            return new TextDecoder().decode(new Uint8Array(slice));
        }
        writeBytes(u8) { for (let i = 0; i < u8.length; i++)
            this.bytes.push(u8[i]); }
        clear() { this.bytes = []; this.position = 0; }
    }
    egret.ByteArray = ByteArray;
    egret.Base64Util = {
        encode(buffer) {
            const u8 = new Uint8Array(buffer);
            let s = "";
            for (let i = 0; i < u8.length; i++)
                s += String.fromCharCode(u8[i]);
            return btoa(s);
        },
        decode(base64) {
            const s = atob(base64);
            const u8 = new Uint8Array(s.length);
            for (let i = 0; i < s.length; i++)
                u8[i] = s.charCodeAt(i);
            return u8.buffer;
        },
    };
    // ---- native bridge (web no-op) ----------------------------------------
    egret.ExternalInterface = {
        callbacks: {},
        addCallback(name, fn) { this.callbacks[name] = fn; },
        call(name, value) { },
    };
})(egret || (egret = {}));
// ============================================================================
// Egret -> PixiJS shim : EXTRAS
// BlendMode, HttpRequest, RenderTexture, ScrollView
// ============================================================================
var egret;
(function (egret) {
    // ---- BlendMode (egret string consts -> PIXI numeric blend modes) ------
    egret.BlendMode = {
        NORMAL: PIXI.BLEND_MODES.NORMAL,
        ADD: PIXI.BLEND_MODES.ADD,
        ERASE: (PIXI.BLEND_MODES.ERASE !== undefined ? PIXI.BLEND_MODES.ERASE : PIXI.BLEND_MODES.NORMAL),
        MULTIPLY: PIXI.BLEND_MODES.MULTIPLY,
        SCREEN: PIXI.BLEND_MODES.SCREEN,
    };
    // ---- HTTP (XMLHttpRequest based) --------------------------------------
    egret.HttpMethod = { GET: "GET", POST: "POST" };
    egret.HttpResponseType = { TEXT: "text", ARRAY_BUFFER: "arraybuffer" };
    class IOErrorEvent extends egret.Event {
    }
    IOErrorEvent.IO_ERROR = "ioError";
    egret.IOErrorEvent = IOErrorEvent;
    class HttpRequest extends egret.EventDispatcher {
        constructor() {
            super(...arguments);
            this.responseType = egret.HttpResponseType.TEXT;
            this.response = null;
            this.withCredentials = false;
            this.xhr = new XMLHttpRequest();
            this.headers = [];
        }
        open(url, method = egret.HttpMethod.GET) {
            this.xhr.open(method, url, true);
        }
        setRequestHeader(header, value) {
            this.headers.push([header, value]);
        }
        send(data) {
            const xhr = this.xhr;
            try {
                for (const [h, v] of this.headers)
                    xhr.setRequestHeader(h, v);
            }
            catch (e) { }
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4)
                    return;
                if (xhr.status >= 200 && xhr.status < 300) {
                    this.response = xhr.responseText;
                    const ev = new egret.Event(egret.Event.COMPLETE);
                    ev.target = this;
                    ev.currentTarget = this;
                    this.dispatchEvent(ev);
                }
                else {
                    const ev = new IOErrorEvent(IOErrorEvent.IO_ERROR);
                    ev.target = this;
                    ev.currentTarget = this;
                    this.dispatchEvent(ev);
                }
            };
            xhr.onerror = () => {
                const ev = new IOErrorEvent(IOErrorEvent.IO_ERROR);
                ev.target = this;
                ev.currentTarget = this;
                this.dispatchEvent(ev);
            };
            try {
                xhr.send(data);
            }
            catch (e) {
                const ev = new IOErrorEvent(IOErrorEvent.IO_ERROR);
                this.dispatchEvent(ev);
            }
        }
        abort() { try {
            this.xhr.abort();
        }
        catch (e) { } }
    }
    egret.HttpRequest = HttpRequest;
    // ---- RenderTexture (snapshot a display object into a texture) ---------
    class RenderTexture extends egret.Texture {
        constructor() { super(PIXI.Texture.EMPTY); }
        // Uses renderer.generateTexture, which temp-parents the object and renders
        // it relative to its LOCAL bounds. (renderer.render() with a renderTexture
        // applied the object's WORLD transform, so any stage-attached object — e.g.
        // the drag-source GridView — rendered outside the texture: blank snapshot,
        // invisible drag image. Verified by pixel counts: 0 vs 7312 non-transparent.)
        drawToTexture(displayObject, clipBounds, scale = 1) {
            if (!egret.$app || !displayObject)
                return false;
            try {
                // egret saturates an erase/draw by allowing alpha > 1 (e.g. the world-map
                // mist punches its fog-of-war hole with an ERASE sprite at alpha 10).
                // PIXI clamps worldAlpha to [0,1], so such an erase barely opens the hole
                // (most of the map stayed dark). Replicate the >1 intensity by drawing
                // those children ceil(alpha) times (each pass erases again). Done on a
                // temp clone-list so the live scene is untouched; restored after render.
                const expanded = this.__expandOverAlpha(displayObject);
                const opts = { resolution: scale > 0 ? scale : 1 };
                if (clipBounds)
                    opts.region = new PIXI.Rectangle(clipBounds.x, clipBounds.y, clipBounds.width, clipBounds.height);
                const old = this.$pixiTexture;
                this.$pixiTexture = egret.$app.renderer.generateTexture(displayObject, opts);
                if (expanded)
                    this.__restoreOverAlpha(displayObject, expanded);
                if (old && old !== PIXI.Texture.EMPTY && old.destroy) {
                    try {
                        old.destroy(true);
                    }
                    catch (e) { }
                }
                return true;
            }
            catch (e) {
                egret.warn("drawToTexture failed", e);
                return false;
            }
        }
        // Find direct children whose alpha>1 (egret intensity boost); for each, insert
        // extra duplicate render passes after it so the cumulative blend matches egret.
        // Returns the list of temp-inserted clones to remove afterwards, or null.
        __expandOverAlpha(obj) {
            if (!obj || !obj.children || !obj.children.length)
                return null;
            const inserted = [];
            const kids = obj.children.slice();
            for (const c of kids) {
                const a = c.alpha;
                if (typeof a === "number" && a > 1.001) {
                    const reps = Math.min(20, Math.ceil(a)) - 1; // it already draws once
                    const idx = obj.getChildIndex(c);
                    c.alpha = 1;
                    for (let r = 0; r < reps; r++) {
                        // a lightweight PIXI sprite clone that reuses the same texture +
                        // transform + blend, drawn at alpha 1 to stack the erase/effect.
                        const clone = new PIXI.Sprite(c._tex && c._tex.$pixiTexture ? c._tex.$pixiTexture : (c.texture || PIXI.Texture.EMPTY));
                        clone.position.set(c.position.x, c.position.y);
                        clone.scale.set(c.scale.x, c.scale.y);
                        clone.rotation = c.rotation;
                        clone.pivot.set(c.pivot.x, c.pivot.y);
                        try {
                            clone.width = c.width;
                            clone.height = c.height;
                        }
                        catch (e) { }
                        clone.blendMode = c.blendMode;
                        clone.alpha = 1;
                        clone.__overAlphaRestore = c; // remember source
                        clone.__overAlphaOrig = a;
                        obj.addChildAt(clone, idx + 1 + r);
                        inserted.push({ clone, src: c, orig: a });
                    }
                }
            }
            return inserted.length ? inserted : null;
        }
        __restoreOverAlpha(obj, inserted) {
            for (const e of inserted) {
                if (e.clone.parent)
                    e.clone.parent.removeChild(e.clone);
                try {
                    e.clone.destroy();
                }
                catch (err) { }
                e.src.alpha = e.orig; // restore the original >1 alpha on the live child
            }
        }
        getPixels() { return []; }
    }
    egret.RenderTexture = RenderTexture;
    // ---- ScrollView (viewport + clip + drag scrolling) -------------------
    class ScrollView extends egret.DisplayObjectContainer {
        constructor(content) {
            super();
            this._vw = 0;
            this._vh = 0;
            this.verticalScrollPolicy = "auto";
            this.horizontalScrollPolicy = "auto";
            this.bounces = true;
            this.scrollBeginThreshold = 10;
            this.dragging = false;
            this.lastX = 0;
            this.lastY = 0;
            this.maskG = new PIXI.Graphics();
            super.addChild(this.maskG);
            this.mask = this.maskG;
            this.eventMode = "static";
            this.on("pointerdown", (e) => this.onDown(e));
            this.on("pointermove", (e) => this.onMove(e));
            this.on("pointerup", () => this.dragging = false);
            this.on("pointerupoutside", () => this.dragging = false);
            if (content)
                this.setContent(content);
        }
        setContent(content) {
            if (this._content && this._content.parent === this)
                super.removeChild(this._content);
            this._content = content;
            if (content)
                super.addChild(content);
            this.refreshMask();
        }
        removeContent() {
            if (this._content && this._content.parent === this)
                super.removeChild(this._content);
            this._content = undefined;
        }
        get width() { return this._vw; }
        set width(v) { this._vw = v; this.refreshMask(); }
        get height() { return this._vh; }
        set height(v) { this._vh = v; this.refreshMask(); }
        setContentSize(w, h) { this._vw = w; this._vh = h; this.refreshMask(); }
        refreshMask() {
            this.maskG.clear();
            this.maskG.beginFill(0xffffff, 1);
            this.maskG.drawRect(0, 0, this._vw || 1, this._vh || 1);
            this.maskG.endFill();
        }
        get scrollTop() { return this._content ? -this._content.y : 0; }
        set scrollTop(v) { if (this._content)
            this._content.y = -this.clampV(v); }
        get scrollLeft() { return this._content ? -this._content.x : 0; }
        set scrollLeft(v) { if (this._content)
            this._content.x = -this.clampH(v); }
        get verticalScrollPosition() { return this.scrollTop; }
        set verticalScrollPosition(v) { this.scrollTop = v; }
        get horizontalScrollPosition() { return this.scrollLeft; }
        set horizontalScrollPosition(v) { this.scrollLeft = v; }
        contentH() { try {
            return this._content ? this._content.height : 0;
        }
        catch (e) {
            return 0;
        } }
        contentW() { try {
            return this._content ? this._content.width : 0;
        }
        catch (e) {
            return 0;
        } }
        clampV(v) { const max = Math.max(0, this.contentH() - this._vh); return Math.min(Math.max(0, v), max); }
        clampH(v) { const max = Math.max(0, this.contentW() - this._vw); return Math.min(Math.max(0, v), max); }
        onDown(e) { this.dragging = true; this.lastX = e.global.x; this.lastY = e.global.y; }
        onMove(e) {
            if (!this.dragging || !this._content)
                return;
            if (this.verticalScrollPolicy !== "off") {
                const dy = e.global.y - this.lastY;
                this._content.y = -this.clampV(-this._content.y - dy);
            }
            if (this.horizontalScrollPolicy === "on" || this.horizontalScrollPolicy === "auto") {
                const dx = e.global.x - this.lastX;
                if (this.contentW() > this._vw)
                    this._content.x = -this.clampH(-this._content.x - dx);
            }
            this.lastX = e.global.x;
            this.lastY = e.global.y;
        }
        stopAnimation() { this.dragging = false; }
    }
    egret.ScrollView = ScrollView;
})(egret || (egret = {}));
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
(function () {
    try {
        if (typeof dragonBones === "undefined" || !dragonBones.PixiFactory) {
            console.error("DragonBones Pixi runtime not loaded before egret-shim.");
            return;
        }
        // Events: the game references dragonBones.AnimationEvent.COMPLETE etc.
        if (!dragonBones.AnimationEvent)
            dragonBones.AnimationEvent = dragonBones.EventObject;
        // A default WorldClock the game adds armatures to and advances each frame.
        if (!dragonBones.WorldClock.clock)
            dragonBones.WorldClock.clock = new dragonBones.WorldClock();
        // The game owns the frame clock; don't let the factory double-advance.
        dragonBones.PixiFactory.useSharedTicker = false;
        // egret-style event API on the armature display (PIXI EventEmitter under the hood).
        const P = dragonBones.PixiArmatureDisplay && dragonBones.PixiArmatureDisplay.prototype;
        if (P && !P.addEventListener) {
            P.addEventListener = function (type, listener, thiz) { this.on(type, listener, thiz); };
            P.removeEventListener = function (type, listener, thiz) { this.off(type, listener, thiz); };
            P.hasEventListener = function (type) { return this.listenerCount(type) > 0; };
            P.dispatchEvent = function (ev) { this.emit(ev && ev.type ? ev.type : ev, ev); };
        }
        // EgretFactory shim: a PixiFactory whose parseTextureAtlasData accepts an
        // egret.Texture (our shim) / PIXI.Texture / BaseTexture interchangeably.
        function EgretFactory() {
            dragonBones.PixiFactory.call(this);
        }
        EgretFactory.prototype = Object.create(dragonBones.PixiFactory.prototype);
        EgretFactory.prototype.constructor = EgretFactory;
        EgretFactory.prototype.parseTextureAtlasData = function (rawData, textureAtlas, name, scale) {
            let tex = textureAtlas;
            if (tex && tex.$pixiTexture)
                tex = tex.$pixiTexture; // egret.Texture -> PIXI.Texture
            if (tex && tex.baseTexture)
                tex = tex.baseTexture; // PIXI.Texture  -> BaseTexture
            return dragonBones.PixiFactory.prototype.parseTextureAtlasData.call(this, rawData, tex, name, scale);
        };
        dragonBones.EgretFactory = EgretFactory;
    }
    catch (e) {
        console.error("DragonBones adapter init failed (continuing):", e);
    }
})();
// ============================================================================
// Egret -> PixiJS shim : STAGE + BOOTSTRAP
// Creates the PIXI.Application, an egret Stage root, and runs the entry class.
// ============================================================================
var egret;
(function (egret) {
    class Stage extends egret.DisplayObjectContainer {
        constructor() {
            super();
            this.stageWidth = 0;
            this.stageHeight = 0;
            this.frameRate = 30;
            this.orientation = egret.OrientationMode.PORTRAIT;
            this.scaleMode = egret.StageScaleMode.SHOW_ALL;
            this.maxTouches = 2;
            this.textureScaleFactor = 1;
            this.__isStage = true;
        }
        setContentSize(w, h) { this.stageWidth = w; this.stageHeight = h; }
        invalidate() { }
    }
    egret.Stage = Stage;
    egret.sys = { stage: null };
    function runEgret(options) {
        const container = document.querySelector(".egret-player") ||
            document.body;
        // Fixed internal portrait resolution (matches the game's design size);
        // the canvas is CSS-scaled to fit the viewport.
        const w = 640;
        const h = 1136;
        // autoDensity:true lets PIXI manage the canvas CSS and, crucially, keeps the
        // EventSystem's client->global coordinate mapping correct for REAL browser
        // pointer events (login taps + guide synthesis rely on this). We still own
        // the letterbox in fitCanvas() below.
        const app = new PIXI.Application({
            width: w,
            height: h,
            backgroundColor: options.backgroundColor != null ? options.backgroundColor : 0x000000,
            antialias: options.antialias !== false,
            resolution: 1,
            autoDensity: true,
        });
        egret.$app = app;
        egret.sys.app = app;
        const view = app.view;
        view.style.display = "block";
        view.style.position = "absolute";
        container.style.position = "relative";
        container.appendChild(view);
        // DRAG FIX (the real one, verified with real-input traces):
        // While a button is held, PIXI v7 routes pointermove/pointerup using the PRESS
        // position — every touchMove/touchEnd lands on the press grid, so drags never
        // reach the grid under the cursor (taps still work: down+up share a position).
        // Egret instead hit-tests EVERY move/up at its current coordinates.
        // This DOM-level bridge restores egret semantics: during a press it hit-tests
        // each pointermove/pointerup at its true position and dispatches touchMove/
        // touchEnd to the egret object actually under the cursor. fanEvent() in
        // 10-display.ts suppresses PIXI's mis-routed touchMove/touchEnd while
        // __bridgePress is set, so objects see exactly one, correct, event stream.
        const client2global = (e) => {
            const r = view.getBoundingClientRect();
            if (!(r.width > 0) || !(r.height > 0))
                return null;
            return {
                x: (e.clientX - r.left) * view.width / r.width,
                y: (e.clientY - r.top) * view.height / r.height,
            };
        };
        // top-most egret object at (x,y) that has listeners for `type` (walk up = bubble)
        const hitWithListeners = (type, x, y) => {
            try {
                const eb = app.renderer.events.rootBoundary;
                eb.rootTarget = app.stage;
                let o = eb.hitTest(x, y);
                while (o && !(o.__listeners && o.__listeners[type] && o.__listeners[type].length))
                    o = o.parent;
                return o || null;
            }
            catch (err) {
                return null;
            }
        };
        let bridgePressLeaf = null; // object hit at press time (for RELEASE_OUTSIDE)
        view.addEventListener("pointerdown", (e) => {
            if (e.button !== 0)
                return;
            window.__bridgePress = true;
            const g = client2global(e);
            bridgePressLeaf = g ? (() => {
                try {
                    const eb = app.renderer.events.rootBoundary;
                    eb.rootTarget = app.stage;
                    return eb.hitTest(g.x, g.y);
                }
                catch (err) {
                    return null;
                }
            })() : null;
        }, true);
        document.addEventListener("pointermove", (e) => {
            if (!window.__bridgePress || !(e.buttons & 1))
                return;
            const g = client2global(e);
            if (!g)
                return;
            const t = hitWithListeners("touchMove", g.x, g.y);
            if (t)
                egret.TouchEvent.dispatchTouchEvent(t, "touchMove", true, true, g.x, g.y, e.pointerId, true);
        }, true);
        document.addEventListener("pointerup", (e) => {
            if (!window.__bridgePress || e.button !== 0)
                return;
            window.__bridgePress = false;
            const g = client2global(e);
            const drop = g ? hitWithListeners("touchEnd", g.x, g.y) : null;
            // egret order: TOUCH_END to the object under the release point first…
            if (drop && g)
                egret.TouchEvent.dispatchTouchEvent(drop, "touchEnd", true, true, g.x, g.y, e.pointerId, false);
            // …then TOUCH_RELEASE_OUTSIDE to the press target if released elsewhere.
            const pressLeaf = bridgePressLeaf;
            bridgePressLeaf = null;
            if (pressLeaf) {
                let dropLeaf = null;
                try {
                    if (g) {
                        const eb = app.renderer.events.rootBoundary;
                        eb.rootTarget = app.stage;
                        dropLeaf = eb.hitTest(g.x, g.y);
                    }
                }
                catch (err) { }
                if (dropLeaf !== pressLeaf) {
                    let pr = pressLeaf;
                    while (pr && !(pr.__listeners && pr.__listeners["touchReleaseOutside"] && pr.__listeners["touchReleaseOutside"].length))
                        pr = pr.parent;
                    if (pr) {
                        const gx = g ? g.x : -10000, gy = g ? g.y : -10000;
                        egret.TouchEvent.dispatchTouchEvent(pr, "touchReleaseOutside", true, true, gx, gy, e.pointerId, false);
                    }
                }
            }
        }, true);
        document.addEventListener("pointercancel", () => { window.__bridgePress = false; bridgePressLeaf = null; }, true);
        // Scale the canvas via CSS to fit the container (letterbox), preserving
        // aspect. The render resolution stays fixed at 640x1136, so layout
        // (Main.calcArea) is computed once and stays valid on any resize.
        // IMPORTANT: pointer hit-testing maps client coords using the canvas CSS
        // rect, so the CSS size MUST track the real available area. If the container
        // briefly reports ~0 (common in iframes / async layout), fall back to the
        // window so we never collapse the canvas to a few px (which made every grid
        // click fall through to the PIXI root).
        const fitCanvas = () => {
            let cw = container.clientWidth;
            let ch = container.clientHeight;
            if (cw < 16 || ch < 16) {
                cw = window.innerWidth;
                ch = window.innerHeight;
            }
            if (cw < 16 || ch < 16)
                return; // nothing sane to fit to yet; try again later
            const scale = Math.min(cw / w, ch / h);
            const dw = Math.round(w * scale);
            const dh = Math.round(h * scale);
            view.style.width = dw + "px";
            view.style.height = dh + "px";
            view.style.left = Math.round((cw - dw) / 2) + "px";
            view.style.top = Math.round((ch - dh) / 2) + "px";
        };
        fitCanvas();
        // Refit whenever the CONTAINER changes size (not just the window) — handles
        // iframes, panels, and late layout. ResizeObserver is the reliable signal.
        try {
            if (typeof window.ResizeObserver !== "undefined") {
                const ro = new window.ResizeObserver(() => fitCanvas());
                ro.observe(container);
                ro.observe(document.documentElement);
            }
        }
        catch (e) { }
        // Safety net: a few delayed refits catch first-frame zero-size races.
        [50, 200, 500, 1000].forEach((ms) => window.setTimeout(fitCanvas, ms));
        // root interaction surface.
        // MUST be "passive" (hit-test children but not the root itself), NOT "static".
        // With "static" PIXI v7 treats the root as a hit target and SHORT-CIRCUITS the
        // hit-test there — returning the root for every click instead of descending to
        // the egret Stage / GridViews. That made the whole game "respond to move but
        // not click/press/drag" (move events don't hit-test; clicks do). Likewise do
        // NOT give the root a screen-sized hitArea, which causes the same short-circuit.
        app.stage.eventMode = "passive";
        app.stage.interactiveChildren = true;
        const stage = new Stage();
        stage.setContentSize(w, h);
        stage.frameRate = 30;
        app.stage.addChild(stage);
        egret.$stage = stage;
        egret.sys.stage = stage;
        egret.lifecycle.stage = stage;
        // expose canvas dimensions where the game expects them
        window.canvas = { width: w, height: h };
        // instantiate and mount the entry class (e.g. Main)
        const EntryClass = window[options.entryClassName];
        if (!EntryClass) {
            egret.error("entry class not found: " + options.entryClassName);
            return;
        }
        const main = new EntryClass();
        // adding to stage emits PIXI 'added' -> fans to egret ADDED_TO_STAGE
        stage.addChild(main);
        // pause/resume on tab visibility
        document.addEventListener("visibilitychange", () => {
            if (document.hidden)
                egret.lifecycle.onPause();
            else
                egret.lifecycle.onResume();
        });
        // resize: only rescale the canvas via CSS; keep internal resolution fixed.
        window.addEventListener("resize", fitCanvas);
        // ---- real-input diagnostic (toggle with window.__HITLOG = true) ----
        // Logs, for every real pointerdown on the canvas, the chain of objects PIXI
        // hit-tests at that point — so we can see exactly what's on top of the grids.
        view.addEventListener("pointerdown", (e) => {
            if (!window.__HITLOG)
                return;
            try {
                const r = view.getBoundingClientRect();
                const gx = (e.clientX - r.left) * (view.width / r.width);
                const gy = (e.clientY - r.top) * (view.height / r.height);
                const eb = app.renderer.events.rootBoundary;
                eb.rootTarget = app.stage;
                const hit = eb.hitTest(gx, gy);
                const chain = [];
                let n = hit;
                while (n && chain.length < 8) {
                    chain.push((n.constructor && n.constructor.name) +
                        (n.gx != null ? "(" + n.gx + "," + n.gy + ")" : "") +
                        (n.name ? "#" + n.name : ""));
                    n = n.parent;
                }
                console.log("[hit] client", Math.round(e.clientX), Math.round(e.clientY), "-> global", Math.round(gx), Math.round(gy), "::", chain.join(" > "));
            }
            catch (err) {
                console.log("[hit] error", err);
            }
        }, true);
        return main;
    }
    egret.runEgret = runEgret;
})(egret || (egret = {}));
// Expose globals for the game scripts and for debugging.
// (dragonBones is already a global, provided by the Pixi DragonBones runtime.)
window.egret = egret;
window.RES = RES;
