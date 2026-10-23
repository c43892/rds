// Ambient declarations so the existing Egret game code type-checks against our
// PixiJS-backed shim. Each name is exposed as BOTH a type and a value (`any`),
// matching how the code uses them (base classes, annotations, value access).
// The goal is a faithful runtime port, not static type-safety over legacy code.

declare namespace egret {
    type Base64Util = any; const Base64Util: any;
    type Bitmap = any; const Bitmap: any;
    type BitmapData = any; const BitmapData: any;
    type BitmapFillMode = any; const BitmapFillMode: any;
    type BitmapFont = any; const BitmapFont: any;
    type BitmapText = any; const BitmapText: any;
    type BlendMode = any; const BlendMode: any;
    type BlurFilter = any; const BlurFilter: any;
    type ByteArray = any; const ByteArray: any;
    type Capabilities = any; const Capabilities: any;
    type ColorMatrixFilter = any; const ColorMatrixFilter: any;
    type CustomFilter = any; const CustomFilter: any;
    type DisplayObject = any; const DisplayObject: any;
    type DisplayObjectContainer = any; const DisplayObjectContainer: any;
    type Ease = any; const Ease: any;
    type Event = any; const Event: any;
    type EventDispatcher = any; const EventDispatcher: any;
    type ExternalInterface = any; const ExternalInterface: any;
    type Graphics = any; const Graphics: any;
    type GlowFilter = any; const GlowFilter: any;
    type HorizontalAlign = any; const HorizontalAlign: any;
    type HtmlTextParser = any; const HtmlTextParser: any;
    type HttpMethod = any; const HttpMethod: any;
    type HttpRequest = any; const HttpRequest: any;
    type HttpResponseType = any; const HttpResponseType: any;
    type IOErrorEvent = any; const IOErrorEvent: any;
    type ITextElement = any; const ITextElement: any;
    type Logger = any; const Logger: any;
    type Matrix = any; const Matrix: any;
    type MovieClip = any; const MovieClip: any;
    type MovieClipDataFactory = any; const MovieClipDataFactory: any;
    type OrientationMode = any; const OrientationMode: any;
    type Point = any; const Point: any;
    type Rectangle = any; const Rectangle: any;
    type RenderTexture = any; const RenderTexture: any;
    type ScrollView = any; const ScrollView: any;
    type Shape = any; const Shape: any;
    type Sound = any; const Sound: any;
    type SoundChannel = any; const SoundChannel: any;
    type Sprite = any; const Sprite: any;
    type Stage = any; const Stage: any;
    type StageScaleMode = any; const StageScaleMode: any;
    type TextField = any; const TextField: any;
    type TextFieldType = any; const TextFieldType: any;
    type TextFieldInputType = any; const TextFieldInputType: any;
    type Texture = any; let Texture: any;
    type Ticker = any; const Ticker: any;
    type Timer = any; const Timer: any;
    type TimerEvent = any; const TimerEvent: any;
    type TouchEvent = any; const TouchEvent: any;
    type Tween = any; const Tween: any;
    type VerticalAlign = any; const VerticalAlign: any;
    const ease: any;
    const lifecycle: any;
    const localStorage: any;
    const ticker: any;
    function log(...a: any[]): void;
    function warn(...a: any[]): void;
    function error(...a: any[]): void;
    function setInterval(fn: Function, thiz: any, delay: number, ...a: any[]): number;
    function clearInterval(id: number): void;
    function setTimeout(fn: Function, thiz: any, delay: number, ...a: any[]): number;
    function clearTimeout(id: number): void;
    function callLater(fn: Function, thiz?: any, ...a: any[]): void;
    function getQualifiedClassName(o: any): string;
    function registerClass(...a: any[]): void;
    function runEgret(o: any): any;
}

declare namespace dragonBones {
    type AnimationEvent = any; const AnimationEvent: any;
    type Armature = any; const Armature: any;
    type EgretFactory = any; const EgretFactory: any;
    type PixiFactory = any; const PixiFactory: any;
    type Slot = any; const Slot: any;
    type WorldClock = any; const WorldClock: any;
}

declare namespace RES {
    interface PromiseTaskReporter { onProgress(current: number, total: number): void; }
    function loadConfig(url: string, root: string): Promise<void>;
    function loadGroup(name: string, priority?: number, reporter?: any): Promise<void>;
    function getRes(name: string): any;
    function getResAsync(name: string, cb?: Function, thiz?: any): Promise<any>;
    function getResByUrl(url: string, cb?: Function, thiz?: any, type?: string): Promise<any>;
    function getGroupByName(name: string): any[];
    function hasRes(name: string): boolean;
    function setMaxLoadingThread(n: number): void;
}

declare var PIXI: any;
declare var DEBUG: boolean;
declare var Howl: any;
declare var Howler: any;

interface Window {
    platform: Platform;
    canvas: any;
    __game: any;
    egret: any;
    RES: any;
    dragonBones: any;
    PIXI: any;
}
