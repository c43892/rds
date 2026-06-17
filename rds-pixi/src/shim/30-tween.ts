// ============================================================================
// Egret -> PixiJS shim : TWEEN + EASE
// Faithful re-implementation of egret.Tween driven by PIXI.Ticker.shared.
// ============================================================================

namespace egret {

    type EaseFn = (t: number) => number;

    export const Ease = (() => {
        const PI = Math.PI;
        const pow = Math.pow, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt;
        const E: any = {};
        E.none = E.linear = (t: number) => t;
        E.get = (amount: number): EaseFn => {
            if (amount < -1) amount = -1; if (amount > 1) amount = 1;
            return (t) => (amount === 0) ? t : (amount < 0 ? t * (t * -amount + 1 + amount) : t * ((2 - t) * amount + (1 - amount)));
        };
        const mkIn = (p: number): EaseFn => (t) => pow(t, p);
        const mkOut = (p: number): EaseFn => (t) => 1 - pow(1 - t, p);
        const mkInOut = (p: number): EaseFn => (t) => (t < 0.5) ? pow(t * 2, p) / 2 : 1 - pow(2 - t * 2, p) / 2;
        E.quadIn = mkIn(2); E.quadOut = mkOut(2); E.quadInOut = mkInOut(2);
        E.cubicIn = mkIn(3); E.cubicOut = mkOut(3); E.cubicInOut = mkInOut(3);
        E.quartIn = mkIn(4); E.quartOut = mkOut(4); E.quartInOut = mkInOut(4);
        E.quintIn = mkIn(5); E.quintOut = mkOut(5); E.quintInOut = mkInOut(5);
        E.sineIn = (t: number) => 1 - cos(t * PI / 2);
        E.sineOut = (t: number) => sin(t * PI / 2);
        E.sineInOut = (t: number) => -0.5 * (cos(PI * t) - 1);
        const backVal = 1.7;
        E.backIn = (t: number) => t * t * ((backVal + 1) * t - backVal);
        E.backOut = (t: number) => (--t * t * ((backVal + 1) * t + backVal) + 1);
        E.backInOut = (t: number) => {
            const b = backVal * 1.525; t *= 2;
            if (t < 1) return 0.5 * (t * t * ((b + 1) * t - b));
            return 0.5 * ((t -= 2) * t * ((b + 1) * t + b) + 2);
        };
        E.circIn = (t: number) => -(sqrt(1 - t * t) - 1);
        E.circOut = (t: number) => sqrt(1 - (--t) * t);
        E.circInOut = (t: number) => { t *= 2; if (t < 1) return -0.5 * (sqrt(1 - t * t) - 1); return 0.5 * (sqrt(1 - (t -= 2) * t) + 1); };
        E.expoIn = (t: number) => (t === 0) ? 0 : pow(2, 10 * (t - 1));
        E.expoOut = (t: number) => (t === 1) ? 1 : 1 - pow(2, -10 * t);
        E.expoInOut = (t: number) => { if (t === 0) return 0; if (t === 1) return 1; t *= 2; if (t < 1) return 0.5 * pow(2, 10 * (t - 1)); return 0.5 * (2 - pow(2, -10 * (t - 1))); };
        const elastic = (amp: number, period: number) => (t: number) => {
            if (t === 0 || t === 1) return t;
            const s = period / (2 * PI) * Math.asin(1 / amp);
            return -(amp * pow(2, 10 * (t -= 1)) * sin((t - s) * (2 * PI) / period));
        };
        E.elasticIn = elastic(1, 0.3);
        E.elasticOut = (t: number) => { if (t === 0 || t === 1) return t; const p = 0.3, s = p / 4; return (pow(2, -10 * t) * sin((t - s) * (2 * PI) / p) + 1); };
        E.elasticInOut = (t: number) => {
            if (t === 0 || t === 1) return t; const p = 0.45, a = 1; const s = p / (2 * PI) * Math.asin(1 / a);
            t *= 2;
            if (t < 1) return -0.5 * (a * pow(2, 10 * (t -= 1)) * sin((t - s) * (2 * PI) / p));
            return a * pow(2, -10 * (t -= 1)) * sin((t - s) * (2 * PI) / p) * 0.5 + 1;
        };
        E.bounceOut = (t: number) => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        };
        E.bounceIn = (t: number) => 1 - E.bounceOut(1 - t);
        E.bounceInOut = (t: number) => (t < 0.5) ? E.bounceIn(t * 2) * 0.5 : E.bounceOut(t * 2 - 1) * 0.5 + 0.5;
        return E;
    })();

    interface Step {
        kind: "to" | "wait" | "call" | "set";
        props?: { [k: string]: number };
        starts?: { [k: string]: number };
        duration?: number;
        ease?: EaseFn;
        fn?: Function; thiz?: any; params?: any[];
    }

    export class Tween {
        private static _all: Tween[] = [];
        private static _started = false;
        private static _frame = 0;     // increments once per ticker frame

        private target: any;
        private steps: Step[] = [];
        private stepIndex = 0;
        private stepElapsed = 0;
        private _paused = false;
        private _loop = false;
        private _onChange: Function | undefined;
        private _onChangeObj: any;
        private _done = false;
        private _bornFrame = 0;        // the frame this tween was created on

        constructor(target: any, props?: any) {
            this.target = target;
            this._bornFrame = Tween._frame;
            if (props) {
                this._loop = !!props.loop;
                this._onChange = props.onChange;
                this._onChangeObj = props.onChangeObj;
            }
        }

        public static get(target: any, props?: any): Tween {
            Tween.ensureTicker();
            if (props && props.override) Tween.removeTweens(target);
            const t = new Tween(target, props);
            Tween._all.push(t);
            return t;
        }

        public static removeTweens(target: any) {
            const removed = Tween._all.filter(t => t.target === target);
            Tween._all = Tween._all.filter(t => t.target !== target);
            for (const t of removed) t.flushCallsOnRemove();
        }
        public static removeAllTweens() {
            const removed = Tween._all.slice();
            Tween._all.length = 0;
            for (const t of removed) t.flushCallsOnRemove();
        }

        // When a tween is cancelled (removeTweens), run its REMAINING `call` steps.
        // The game's AnimationFactory resolves its animation promises via a trailing
        // .call(resolve) — if a third party removes the tween mid-flight (init shuffle
        // cleanup, floating(stop), …) the promise would otherwise pend FOREVER, leaving
        // Battle.fireEvent's lastEventType set and poisoning every later event
        // ("event overlapped" → battle stops responding after e.g. killing a monster).
        // Other .call uses here are cleanup (remove mask shape, decBlockLayer) — safe
        // and desirable on cancellation as well.
        private flushCallsOnRemove() {
            if (this._done) return;
            this._done = true;
            for (let i = Math.max(0, this.stepIndex); i < this.steps.length; i++) {
                const s = this.steps[i];
                if (s.kind === "call" && s.fn && !(s as any).__begun) {
                    try { s.fn.apply(s.thiz, s.params || []); } catch (e) {}
                }
            }
        }

        public static pauseTweens(target: any) { Tween._all.forEach(t => { if (t.target === target) t._paused = true; }); }
        public static resumeTweens(target: any) { Tween._all.forEach(t => { if (t.target === target) t._paused = false; }); }

        private static ensureTicker() {
            if (Tween._started) return;
            Tween._started = true;
            PIXI.Ticker.shared.add(() => {
                Tween._frame++;
                const dt = PIXI.Ticker.shared.deltaMS;
                Tween.tickAll(dt);
            });
        }

        private static tickAll(dt: number) {
            for (let i = Tween._all.length - 1; i >= 0; i--) {
                const t = Tween._all[i];
                if (t._paused || t._done) continue;
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
                if (t._bornFrame === Tween._frame) continue;
                t.advance(dt);
                if (t._done) Tween._all.splice(i, 1);
            }
        }

        public to(props: any, duration = 0, ease?: EaseFn): Tween {
            this.steps.push({ kind: "to", props: Object.assign({}, props), duration, ease });
            return this;
        }
        public wait(duration: number): Tween {
            this.steps.push({ kind: "wait", duration });
            return this;
        }
        public set(props: any): Tween {
            this.steps.push({ kind: "set", props: Object.assign({}, props) });
            return this;
        }
        public call(fn: Function, thiz?: any, params?: any[]): Tween {
            this.steps.push({ kind: "call", fn, thiz, params });
            return this;
        }
        public play() { this._paused = false; return this; }
        public pause() { this._paused = true; return this; }
        public setPaused(p: boolean): Tween { this._paused = p; return this; }
        public get paused(): boolean { return this._paused; }

        private beginStep(s: Step) {
            if (s.kind === "to") {
                s.starts = {};
                for (const k in s.props!) s.starts[k] = +this.target[k] || 0;
                if (!s.duration || s.duration <= 0) {
                    for (const k in s.props!) this.target[k] = s.props![k];
                    if (this._onChange) this._onChange.call(this._onChangeObj);
                }
            } else if (s.kind === "set") {
                for (const k in s.props!) this.target[k] = s.props![k];
            } else if (s.kind === "call") {
                if (s.fn) s.fn.apply(s.thiz, s.params || []);
            }
        }

        private advance(dt: number) {
            // initialise first step lazily
            if (this.stepElapsed === 0 && this.stepIndex < this.steps.length && !(this.steps[this.stepIndex] as any).__begun) {
                (this.steps[this.stepIndex] as any).__begun = true;
                this.beginStep(this.steps[this.stepIndex]);
            }

            let guard = 0;
            while (this.stepIndex < this.steps.length && guard++ < 1000) {
                const s = this.steps[this.stepIndex];
                const dur = s.duration || 0;

                if (s.kind === "to" && dur > 0) {
                    this.stepElapsed += dt;
                    let r = this.stepElapsed / dur;
                    if (r > 1) r = 1;
                    const e = s.ease ? s.ease(r) : r;
                    for (const k in s.props!) {
                        const a = s.starts![k]; const b = s.props![k];
                        this.target[k] = a + (b - a) * e;
                    }
                    if (this._onChange) this._onChange.call(this._onChangeObj);
                    if (r >= 1) { this.nextStep(); continue; }
                    return; // still animating this step
                } else if (s.kind === "wait" && dur > 0) {
                    this.stepElapsed += dt;
                    if (this.stepElapsed >= dur) { this.nextStep(); continue; }
                    return;
                } else {
                    // zero-duration to/set/call already handled in beginStep
                    this.nextStep();
                    continue;
                }
            }

            if (this.stepIndex >= this.steps.length) {
                if (this._loop && this.steps.length) {
                    this.stepIndex = 0; this.stepElapsed = 0;
                    for (const st of this.steps) (st as any).__begun = false;
                    (this.steps[0] as any).__begun = true;
                    this.beginStep(this.steps[0]);
                } else {
                    this._done = true;
                }
            }
        }

        private nextStep() {
            this.stepIndex++;
            this.stepElapsed = 0;
            if (this.stepIndex < this.steps.length) {
                (this.steps[this.stepIndex] as any).__begun = true;
                this.beginStep(this.steps[this.stepIndex]);
            }
        }
    }
}
