// ============================================================================
// Egret -> PixiJS shim : MOVIECLIP (sprite-sheet frame animation)
// Format: { mc: { clip: { frameRate, frames:[{res,x,y}] } }, res:{ key:{x,y,w,h} } }
// ============================================================================

namespace egret {

    export interface MovieClipData {
        frames: Array<{ texture: any; x: number; y: number; w: number; h: number }>;
        frameRate: number;
        clipName: string;
    }

    export class MovieClipDataFactory {
        private data: any;
        private base: any;
        constructor(data: any, texture: Texture) {
            this.data = data;
            this.base = texture && texture.$pixiTexture ? texture.$pixiTexture.baseTexture : null;
        }
        public generateMovieClipData(clipName = "default"): MovieClipData {
            const mc = this.data.mc[clipName] || this.data.mc[Object.keys(this.data.mc)[0]];
            const res = this.data.res;
            const frames = (mc.frames || []).map((fr: any) => {
                const r = res[fr.res];
                const tex = (r && this.base) ? new PIXI.Texture(this.base, new PIXI.Rectangle(r.x, r.y, r.w, r.h)) : PIXI.Texture.EMPTY;
                return { texture: tex, x: fr.x || 0, y: fr.y || 0, w: r ? r.w : 0, h: r ? r.h : 0 };
            });
            return { frames, frameRate: mc.frameRate || 24, clipName };
        }
    }

    export class MovieClip extends DisplayObjectContainer {
        private spr: any;
        private mcData: MovieClipData | undefined;
        private totalFrames = 0;
        private frameInterval = 1000 / 24;
        private curFrame = 0;
        private playing = false;
        private playTimes = -1;
        private loopCount = 0;
        private _acc = 0;
        private _tick: any;
        public frameRate = 24;

        constructor(data?: MovieClipData) {
            super();
            this.spr = new PIXI.Sprite();
            super.addChild(this.spr);
            if (data) this.setMovieClipData(data);
            this._tick = (/*delta*/) => this.update(PIXI.Ticker.shared.deltaMS);
        }

        public setMovieClipData(d: MovieClipData) {
            this.mcData = d;
            this.totalFrames = d.frames.length;
            this.frameRate = d.frameRate || 24;
            this.frameInterval = 1000 / this.frameRate;
            if (this.totalFrames) this.gotoFrame(0);
        }

        public get totalFramesCount(): number { return this.totalFrames; }
        public get currentFrame(): number { return this.curFrame; }

        private gotoFrame(i: number) {
            if (!this.mcData) return;
            const f = this.mcData.frames[i];
            if (!f) return;
            this.spr.texture = f.texture;
            this.spr.x = f.x;
            this.spr.y = f.y;
            this.curFrame = i;
        }

        public gotoAndPlay(frame: number, playTimes = 1) {
            this.gotoFrame(frame);
            this.playTimes = playTimes;
            this.loopCount = 0;
            this._acc = 0;
            this.startTick();
        }
        public gotoAndStop(frame: number) { this.gotoFrame(frame); this.stop(); }
        public play(playTimes = 1) { this.gotoAndPlay(this.curFrame, playTimes); }
        public stop() { this.playing = false; PIXI.Ticker.shared.remove(this._tick); }

        private startTick() {
            if (!this.playing) { this.playing = true; PIXI.Ticker.shared.add(this._tick); }
        }

        private update(dt: number) {
            if (!this.playing || !this.totalFrames) return;
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
                        this.dispatchEvent(new Event(Event.COMPLETE));
                        return;
                    }
                    next = 0;
                    this.dispatchEvent(new Event(Event.LOOP_COMPLETE));
                }
                this.gotoFrame(next);
            }
        }
    }
}
