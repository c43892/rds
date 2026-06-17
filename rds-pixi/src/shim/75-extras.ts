// ============================================================================
// Egret -> PixiJS shim : EXTRAS
// BlendMode, HttpRequest, RenderTexture, ScrollView
// ============================================================================

namespace egret {

    // ---- BlendMode (egret string consts -> PIXI numeric blend modes) ------
    export const BlendMode = {
        NORMAL: PIXI.BLEND_MODES.NORMAL,
        ADD: PIXI.BLEND_MODES.ADD,
        ERASE: (PIXI.BLEND_MODES.ERASE !== undefined ? PIXI.BLEND_MODES.ERASE : PIXI.BLEND_MODES.NORMAL),
        MULTIPLY: PIXI.BLEND_MODES.MULTIPLY,
        SCREEN: PIXI.BLEND_MODES.SCREEN,
    };

    // ---- HTTP (XMLHttpRequest based) --------------------------------------
    export const HttpMethod = { GET: "GET", POST: "POST" };
    export const HttpResponseType = { TEXT: "text", ARRAY_BUFFER: "arraybuffer" };

    export class IOErrorEvent extends Event {
        public static IO_ERROR = "ioError";
    }

    export class HttpRequest extends EventDispatcher {
        public responseType = HttpResponseType.TEXT;
        public response: any = null;
        public withCredentials = false;
        private xhr: XMLHttpRequest = new XMLHttpRequest();
        private headers: Array<[string, string]> = [];

        public open(url: string, method: string = HttpMethod.GET) {
            this.xhr.open(method, url, true);
        }
        public setRequestHeader(header: string, value: string) {
            this.headers.push([header, value]);
        }
        public send(data?: any) {
            const xhr = this.xhr;
            try { for (const [h, v] of this.headers) xhr.setRequestHeader(h, v); } catch (e) {}
            xhr.onreadystatechange = () => {
                if (xhr.readyState !== 4) return;
                if (xhr.status >= 200 && xhr.status < 300) {
                    this.response = xhr.responseText;
                    const ev = new Event(Event.COMPLETE); ev.target = this; ev.currentTarget = this;
                    this.dispatchEvent(ev);
                } else {
                    const ev = new IOErrorEvent(IOErrorEvent.IO_ERROR); ev.target = this; ev.currentTarget = this;
                    this.dispatchEvent(ev);
                }
            };
            xhr.onerror = () => {
                const ev = new IOErrorEvent(IOErrorEvent.IO_ERROR); ev.target = this; ev.currentTarget = this;
                this.dispatchEvent(ev);
            };
            try { xhr.send(data); } catch (e) {
                const ev = new IOErrorEvent(IOErrorEvent.IO_ERROR); this.dispatchEvent(ev);
            }
        }
        public abort() { try { this.xhr.abort(); } catch (e) {} }
    }

    // ---- RenderTexture (snapshot a display object into a texture) ---------
    export class RenderTexture extends Texture {
        constructor() { super(PIXI.Texture.EMPTY); }
        // Uses renderer.generateTexture, which temp-parents the object and renders
        // it relative to its LOCAL bounds. (renderer.render() with a renderTexture
        // applied the object's WORLD transform, so any stage-attached object — e.g.
        // the drag-source GridView — rendered outside the texture: blank snapshot,
        // invisible drag image. Verified by pixel counts: 0 vs 7312 non-transparent.)
        public drawToTexture(displayObject: any, clipBounds?: any, scale = 1): boolean {
            if (!egret.$app || !displayObject) return false;
            try {
                // egret saturates an erase/draw by allowing alpha > 1 (e.g. the world-map
                // mist punches its fog-of-war hole with an ERASE sprite at alpha 10).
                // PIXI clamps worldAlpha to [0,1], so such an erase barely opens the hole
                // (most of the map stayed dark). Replicate the >1 intensity by drawing
                // those children ceil(alpha) times (each pass erases again). Done on a
                // temp clone-list so the live scene is untouched; restored after render.
                const expanded = this.__expandOverAlpha(displayObject);
                const opts: any = { resolution: scale > 0 ? scale : 1 };
                if (clipBounds)
                    opts.region = new PIXI.Rectangle(clipBounds.x, clipBounds.y, clipBounds.width, clipBounds.height);
                const old = this.$pixiTexture;
                this.$pixiTexture = egret.$app.renderer.generateTexture(displayObject, opts);
                if (expanded) this.__restoreOverAlpha(displayObject, expanded);
                if (old && old !== PIXI.Texture.EMPTY && old.destroy) { try { old.destroy(true); } catch (e) {} }
                return true;
            } catch (e) { egret.warn("drawToTexture failed", e); return false; }
        }

        // Find direct children whose alpha>1 (egret intensity boost); for each, insert
        // extra duplicate render passes after it so the cumulative blend matches egret.
        // Returns the list of temp-inserted clones to remove afterwards, or null.
        private __expandOverAlpha(obj: any): any[] | null {
            if (!obj || !obj.children || !obj.children.length) return null;
            const inserted: any[] = [];
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
                        try { clone.width = c.width; clone.height = c.height; } catch (e) {}
                        clone.blendMode = c.blendMode;
                        clone.alpha = 1;
                        (clone as any).__overAlphaRestore = c;          // remember source
                        (clone as any).__overAlphaOrig = a;
                        obj.addChildAt(clone, idx + 1 + r);
                        inserted.push({ clone, src: c, orig: a });
                    }
                }
            }
            return inserted.length ? inserted : null;
        }

        private __restoreOverAlpha(obj: any, inserted: any[]) {
            for (const e of inserted) {
                if (e.clone.parent) e.clone.parent.removeChild(e.clone);
                try { e.clone.destroy(); } catch (err) {}
                e.src.alpha = e.orig;   // restore the original >1 alpha on the live child
            }
        }
        public getPixels() { return []; }
    }

    // ---- ScrollView (viewport + clip + drag scrolling) -------------------
    export class ScrollView extends DisplayObjectContainer {
        private _content: any;
        private _vw = 0;
        private _vh = 0;
        private maskG: any;
        public verticalScrollPolicy = "auto";
        public horizontalScrollPolicy = "auto";
        public bounces = true;
        public scrollBeginThreshold = 10;

        private dragging = false;
        private lastX = 0;
        private lastY = 0;

        constructor(content?: any) {
            super();
            this.maskG = new PIXI.Graphics();
            super.addChild(this.maskG);
            this.mask = this.maskG as any;
            this.eventMode = "static";
            this.on("pointerdown", (e: any) => this.onDown(e));
            this.on("pointermove", (e: any) => this.onMove(e));
            this.on("pointerup", () => this.dragging = false);
            this.on("pointerupoutside", () => this.dragging = false);
            if (content) this.setContent(content);
        }

        public setContent(content: any) {
            if (this._content && this._content.parent === this) super.removeChild(this._content);
            this._content = content;
            if (content) super.addChild(content);
            this.refreshMask();
        }
        public removeContent() {
            if (this._content && this._content.parent === this) super.removeChild(this._content);
            this._content = undefined;
        }

        public get width(): number { return this._vw; }
        public set width(v: number) { this._vw = v; this.refreshMask(); }
        public get height(): number { return this._vh; }
        public set height(v: number) { this._vh = v; this.refreshMask(); }

        public setContentSize(w: number, h: number) { this._vw = w; this._vh = h; this.refreshMask(); }

        private refreshMask() {
            this.maskG.clear();
            this.maskG.beginFill(0xffffff, 1);
            this.maskG.drawRect(0, 0, this._vw || 1, this._vh || 1);
            this.maskG.endFill();
        }

        public get scrollTop(): number { return this._content ? -this._content.y : 0; }
        public set scrollTop(v: number) { if (this._content) this._content.y = -this.clampV(v); }
        public get scrollLeft(): number { return this._content ? -this._content.x : 0; }
        public set scrollLeft(v: number) { if (this._content) this._content.x = -this.clampH(v); }
        public get verticalScrollPosition(): number { return this.scrollTop; }
        public set verticalScrollPosition(v: number) { this.scrollTop = v; }
        public get horizontalScrollPosition(): number { return this.scrollLeft; }
        public set horizontalScrollPosition(v: number) { this.scrollLeft = v; }

        private contentH(): number { try { return this._content ? this._content.height : 0; } catch (e) { return 0; } }
        private contentW(): number { try { return this._content ? this._content.width : 0; } catch (e) { return 0; } }
        private clampV(v: number): number { const max = Math.max(0, this.contentH() - this._vh); return Math.min(Math.max(0, v), max); }
        private clampH(v: number): number { const max = Math.max(0, this.contentW() - this._vw); return Math.min(Math.max(0, v), max); }

        private onDown(e: any) { this.dragging = true; this.lastX = e.global.x; this.lastY = e.global.y; }
        private onMove(e: any) {
            if (!this.dragging || !this._content) return;
            if (this.verticalScrollPolicy !== "off") {
                const dy = e.global.y - this.lastY;
                this._content.y = -this.clampV(-this._content.y - dy);
            }
            if (this.horizontalScrollPolicy === "on" || this.horizontalScrollPolicy === "auto") {
                const dx = e.global.x - this.lastX;
                if (this.contentW() > this._vw) this._content.x = -this.clampH(-this._content.x - dx);
            }
            this.lastX = e.global.x; this.lastY = e.global.y;
        }

        public stopAnimation() { this.dragging = false; }
    }
}
