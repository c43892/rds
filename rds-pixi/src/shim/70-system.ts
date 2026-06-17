// ============================================================================
// Egret -> PixiJS shim : SYSTEM
// Ticker, timers, lifecycle, localStorage, ByteArray, Base64Util,
// ExternalInterface.
// ============================================================================

namespace egret {

    // ---- Ticker (frame callbacks; delta in ms) ----------------------------
    export class Ticker {
        private static _inst: Ticker;
        private map = new Map<Function, any>();
        public static getInstance(): Ticker { return Ticker._inst || (Ticker._inst = new Ticker()); }
        public register(fn: (advancedTimeMs: number) => void, thiz?: any) {
            const cb = () => fn.call(thiz, PIXI.Ticker.shared.deltaMS);
            this.map.set(fn, cb);
            PIXI.Ticker.shared.add(cb);
        }
        public unregister(fn: Function, thiz?: any) {
            const cb = this.map.get(fn);
            if (cb) { PIXI.Ticker.shared.remove(cb); this.map.delete(fn); }
        }
        public pause() { PIXI.Ticker.shared.stop(); }
        public resume() { PIXI.Ticker.shared.start(); }
    }

    export const ticker = {
        pause() { PIXI.Ticker.shared.stop(); },
        resume() { PIXI.Ticker.shared.start(); },
    };

    // sys ticker namespace used by some egret APIs
    export function startTick(callback: (ts: number) => boolean, thiz: any) {
        const cb = () => callback.call(thiz, performance.now());
        PIXI.Ticker.shared.add(cb);
    }

    // ---- timers -----------------------------------------------------------
    const intervalMap: { [id: number]: any } = {};
    let timerId = 1;
    export function setInterval(fn: Function, thiz: any, delay: number, ...args: any[]): number {
        const id = timerId++;
        intervalMap[id] = window.setInterval(() => fn.apply(thiz, args), delay);
        return id;
    }
    export function clearInterval(id: number) {
        if (intervalMap[id]) { window.clearInterval(intervalMap[id]); delete intervalMap[id]; }
    }
    export function setTimeout(fn: Function, thiz: any, delay: number, ...args: any[]): number {
        const id = timerId++;
        intervalMap[id] = window.setTimeout(() => fn.apply(thiz, args), delay);
        return id;
    }
    export function clearTimeout(id: number) {
        if (intervalMap[id]) { window.clearTimeout(intervalMap[id]); delete intervalMap[id]; }
    }

    // ---- Timer class ------------------------------------------------------
    export class Timer extends EventDispatcher {
        public delay: number;
        public repeatCount: number;
        public currentCount = 0;
        private handle: any;
        private running = false;
        constructor(delay: number, repeatCount = 0) { super(); this.delay = delay; this.repeatCount = repeatCount; }
        public start() {
            if (this.running) return;
            this.running = true;
            this.handle = window.setInterval(() => {
                this.currentCount++;
                this.dispatchEventWith(TimerEvent.TIMER);
                if (this.repeatCount > 0 && this.currentCount >= this.repeatCount) {
                    this.stop();
                    this.dispatchEventWith(TimerEvent.TIMER_COMPLETE);
                }
            }, this.delay);
        }
        public stop() { this.running = false; if (this.handle) window.clearInterval(this.handle); }
        public reset() { this.stop(); this.currentCount = 0; }
    }

    // ---- lifecycle --------------------------------------------------------
    export const lifecycle: any = {
        onPause: () => {},
        onResume: () => {},
        contextResize: () => {},
        stage: null,
        addLifecycleListener(plugin: Function) {
            const context = { onUpdate: () => {}, pause: () => {}, resume: () => {} };
            try { plugin(context); } catch (e) {}
        },
    };

    // ---- storage ----------------------------------------------------------
    export const localStorage = {
        getItem(key: string): string { try { return window.localStorage.getItem(key) || ""; } catch (e) { return ""; } },
        setItem(key: string, value: string) { try { window.localStorage.setItem(key, value); } catch (e) {} },
        removeItem(key: string) { try { window.localStorage.removeItem(key); } catch (e) {} },
        clear() { try { window.localStorage.clear(); } catch (e) {} },
    };

    // ---- ByteArray (minimal, self-consistent UTF round-trip) --------------
    export class ByteArray {
        private bytes: number[] = [];
        public position = 0;
        constructor(buffer?: ArrayBuffer | Uint8Array) {
            if (buffer) {
                const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
                this.bytes = Array.from(u8);
            }
        }
        public get length(): number { return this.bytes.length; }
        public get bytesAvailable(): number { return this.bytes.length - this.position; }
        public get buffer(): ArrayBuffer { return new Uint8Array(this.bytes).buffer; }

        public writeUTF(str: string) {
            const u8 = new TextEncoder().encode(str);
            this.bytes.push((u8.length >>> 8) & 0xff, u8.length & 0xff);
            for (let i = 0; i < u8.length; i++) this.bytes.push(u8[i]);
        }
        public readUTF(): string {
            const len = (this.bytes[this.position] << 8) | this.bytes[this.position + 1];
            this.position += 2;
            const slice = this.bytes.slice(this.position, this.position + len);
            this.position += len;
            return new TextDecoder().decode(new Uint8Array(slice));
        }
        public writeBytes(u8: Uint8Array) { for (let i = 0; i < u8.length; i++) this.bytes.push(u8[i]); }
        public clear() { this.bytes = []; this.position = 0; }
    }

    export const Base64Util = {
        encode(buffer: ArrayBuffer): string {
            const u8 = new Uint8Array(buffer);
            let s = "";
            for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
            return btoa(s);
        },
        decode(base64: string): ArrayBuffer {
            const s = atob(base64);
            const u8 = new Uint8Array(s.length);
            for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
            return u8.buffer;
        },
    };

    // ---- native bridge (web no-op) ----------------------------------------
    export const ExternalInterface = {
        callbacks: {} as { [k: string]: Function },
        addCallback(name: string, fn: Function) { this.callbacks[name] = fn; },
        call(name: string, value?: string) { /* no native host on web */ },
    };
}
