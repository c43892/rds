// ============================================================================
// Egret -> PixiJS shim : STAGE + BOOTSTRAP
// Creates the PIXI.Application, an egret Stage root, and runs the entry class.
// ============================================================================

namespace egret {

    export class Stage extends DisplayObjectContainer {
        public stageWidth = 0;
        public stageHeight = 0;
        public frameRate = 30;
        public orientation = OrientationMode.PORTRAIT;
        public scaleMode = StageScaleMode.SHOW_ALL;
        public maxTouches = 2;
        public textureScaleFactor = 1;
        constructor() { super(); (this as any).__isStage = true; }
        public setContentSize(w: number, h: number) { this.stageWidth = w; this.stageHeight = h; }
        public invalidate() {}
    }

    export const sys: any = { stage: null };
    export let $stage: Stage;
    export let $app: any;        // PIXI.Application

    export interface RunEgretOptions {
        entryClassName: string;
        backgroundColor?: number;
        antialias?: boolean;
    }

    export function runEgret(options: RunEgretOptions) {
        const container =
            document.querySelector(".egret-player") as HTMLElement ||
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
        $app = app;
        sys.app = app;

        const view: HTMLCanvasElement = app.view;
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
        const client2global = (e: PointerEvent) => {
            const r = view.getBoundingClientRect();
            if (!(r.width > 0) || !(r.height > 0)) return null;
            return {
                x: (e.clientX - r.left) * view.width / r.width,
                y: (e.clientY - r.top) * view.height / r.height,
            };
        };
        // top-most egret object at (x,y) that has listeners for `type` (walk up = bubble)
        const hitWithListeners = (type: string, x: number, y: number) => {
            try {
                const eb = app.renderer.events.rootBoundary;
                eb.rootTarget = app.stage;
                let o: any = eb.hitTest(x, y);
                while (o && !(o.__listeners && o.__listeners[type] && o.__listeners[type].length)) o = o.parent;
                return o || null;
            } catch (err) { return null; }
        };
        let bridgePressLeaf: any = null;   // object hit at press time (for RELEASE_OUTSIDE)
        view.addEventListener("pointerdown", (e: PointerEvent) => {
            if (e.button !== 0) return;
            (window as any).__bridgePress = true;
            const g = client2global(e);
            bridgePressLeaf = g ? (() => {
                try { const eb = app.renderer.events.rootBoundary; eb.rootTarget = app.stage; return eb.hitTest(g.x, g.y); }
                catch (err) { return null; }
            })() : null;
        }, true);
        document.addEventListener("pointermove", (e: PointerEvent) => {
            if (!(window as any).__bridgePress || !(e.buttons & 1)) return;
            const g = client2global(e); if (!g) return;
            const t = hitWithListeners("touchMove", g.x, g.y);
            if (t) (egret.TouchEvent as any).dispatchTouchEvent(t, "touchMove", true, true, g.x, g.y, e.pointerId, true);
        }, true);
        document.addEventListener("pointerup", (e: PointerEvent) => {
            if (!(window as any).__bridgePress || e.button !== 0) return;
            (window as any).__bridgePress = false;
            const g = client2global(e);
            const drop = g ? hitWithListeners("touchEnd", g.x, g.y) : null;
            // egret order: TOUCH_END to the object under the release point first…
            if (drop && g) (egret.TouchEvent as any).dispatchTouchEvent(drop, "touchEnd", true, true, g.x, g.y, e.pointerId, false);
            // …then TOUCH_RELEASE_OUTSIDE to the press target if released elsewhere.
            const pressLeaf = bridgePressLeaf; bridgePressLeaf = null;
            if (pressLeaf) {
                let dropLeaf: any = null;
                try { if (g) { const eb = app.renderer.events.rootBoundary; eb.rootTarget = app.stage; dropLeaf = eb.hitTest(g.x, g.y); } } catch (err) {}
                if (dropLeaf !== pressLeaf) {
                    let pr: any = pressLeaf;
                    while (pr && !(pr.__listeners && pr.__listeners["touchReleaseOutside"] && pr.__listeners["touchReleaseOutside"].length)) pr = pr.parent;
                    if (pr) {
                        const gx = g ? g.x : -10000, gy = g ? g.y : -10000;
                        (egret.TouchEvent as any).dispatchTouchEvent(pr, "touchReleaseOutside", true, true, gx, gy, e.pointerId, false);
                    }
                }
            }
        }, true);
        document.addEventListener("pointercancel", () => { (window as any).__bridgePress = false; bridgePressLeaf = null; }, true);

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
            if (cw < 16 || ch < 16) { cw = window.innerWidth; ch = window.innerHeight; }
            if (cw < 16 || ch < 16) return; // nothing sane to fit to yet; try again later
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
            if (typeof (window as any).ResizeObserver !== "undefined") {
                const ro = new (window as any).ResizeObserver(() => fitCanvas());
                ro.observe(container);
                ro.observe(document.documentElement);
            }
        } catch (e) {}
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
        app.stage.addChild(stage as any);
        $stage = stage;
        sys.stage = stage;
        lifecycle.stage = stage;

        // expose canvas dimensions where the game expects them
        (window as any).canvas = { width: w, height: h };

        // instantiate and mount the entry class (e.g. Main)
        const EntryClass = (window as any)[options.entryClassName];
        if (!EntryClass) { egret.error("entry class not found: " + options.entryClassName); return; }
        const main = new EntryClass();
        // adding to stage emits PIXI 'added' -> fans to egret ADDED_TO_STAGE
        stage.addChild(main);

        // pause/resume on tab visibility
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) lifecycle.onPause(); else lifecycle.onResume();
        });

        // resize: only rescale the canvas via CSS; keep internal resolution fixed.
        window.addEventListener("resize", fitCanvas);

        // ---- real-input diagnostic (toggle with window.__HITLOG = true) ----
        // Logs, for every real pointerdown on the canvas, the chain of objects PIXI
        // hit-tests at that point — so we can see exactly what's on top of the grids.
        view.addEventListener("pointerdown", (e: PointerEvent) => {
            if (!(window as any).__HITLOG) return;
            try {
                const r = view.getBoundingClientRect();
                const gx = (e.clientX - r.left) * (view.width / r.width);
                const gy = (e.clientY - r.top) * (view.height / r.height);
                const eb = app.renderer.events.rootBoundary;
                eb.rootTarget = app.stage;
                const hit = eb.hitTest(gx, gy);
                const chain: string[] = [];
                let n: any = hit;
                while (n && chain.length < 8) {
                    chain.push((n.constructor && n.constructor.name) +
                        (n.gx != null ? "(" + n.gx + "," + n.gy + ")" : "") +
                        (n.name ? "#" + n.name : ""));
                    n = n.parent;
                }
                console.log("[hit] client", Math.round(e.clientX), Math.round(e.clientY),
                    "-> global", Math.round(gx), Math.round(gy), "::", chain.join(" > "));
            } catch (err) { console.log("[hit] error", err); }
        }, true);

        return main;
    }
}

// Expose globals for the game scripts and for debugging.
// (dragonBones is already a global, provided by the Pixi DragonBones runtime.)
(window as any).egret = egret;
(window as any).RES = RES;
