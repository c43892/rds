// ============================================================================
// Egret -> PixiJS compatibility shim : CORE
// namespace egret { geometry, events, enums, capabilities, logging }
// Backed by global PIXI (v7 UMD) which is loaded before this script.
// ============================================================================

declare const PIXI: any;

namespace egret {

    // ---- logging -----------------------------------------------------------
    export function log(...args: any[]) { console.log(...args); }
    export function warn(...args: any[]) { console.warn(...args); }
    export function error(...args: any[]) { console.error(...args); }

    export class Logger {
        public static ALL = "all";
        public static DEBUG = "debug";
        public static INFO = "info";
        public static WARN = "warn";
        public static ERROR = "error";
        public static OFF = "off";
        public static logLevel = "all";
    }

    let _hashCount = 1;
    export class HashObject {
        public hashCode: number;
        constructor() { this.hashCode = _hashCount++; }
    }

    // ---- geometry ----------------------------------------------------------
    export class Point {
        constructor(public x: number = 0, public y: number = 0) {}
        setTo(x: number, y: number) { this.x = x; this.y = y; return this; }
        clone() { return new Point(this.x, this.y); }
        static distance(a: Point, b: Point) {
            const dx = a.x - b.x, dy = a.y - b.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }

    export class Rectangle {
        constructor(public x = 0, public y = 0, public width = 0, public height = 0) {}
        public get right() { return this.x + this.width; }
        public get bottom() { return this.y + this.height; }
        setTo(x: number, y: number, w: number, h: number) {
            this.x = x; this.y = y; this.width = w; this.height = h; return this;
        }
        contains(x: number, y: number) {
            return x >= this.x && x < this.x + this.width &&
                   y >= this.y && y < this.y + this.height;
        }
        clone() { return new Rectangle(this.x, this.y, this.width, this.height); }
    }

    export class Matrix {
        constructor(public a = 1, public b = 0, public c = 0,
                    public d = 1, public tx = 0, public ty = 0) {}
    }

    // ---- enums -------------------------------------------------------------
    export const HorizontalAlign = { LEFT: "left", RIGHT: "right", CENTER: "center", JUSTIFY: "justify", CONTENT_JUSTIFY: "contentJustify" };
    export const VerticalAlign = { TOP: "top", BOTTOM: "bottom", MIDDLE: "middle", JUSTIFY: "justify", CONTENT_JUSTIFY: "contentJustify" };
    export const BitmapFillMode = { REPEAT: "repeat", SCALE: "scale", CLIP: "clip" };
    export const OrientationMode = { AUTO: "auto", PORTRAIT: "portrait", LANDSCAPE: "landscape", LANDSCAPE_FLIPPED: "landscapeFlipped" };
    export const TextFieldType = { DYNAMIC: "dynamic", INPUT: "input" };
    export const TextFieldInputType = { TEXT: "text", TEL: "tel", PASSWORD: "password" };
    export const StageScaleMode = { NO_SCALE: "noScale", SHOW_ALL: "showAll", NO_BORDER: "noBorder", EXACT_FIT: "exactFit", FIXED_WIDTH: "fixedWidth", FIXED_HEIGHT: "fixedHeight" };

    // ---- event types -------------------------------------------------------
    export class Event {
        public static ADDED_TO_STAGE = "addedToStage";
        public static REMOVED_FROM_STAGE = "removedFromStage";
        public static ADDED = "added";
        public static REMOVED = "removed";
        public static ENTER_FRAME = "enterFrame";
        public static RENDER = "render";
        public static RESIZE = "resize";
        public static COMPLETE = "complete";
        public static CHANGE = "change";
        public static CLOSE = "close";
        public static OPEN = "open";
        public static LOOP_COMPLETE = "loopComplete";
        public static SOUND_COMPLETE = "soundComplete";

        public type: string;
        public target: any;
        public currentTarget: any;
        public data: any;
        public $bubbles: boolean;
        public $cancelable: boolean;
        constructor(type: string, bubbles = false, cancelable = false, data?: any) {
            this.type = type; this.$bubbles = bubbles; this.$cancelable = cancelable; this.data = data;
        }
        stopPropagation() {}
        stopImmediatePropagation() {}
        preventDefault() {}
    }

    export class TouchEvent extends Event {
        public static TOUCH_BEGIN = "touchBegin";
        public static TOUCH_MOVE = "touchMove";
        public static TOUCH_END = "touchEnd";
        public static TOUCH_TAP = "touchTap";
        public static TOUCH_RELEASE_OUTSIDE = "touchReleaseOutside";
        public static TOUCH_CANCEL = "touchCancel";

        public stageX = 0;
        public stageY = 0;
        public localX = 0;
        public localY = 0;
        public touchPointID = 0;
        public touchDown = false;

        // egret static helper used to synthesize/forward touches (e.g. the guide layer).
        public static dispatchTouchEvent(
            target: any, type: string, bubbles = false, cancelable = false,
            stageX = 0, stageY = 0, touchPointID = 0, touchDown = false
        ): boolean {
            if (!target || !target.dispatchEvent) return false;
            const e = new TouchEvent(type, bubbles, cancelable);
            e.stageX = stageX; e.stageY = stageY;
            e.touchPointID = touchPointID; e.touchDown = touchDown;
            if (target.globalToLocal) {
                try { const lp = target.globalToLocal(stageX, stageY); e.localX = lp.x; e.localY = lp.y; } catch (_) {}
            }
            e.target = target;
            target.dispatchEvent(e);
            return true;
        }
    }

    export class TimerEvent extends Event {
        public static TIMER = "timer";
        public static TIMER_COMPLETE = "timerComplete";
    }

    // Map egret event type -> PIXI federated event name (for display objects).
    export const PIXI_EVENT_MAP: { [k: string]: string } = {
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
    export class EventDispatcher extends HashObject {
        private _listeners: { [type: string]: Array<{ fn: Function; thiz: any }> } = {};
        constructor(target?: any) { super(); }
        addEventListener(type: string, listener: Function, thiz?: any, useCapture?: boolean, priority?: number) {
            (this._listeners[type] || (this._listeners[type] = [])).push({ fn: listener, thiz });
        }
        once(type: string, listener: Function, thiz?: any) {
            const wrap = (e: any) => { this.removeEventListener(type, wrap, thiz); listener.call(thiz, e); };
            this.addEventListener(type, wrap, thiz);
        }
        removeEventListener(type: string, listener: Function, thiz?: any) {
            const arr = this._listeners[type];
            if (!arr) return;
            for (let i = arr.length - 1; i >= 0; i--)
                if (arr[i].fn === listener && arr[i].thiz === thiz) arr.splice(i, 1);
        }
        hasEventListener(type: string) { return !!(this._listeners[type] && this._listeners[type].length); }
        dispatchEvent(event: Event) {
            const arr = this._listeners[event.type];
            if (!arr) return true;
            event.target = event.target || this;
            event.currentTarget = this;
            for (const l of arr.slice()) l.fn.call(l.thiz, event);
            return true;
        }
        dispatchEventWith(type: string, bubbles = false, data?: any) {
            this.dispatchEvent(new Event(type, bubbles, false, data));
        }
    }

    // ---- capabilities ------------------------------------------------------
    export class Capabilities {
        public static get os(): string {
            const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "") || "";
            if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
            if (/Android/i.test(ua)) return "Android";
            if (/Windows/i.test(ua)) return "Windows PC";
            if (/Mac/i.test(ua)) return "Mac OS";
            return "Unknown";
        }
        public static get isMobile(): boolean {
            const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "") || "";
            return /iPhone|iPad|iPod|Android/i.test(ua);
        }
        public static runtimeType = "web";
        public static language = (typeof navigator !== "undefined" ? navigator.language : "zh-CN");
    }

    // ---- misc helpers used by game ----------------------------------------
    export function getTimer(): number { return Date.now(); }

    export function callLater(fn: Function, thiz?: any, ...args: any[]) {
        Promise.resolve().then(() => fn.apply(thiz, args));
    }

    export function registerClass(..._a: any[]) {}
    export function getQualifiedClassName(o: any): string {
        return o && o.constructor ? o.constructor.name : typeof o;
    }
}
