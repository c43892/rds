// ============================================================================
// Egret -> Howler shim : SOUND
// egret.Sound / SoundChannel backed by Howler.js (global Howl).
// ============================================================================

namespace egret {

    export class SoundChannel extends EventDispatcher {
        private howl: any;
        private id: number;
        constructor(howl: any, id: number) { super(); this.howl = howl; this.id = id; }
        public get volume(): number { return this.howl.volume(this.id); }
        public set volume(v: number) { this.howl.volume(v, this.id); }
        public get position(): number { return this.howl.seek(this.id) * 1000; }
        public stop() { try { this.howl.stop(this.id); } catch (e) {} }
    }

    export class Sound extends EventDispatcher {
        public static MUSIC = "music";
        public static EFFECT = "effect";
        public type = Sound.EFFECT;
        public length = 0;
        private howl: any;
        private url = "";

        public load(url: string): Promise<void> {
            this.url = url;
            return new Promise<void>((resolve) => {
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
        public play(startTime = 0, loops = 1): SoundChannel {
            if (!this.howl) return new SoundChannel({ stop() {}, volume() {}, seek() { return 0; } }, 0);
            const infinite = loops < 0;
            this.howl.loop(infinite);
            const id = this.howl.play();
            if (startTime) this.howl.seek(startTime, id);
            const ch = new SoundChannel(this.howl, id);
            if (!infinite) {
                this.howl.once("end", () => ch.dispatchEventWith(Event.SOUND_COMPLETE), id);
            }
            return ch;
        }

        public close() { if (this.howl) this.howl.unload(); }
    }
}
