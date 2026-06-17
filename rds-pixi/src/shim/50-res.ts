// ============================================================================
// Egret RES -> PixiJS Assets resource manager
// Reads Egret's default.res.json (groups + resources) and loads via PIXI.Assets.
// ============================================================================

namespace RES {

    interface ResItem { url: string; type: string; name: string; }

    let prefix = "";
    const byName: { [name: string]: ResItem } = {};
    const groups: { [group: string]: string[] } = {};
    const loaded: { [name: string]: any } = {};

    export async function loadConfig(url: string, resourceRoot: string): Promise<void> {
        prefix = resourceRoot || "";
        const cfg = await (await fetch(url)).json();
        for (const item of cfg.resources || []) byName[item.name] = item;
        for (const g of cfg.groups || []) {
            const keys = (typeof g.keys === "string") ? g.keys.split(",") : (g.keys || []);
            groups[g.name] = keys.map((k: string) => k.trim()).filter((k: string) => k);
        }
    }

    export function getGroupByName(group: string): ResItem[] {
        return (groups[group] || []).map(n => byName[n]).filter(Boolean);
    }

    export function hasRes(name: string): boolean { return loaded[name] !== undefined || !!byName[name]; }
    export function getRes(name: string): any { return loaded[name]; }

    export function getResAsync(name: string, cb?: Function, thiz?: any): Promise<any> {
        if (loaded[name] !== undefined) { if (cb) cb.call(thiz, loaded[name]); return Promise.resolve(loaded[name]); }
        const item = byName[name];
        if (!item) { if (cb) cb.call(thiz, null); return Promise.resolve(null); }
        return loadOne(item).then(r => { if (cb) cb.call(thiz, r); return r; });
    }

    export function getResByUrl(url: string, cb?: Function, thiz?: any, type?: string): Promise<any> {
        return loadByUrl(url, type || guessType(url)).then(r => { if (cb) cb.call(thiz, r); return r; });
    }

    export function setMaxLoadingThread(_n: number) {}
    export function setMaxRetryTimes(_n: number) {}

    export async function loadGroup(group: string, priority = 0, reporter?: any): Promise<void> {
        const items = getGroupByName(group);
        const total = items.length;
        let done = 0;
        await Promise.all(items.map(async (item) => {
            try { await loadOne(item); }
            catch (e) { egret.warn("RES load failed: " + item.name, e); }
            done++;
            if (reporter && reporter.onProgress) reporter.onProgress(done, total);
        }));
    }

    function guessType(url: string): string {
        if (/\.(png|jpg|jpeg|webp)$/i.test(url)) return "image";
        if (/\.(mp3|ogg|wav)$/i.test(url)) return "sound";
        if (/\.(json|fnt)$/i.test(url)) return "json";
        return "text";
    }

    async function loadOne(item: ResItem): Promise<any> {
        if (loaded[item.name] !== undefined) return loaded[item.name];
        const url = prefix + item.url;
        const r = await loadByUrl(url, item.type);
        loaded[item.name] = r;
        return r;
    }

    async function loadByUrl(url: string, type: string): Promise<any> {
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
}
