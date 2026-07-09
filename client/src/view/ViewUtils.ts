class ViewUtils {
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    public static createBitmapByName(name: string = undefined, fillMode = egret.BitmapFillMode.SCALE):egret.Bitmap {
        return ViewUtils.setTexName(new egret.Bitmap(), name, true, fillMode);
    }

    public static createFromBitmapData(bmpData:egret.BitmapData, fillMode = egret.BitmapFillMode.SCALE) {
        var bmp = new egret.Bitmap();
        return ViewUtils.setBitmapData(bmp, bmpData, fillMode);
    }

    public static setBitmapData(bmp:egret.Bitmap, bmpData:egret.BitmapData, fillMode = egret.BitmapFillMode.SCALE) {
        if (!bmp.texture) bmp.texture = new egret.Texture();
        bmp.texture.bitmapData = bmpData;
        bmp.fillMode = fillMode;
        return;
    }

    public static setTex(bmp:egret.Bitmap, tex:egret.Texture, resetSize:boolean = false, fillMode = egret.BitmapFillMode.SCALE):egret.Bitmap {
        bmp.texture = tex;
        bmp.fillMode = fillMode;
        if (tex && resetSize) {
            bmp.width = tex.textureWidth;
            bmp.height = tex.textureHeight;
        }

        return bmp;
    }

    public static getTex(name:string) {
        let tex: egret.Texture = ResMgr.getRes(name);
        if (!tex)
            Utils.assert(false, "no texture created: " + name);

        return tex;
    }

    public static setTexName(bmp:egret.Bitmap, name:string, resetSize:boolean = false, fillMode = egret.BitmapFillMode.SCALE):egret.Bitmap {
        if (name) {
            let tex: egret.Texture = ResMgr.getRes(name);
            if (!tex)
                Utils.assert(false, "no texture created: " + name);
            ViewUtils.setTex(bmp, tex, resetSize, fillMode);
            ViewUtils.maybeLocalizeTex(bmp, name); // 文字烤在图里的资源,非中文时异步换成对应语言图
        } else
            bmp.texture = undefined;

        return bmp;
    }

    // 文字烤在图里、需按语言换图的资源名 -> 资源目录(相对 resource/)。
    // 在这些图放到 <目录>/i18n/<语言>/<名>.png。中文(CNS/CNT)用原图。
    static readonly localizedTextures = {
        "weeklyRankBtn_png":  "assets/ui/ranking/",
        "friendRankBtn_png":  "assets/ui/ranking/",
        "achvListBtn_png":    "assets/ui/achv/",
        "achvListBtnGray_png":"assets/ui/achv/",
        "achvAwardBtn_png":   "assets/ui/achv/",
        "achvAwardBtnGray_png":"assets/ui/achv/",
        "exchange_png":       "assets/ui/hospital/",
        "btnRob_png":         "assets/ui/shop/",
        "lvBtnOk_png":        "assets/ui/levelup/",
        "attrsBg_png":        "assets/ui/character/",
    };
    // 若该资源在 localizedTextures 里且当前非中文,异步加载 i18n/<语言>/ 图并替换纹理;
    // 缺该语言图则退英文;都没有则保持已设的原图。base 已同步设好,故任何时刻纹理都有效。
    private static maybeLocalizeTex(bmp:any, name:string) {
        var dir = ViewUtils.localizedTextures[name];
        if (!dir) return;
        var lang = ViewUtils.getLanguage();
        if (lang == "CNS" || lang == "CNT") return;
        var file = name.replace(/_png$/, ".png");
        var setPixi = (img) => { try { bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from(img)); } catch (e) {} };
        ViewUtils.loadImg("resource/" + dir + "i18n/" + lang + "/" + file, setPixi, () => {
            if (lang != "EN") ViewUtils.loadImg("resource/" + dir + "i18n/EN/" + file, setPixi);
        });
    }

    public static getBmpFont(fnt) {
        var tex = ResMgr.getRes(fnt + "_png");
        var cfg = ResMgr.getRes(fnt + "_json");
        var bmpFnt = new egret.BitmapFont(tex, cfg);
        return bmpFnt;
    }

    public static loadTex(name:string) {
        return egret.Texture = ResMgr.getRes(name);
    }

    // 创建指定帧动画
    public static createFrameAni(name:string, clipName:string = "default"):egret.MovieClip {
        var data = ResMgr.getRes(name + "_json");
        var txtr = ResMgr.getRes(name + "_png");
        Utils.assert(data && txtr, "no such frame ani effect:" + name);
        var fact:egret.MovieClipDataFactory = new egret.MovieClipDataFactory(data, txtr);
        var eff = new egret.MovieClip(fact.generateMovieClipData(clipName));
        Utils.assert(!!eff, "no such clip: " + clipName + " in frame ani: " + name);

        eff["wait"] = async () => {
            return new Promise<void>((r, _) => {
                var cb;
                cb = (e:egret.Event) => {
                    r();
                    eff.removeEventListener(egret.Event.COMPLETE, cb, this);
                };
                
                eff.addEventListener(egret.Event.COMPLETE, cb, this);
            });
        };
            

        return eff;
    }

    // 创建指定的骨骼动画
    public static createSkeletonAni(name:string, onFinished = undefined):dragonBones.Armature {
        var skeletonData = ResMgr.getRes(name + "_ske_json");
        var textureData = ResMgr.getRes(name + "_tex_json");
        var texture = ResMgr.getRes(name + "_tex_png");
        var fat:dragonBones.EgretFactory = new dragonBones.EgretFactory();
        fat.addDragonBonesData(fat.parseDragonBonesData(skeletonData));
        fat.addTextureAtlasData(fat.parseTextureAtlasData(textureData, texture));
        var ani:dragonBones.Armature = fat.buildArmature(name);
        var onAniFnished;
        onAniFnished = (evt:dragonBones.AnimationEvent) => {
            onFinished(evt.animationName);
        };

        ani["stop"] = () => {
            ani.getDisplay().removeEventListener(dragonBones.AnimationEvent.COMPLETE, onAniFnished, this);
            dragonBones.WorldClock.clock.remove(ani);
        };

        ani["start"] = () => {
            if (onFinished)
                ani.getDisplay().addEventListener(dragonBones.AnimationEvent.COMPLETE, onAniFnished, this);
            dragonBones.WorldClock.clock.add(ani);
        };

        ani["start"]();
        return ani;
    }

    // // 测试置灰
    // static grayShaderFilter;
    // public static makeElemShaderGray(obj:egret.DisplayObject, makeGray:boolean) {
    //     if (!makeGray)
    //         obj.filters = undefined;

    //     if (!ViewUtils.grayShaderFilter) {
    //         let vertexSrc =
    //             "attribute vec2 aVertexPosition;\n" +
    //             "attribute vec2 aTextureCoord;\n" +
    //             "attribute vec2 aColor;\n" +
    //             "uniform vec2 projectionVector;\n" +
    //             "varying vec2 vTextureCoord;\n" +
    //             "varying vec4 vColor;\n" +
    //             "const vec2 center = vec2(-1.0, 1.0);\n" +
    //             "void main(void) {\n" +
    //             "   gl_Position = vec4( (aVertexPosition / projectionVector) + center , 0.0, 1.0);\n" +
    //             "   vTextureCoord = aTextureCoord;\n" +
    //             "   vColor = vec4(aColor.x, aColor.x, aColor.x, aColor.x);\n" +
    //             "}";
                
    //         let fragmentSrc =
    //             "precision lowp float;\n"+ 
    //             "varying vec2 vTextureCoord;\n"+
    //             "uniform sampler2D uSampler;\n"+
    //             "uniform float tw;\n"+
    //             "uniform float th;\n"+
    //             "void main() {\n"+
    //             "   vec2 tex = vTextureCoord;\n"+
    //             "   vec2 upLeftUV = vec2(tex.x-1.0/tw,tex.y-1.0/th);\n"+
    //             "   vec4 curColor = texture2D(uSampler,tex);\n"+
    //             "   vec4 upLeftColor = texture2D(uSampler,upLeftUV);\n"+
    //             "   vec4 delColor = curColor - upLeftColor;\n"+
    //             "   float h = 0.3*delColor.x + 0.59*delColor.y + 0.11*delColor.z;\n"+
    //             "   h = (0.25+h)*curColor.w;\n"+
    //             "   gl_FragColor = vec4(h,h,h,curColor.w/2.0);\n"+
    //             "}\n";

    //         ViewUtils.grayShaderFilter = new egret.CustomFilter(vertexSrc, fragmentSrc, {tw:obj.width, th:obj.height});
    //     }
        
    //     obj.filters = [ViewUtils.grayShaderFilter];
    // }

    // 将一个显示对象程序置灰
    public static makeGray(e:egret.DisplayObject, gray:boolean = true) {
        if (!gray) {
            e.filters = undefined;
            return;
        }
        
        var colorMatrix = [
            0.3, 0.4, 0.3, 0, 0,
            0.3, 0.4, 0.3, 0, 0,
            0.3, 0.4, 0.3, 0, 0,
            0, 0, 0, 1, 0
        ];
        var colorFilter = new egret.ColorMatrixFilter(colorMatrix);
        e.filters = [colorFilter];
    }

    // 创建一个显示文本
    public static createTextField(size:number, color:number, alignCenter:boolean = true, vAlignMiddle:boolean = true):egret.TextField {
        var t = new egret.TextField();
        t.fontFamily = "LXGW WenKai, Microsoft YaHei, sans-serif";
        t.size = size;
        t.textColor = color;
        t.textAlign = alignCenter ? egret.HorizontalAlign.CENTER : egret.HorizontalAlign.LEFT;
        t.verticalAlign = vAlignMiddle ? egret.VerticalAlign.MIDDLE : egret.VerticalAlign.TOP;
        t.x = t.y = 0;
        return t;
    }

    // 获取全局坐标和尺寸
    public static getGlobalPosAndSize(obj:egret.DisplayObject) {
        var pos = AniUtils.ani2global(obj);
        var s = ViewUtils.getGlobalScale(obj);
        var w = obj.width * s.scaleX;
        var h = obj.height * s.scaleY;
        return {x:pos.x, y:pos.y, w:w, h:h};
    }

    static languageCfg;

    // ---- 多语言基础设施 ----------------------------------------------------
    // 语言回退顺序：先英文(通用且已 100% 翻译),再中文源。未翻译的语言(日/韩/法/德/西/俄)
    // 因此回退到英文而非中文,对非中文用户更友好。CNS/CNT 已全译,不会触发回退。
    static readonly langFallbacks = ["EN", "CNS"];
    // 浏览器 locale 前缀 -> 语言键（新增语言时只需在此登记；最终是否生效仍以 validLanguages 为准）
    static readonly localeMap = {
        "zh-tw":"CNT", "zh-hk":"CNT", "zh-mo":"CNT", "zh-hant":"CNT",
        "zh":"CNS", "zh-cn":"CNS", "zh-sg":"CNS", "zh-hans":"CNS",
        "en":"EN", "ja":"JA", "ko":"KO",
        "es":"ES", "fr":"FR", "de":"DE", "pt":"PT", "ru":"RU"
    };

    // 各语言的自称（用于语言切换按钮显示）
    static readonly langNativeNames = {
        EN:"English", CNS:"简体中文", CNT:"繁體中文", JA:"日本語", KO:"한국어",
        ES:"Español", FR:"Français", DE:"Deutsch", PT:"Português", RU:"Русский"
    };
    public static langNativeName(lang:string):string {
        return ViewUtils.langNativeNames[lang] || lang;
    }
    // 在 validLanguages 里循环取下一个语言
    public static nextLanguage():string {
        var v = ViewUtils.getValidLanguages();
        var i = v.indexOf(ViewUtils.getLanguage());
        return v[(i + 1) % v.length];
    }

    // ---- 语言国旗(矢量 SVG;跨平台,规避 Windows 不渲染 emoji 国旗) ----
    // 5 角星顶点(rotDeg=指向角度,-90 为正上)
    private static star5(cx:number, cy:number, R:number, rotDeg:number):string {
        var rot = rotDeg * Math.PI / 180, pts = [];
        for (var i = 0; i < 5; i++) {
            var a = rot + i * 2 * Math.PI / 5;
            pts.push((cx + R * Math.cos(a)).toFixed(1) + ',' + (cy + R * Math.sin(a)).toFixed(1));
            var a2 = a + Math.PI / 5, r2 = R * 0.382;
            pts.push((cx + r2 * Math.cos(a2)).toFixed(1) + ',' + (cy + r2 * Math.sin(a2)).toFixed(1));
        }
        return pts.join(' ');
    }
    // 圆角半透明面板位图(用于语言选择弹窗底板)
    public static createPanelBitmap(w:number, h:number):any {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>"
            + "<rect x='1' y='1' width='" + (w - 2) + "' height='" + (h - 2) + "' rx='12' fill='#202830' fill-opacity='0.96' stroke='#ffffff' stroke-opacity='0.85' stroke-width='2'/></svg>";
        var bmp = new egret.Bitmap();
        try { bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from("data:image/svg+xml;utf8," + encodeURIComponent(svg))); } catch (e) {}
        return bmp;
    }
    // 羊皮纸风圆角面板位图(用于非中文版图例底板,贴合原卷轴美术色调)
    public static createParchmentBitmap(w:number, h:number):any {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>"
            + "<defs><linearGradient id='pg' x1='0' y1='0' x2='0' y2='1'>"
            + "<stop offset='0' stop-color='#d8c08a'/><stop offset='0.5' stop-color='#c9ad77'/><stop offset='1' stop-color='#b6985f'/>"
            + "</linearGradient></defs>"
            + "<rect x='2' y='2' width='" + (w - 4) + "' height='" + (h - 4) + "' rx='14' fill='url(#pg)' stroke='#6b4f2a' stroke-width='3'/>"
            + "<rect x='8' y='8' width='" + (w - 16) + "' height='" + (h - 16) + "' rx='10' fill='none' stroke='#8a6c3c' stroke-width='1.5' stroke-opacity='0.6'/></svg>";
        var bmp = new egret.Bitmap();
        try { bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from("data:image/svg+xml;utf8," + encodeURIComponent(svg))); } catch (e) {}
        return bmp;
    }
    // 纯色块位图(用于遮盖背景图里烤死的文字等)
    public static createColorBitmap(w:number, h:number, color:string = "#0c0c0c", opacity:number = 1):any {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>"
            + "<rect x='0' y='0' width='" + w + "' height='" + h + "' fill='" + color + "' fill-opacity='" + opacity + "'/></svg>";
        var bmp = new egret.Bitmap();
        try { bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from("data:image/svg+xml;utf8," + encodeURIComponent(svg))); } catch (e) {}
        return bmp;
    }
    // 行高亮位图(当前语言行背景)
    public static createHighlightBitmap(w:number, h:number):any {
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>"
            + "<rect x='0' y='0' width='" + w + "' height='" + h + "' rx='8' fill='#ffffff' fill-opacity='0.16'/></svg>";
        var bmp = new egret.Bitmap();
        try { bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from("data:image/svg+xml;utf8," + encodeURIComponent(svg))); } catch (e) {}
        return bmp;
    }

    // 生成本地化按钮的 SVG(木质风底 + 正常字体文字),尺寸 w x h
    private static buttonSVG(text:string, w:number, h:number):string {
        var fam = ViewUtils.getUIFontFamily().replace(/"/g, "'");
        var cjk = /[　-鿿가-힯぀-ヿ]/.test(text);
        var cw = cjk ? 1.02 : 0.6;
        var byW = Math.floor((w - 26) / Math.max(1, text.length) / cw);
        var byH = Math.round(h * 0.5);
        var fs = Math.max(16, Math.min(byH, byW, 46));
        var esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // 木底配色取自原按钮采样(橄榄金棕 ~#706030~#908040),金字 ~#be9140,深描边。
        // 外深描边 + 内金色描边(立体边框感),与原花体按钮风格统一。
        return "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h + "'>"
            + "<defs><linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#93783b'/><stop offset='0.5' stop-color='#74592a'/><stop offset='1' stop-color='#574018'/></linearGradient></defs>"
            + "<rect x='2' y='2' width='" + (w - 4) + "' height='" + (h - 4) + "' rx='12' fill='url(#bg)' stroke='#2b1d0d' stroke-width='3'/>"
            + "<rect x='5.5' y='5.5' width='" + (w - 11) + "' height='" + (h - 11) + "' rx='9' fill='none' stroke='#caa766' stroke-opacity='0.5' stroke-width='1.5'/>"
            + "<rect x='6' y='5' width='" + (w - 12) + "' height='" + Math.round(h * 0.34) + "' rx='8' fill='#ffffff' fill-opacity='0.10'/>"
            + "<text x='" + (w / 2) + "' y='" + (h / 2 + fs * 0.34) + "' font-family=\"" + fam + "\" font-weight='bold' font-size='" + fs + "' fill='#efc96f' stroke='#2b1d0d' stroke-width='1' text-anchor='middle'>" + esc(text) + "</text>"
            + "</svg>";
    }
    // 把一个 TextButtonWithBg 本地化(英文版不调用,保留原花体图)。
    // 优先用“该语言的成品按钮图”(美术/AI 按原图重绘文字后放到
    //   resource/assets/ui/login/i18n/<base>_<LANG>.png,如 NewGameNormal_CNS.png);
    // 若该图不存在,则回退到运行时现生成的木质按钮(buttonSVG)。
    private static applyButtonTexture(btn:any, pixiTex:any, w:number, h:number) {
        try {
            btn.bg.texture = (<any>egret).Texture.fromPixi(pixiTex);
            btn.setDownBg(undefined);     // 去掉英文按下态图
            btn.setDisableBg(undefined);  // 去掉英文禁用态图(改用置灰)
            btn.bg.width = w; btn.bg.height = h;
        } catch (e) {}
    }
    private static applyGeneratedButton(btn:any, text:string, w:number, h:number) {
        try {
            var pixiTex = (<any>window).PIXI.Texture.from("data:image/svg+xml;utf8," + encodeURIComponent(ViewUtils.buttonSVG(text, w, h)));
            var apply = () => ViewUtils.applyButtonTexture(btn, pixiTex, w, h);
            if (pixiTex.baseTexture.valid) apply(); else pixiTex.baseTexture.once('loaded', apply);
        } catch (e) {}
    }
    private static loadImg(url:string, onok:(img:any)=>void, onfail?:()=>void) {
        try { var im = new Image(); im.onload = () => onok(im); im.onerror = () => { if (onfail) onfail(); }; im.src = url; }
        catch (e) { if (onfail) onfail(); }
    }
    // 用已加载的图片设置按下/禁用态底图(替代英文专用图)
    private static setStateBg(btn:any, prop:string, img:any, w:number, h:number) {
        try {
            if (btn[prop]) { try { btn.removeChild(btn[prop]); } catch (e) {} btn[prop] = undefined; }
            var bmp = new egret.Bitmap();
            bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from(img));
            bmp.alpha = 0; bmp.width = w; bmp.height = h;
            btn[prop] = bmp; btn.addChild(bmp);
            btn.refresh();
            if (prop === "disabledBg") btn.enabled = btn.enabled; // 重置一次以套用禁用态视觉
        } catch (e) {}
    }
    // prefix ∈ {NewGame, Continue, Heros, Achievement}。优先用 i18n/<LANG>/<prefix>Normal.png
    // (含 Down/Disabled 三态);缺 Normal 则回退现生成的木质按钮。
    public static localizeButton(btn:any, prefix:string, text:string) {
        if (!btn || !btn.bg) return;
        var w = Math.round(btn.width), h = Math.round(btn.height);
        var dir = "resource/assets/ui/login/i18n/" + ViewUtils.getLanguage() + "/";
        ViewUtils.loadImg(dir + prefix + "Normal.png",
            (img) => {
                try { ViewUtils.applyButtonTexture(btn, (<any>window).PIXI.Texture.from(img), w, h); }
                catch (e) { ViewUtils.applyGeneratedButton(btn, text, w, h); return; }
                // 有按下/禁用态就一并替换(没有则保持:置灰)
                ViewUtils.loadImg(dir + prefix + "Down.png", (d) => ViewUtils.setStateBg(btn, "downBg", d, w, h));
                ViewUtils.loadImg(dir + prefix + "Disabled.png", (d) => ViewUtils.setStateBg(btn, "disabledBg", d, w, h));
            },
            () => ViewUtils.applyGeneratedButton(btn, text, w, h)
        );
    }

    // 把一张 egret.Bitmap 替换为本地化版本图片。CNS/CNT 用原图(原图即中文);
    // 其它语言加载 <baseDir>i18n/<LANG>/<fileName>,失败则保持原图。保持原显示尺寸。
    public static localizeImage(bmp:egret.Bitmap, baseDir:string, fileName:string) {
        if (!bmp) return;
        var lang = ViewUtils.getLanguage();
        if (lang == "CNS" || lang == "CNT") return;
        var w = bmp.width, h = bmp.height;
        var setTex = (img) => {
            try {
                bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from(img));
                if (w) bmp.width = w;
                if (h) bmp.height = h;
            } catch (e) {}
        };
        ViewUtils.loadImg(baseDir + "i18n/" + lang + "/" + fileName, setTex, () => {
            // 该语言没有专属图(如暂无美术的 PT)-> 退到英文图,好过给非中文用户看中文原图
            if (lang != "EN") ViewUtils.loadImg(baseDir + "i18n/EN/" + fileName, setTex);
        });
    }

    // 一面 60x40 国旗的内部 SVG 标记(不含外层 <svg>)
    private static flagInner(lang:string):string {
        switch (lang) {
            case 'FR': return "<rect width='20' height='40' fill='#0055A4'/><rect x='20' width='20' height='40' fill='#fff'/><rect x='40' width='20' height='40' fill='#EF4135'/>";
            case 'DE': return "<rect width='60' height='40' fill='#FFCE00'/><rect width='60' height='26.7' fill='#DD0000'/><rect width='60' height='13.3' fill='#000'/>";
            case 'RU': return "<rect width='60' height='40' fill='#D52B1E'/><rect width='60' height='26.7' fill='#0039A6'/><rect width='60' height='13.3' fill='#fff'/>";
            case 'ES': return "<rect width='60' height='40' fill='#AA151B'/><rect y='10' width='60' height='20' fill='#F1BF00'/>";
            case 'PT': return "<rect width='60' height='40' fill='#DA291C'/><rect width='24' height='40' fill='#046A38'/><circle cx='24' cy='20' r='5.5' fill='#FFE600' stroke='#7a5c00' stroke-width='0.8'/>";
            case 'JA': return "<rect width='60' height='40' fill='#fff'/><circle cx='30' cy='20' r='10' fill='#BC002D'/>";
            case 'KO': return "<rect width='60' height='40' fill='#fff'/><circle cx='30' cy='20' r='9' fill='#003478'/><path d='M21,20 a9,9 0 0,1 18,0 z' fill='#C60C30'/>";
            case 'EN': return "<rect width='60' height='40' fill='#012169'/>"
                + "<path d='M0,0 L60,40 M60,0 L0,40' stroke='#fff' stroke-width='8'/>"
                + "<path d='M0,0 L60,40 M60,0 L0,40' stroke='#C8102E' stroke-width='3.5'/>"
                + "<rect x='24' width='12' height='40' fill='#fff'/><rect y='14' width='60' height='12' fill='#fff'/>"
                + "<rect x='26.5' width='7' height='40' fill='#C8102E'/><rect y='16.5' width='60' height='7' fill='#C8102E'/>";
            case 'CNS': case 'CNT': {
                var s = "<rect width='60' height='40' fill='#DE2910'/>";
                s += "<polygon points='" + ViewUtils.star5(12, 12, 6.5, -90) + "' fill='#FFDE00'/>";
                var small = [[25, 4], [30, 9], [30, 17], [25, 22]];
                for (var sm of small) {
                    var rot = Math.atan2(12 - sm[1], 12 - sm[0]) * 180 / Math.PI;
                    s += "<polygon points='" + ViewUtils.star5(sm[0], sm[1], 2.3, rot) + "' fill='#FFDE00'/>";
                }
                // 简/繁 角标(脚本区分,避免使用政治敏感的单独旗帜)
                var badge = lang === 'CNS' ? '简' : '繁';
                s += "<rect x='39' y='26' width='19' height='12' rx='2' fill='#000' fill-opacity='0.55'/>";
                s += "<text x='48.5' y='35.5' font-size='10' text-anchor='middle' fill='#fff' font-family='sans-serif'>" + badge + "</text>";
                return s;
            }
            default: {
                var code = (lang || '?').toUpperCase().slice(0, 2);
                return "<rect width='60' height='40' fill='#5b6b7a'/><text x='30' y='27' font-size='18' text-anchor='middle' fill='#fff' font-family='sans-serif' font-weight='bold'>" + code + "</text>";
            }
        }
    }
    // 独立的一面国旗 SVG(60x40)
    public static flagSVG(lang:string):string {
        return "<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'>" + ViewUtils.flagInner(lang) + "</svg>";
    }
    // 生成“国旗 chip”Bitmap:圆角深色底 + 白描边 + 圆角裁切的国旗。整块一张矢量 SVG。
    // 尺寸 66x46(国旗 60x40 居中,留 3px 边)。
    public static createFlagBitmap(lang:string, scale:number = 1):any {
        var W = 60, H = 40, r = 6;
        // 按 scale 放大输出像素(width/height),viewBox 不变 -> 矢量栅格化更大、保持清晰
        var ow = Math.round(W * scale), oh = Math.round(H * scale);
        // 旗面铺满整个 chip、圆角裁切;白边直接贴着旗面(无内缩、无露底)
        var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + ow + "' height='" + oh + "' viewBox='0 0 " + W + " " + H + "'>"
            + "<defs><clipPath id='fc'><rect x='0' y='0' width='" + W + "' height='" + H + "' rx='" + r + "'/></clipPath></defs>"
            + "<g clip-path='url(#fc)'>" + ViewUtils.flagInner(lang) + "</g>"
            + "<rect x='1' y='1' width='" + (W - 2) + "' height='" + (H - 2) + "' rx='" + (r - 1) + "' fill='none' stroke='#ffffff' stroke-opacity='0.9' stroke-width='2'/>"
            + "</svg>";
        var bmp = new egret.Bitmap();
        try {
            var uri = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
            bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from(uri));
        } catch (e) {}
        return bmp;
    }

    // 用户提供的"旗杆挂旗"图标(assets/ui/flags/<LANG>.png,约 208x256 竖版)。
    // 异步加载,按 targetH 等比缩放;加载完成回调 onSized(可用于重新定位)。
    // 图缺失时回退旧的矢量 SVG 芯片,保证任何语言都有旗可显。
    public static createFlagImageBitmap(lang:string, targetH:number, onSized?:(bmp:any)=>void):any {
        var bmp = new egret.Bitmap();
        ViewUtils.loadImg("resource/assets/ui/flags/" + lang + ".png", (img) => {
            try {
                bmp.texture = (<any>egret).Texture.fromPixi((<any>window).PIXI.Texture.from(img));
                var aspect = img.width / img.height;
                bmp.height = targetH;
                bmp.width = Math.round(targetH * aspect);
                if (onSized) onSized(bmp);
            } catch (e) {}
        }, () => {
            // 回退:矢量 SVG 芯片(60x40 横版),等比适配 targetH
            try {
                var chip = ViewUtils.createFlagBitmap(lang, 2);
                bmp.texture = chip.texture;
                bmp.height = Math.round(targetH * 0.66);
                bmp.width = Math.round(bmp.height * 1.5);
                if (onSized) onSized(bmp);
            } catch (e) {}
        });
        return bmp;
    }

    // 按语言的 UI 字体栈：栈末尾留系统字体，未 bundle 对应字体时也能由操作系统渲染
    // (日文假名/韩文谚文/西里尔等不出豆腐块)。bundled 字体(如 LXGW)放栈首优先用。
    static readonly uiFontFamilies = {
        CNS: "LXGW WenKai, Microsoft YaHei, PingFang SC, sans-serif",
        CNT: "LXGW WenKai, Microsoft JhengHei, PingFang TC, sans-serif",
        JA:  "LXGW WenKai, Hiragino Sans, Yu Gothic, Meiryo, MS Gothic, sans-serif",
        KO:  "Malgun Gothic, Apple SD Gothic Neo, Nanum Gothic, sans-serif",
        _default: "LXGW WenKai, Segoe UI, Arial, sans-serif" // 拉丁/西里尔(EN/ES/FR/DE/PT/RU)
    };
    public static getUIFontFamily(lang?:string):string {
        lang = lang || ViewUtils.getLanguage();
        return ViewUtils.uiFontFamilies[lang] || ViewUtils.uiFontFamilies._default;
    }
    // 把当前语言的字体栈设为 TextField 的默认字体(须在构建界面前调用)
    public static applyUIFont() {
        try { (<any>egret).TextField.defaultFontFamily = ViewUtils.getUIFontFamily(); } catch (e) {}
    }

    private static ensureLangCfg() {
        if (!ViewUtils.languageCfg)
            ViewUtils.languageCfg = GCfg.getMultiLanguageCfg();
        return ViewUtils.languageCfg;
    }

    // 当前活动语言（单一真源）
    public static getLanguage():string {
        return ViewUtils.ensureLangCfg().currentLanguage;
    }

    // 支持的语言列表
    public static getValidLanguages():string[] {
        return ViewUtils.ensureLangCfg().validLanguages || ["EN", "CNS", "CNT"];
    }

    // 设置当前语言并持久化（不在这里刷新界面，刷新由调用方决定）
    public static setLanguage(lang:string) {
        var cfg = ViewUtils.ensureLangCfg();
        if (ViewUtils.getValidLanguages().indexOf(lang) < 0) return;
        cfg.currentLanguage = lang;
        try { Utils.saveLocalItem("language", lang); } catch (e) {}
    }

    // 启动时确定默认语言：存档优先，其次浏览器 locale，最后 CNS；都要落在 validLanguages 内
    public static resolveStartupLanguage():string {
        var valid = ViewUtils.getValidLanguages();
        var saved = null;
        try { saved = Utils.loadLocalItem("language"); } catch (e) {}
        if (saved && valid.indexOf(saved) >= 0) return saved;

        var locales = [];
        try {
            var nav:any = (typeof navigator !== "undefined") ? navigator : null;
            if (nav) locales = (nav.languages && nav.languages.length ? nav.languages : [nav.language || ""]);
        } catch (e) {}
        for (var loc of locales) {
            var l = (loc || "").toLowerCase();
            // 先整体匹配（如 zh-tw），再退到主语言（如 zh / en）
            var mapped = ViewUtils.localeMap[l] || ViewUtils.localeMap[l.split("-")[0]];
            if (mapped && valid.indexOf(mapped) >= 0) return mapped;
        }
        return valid.indexOf("CNS") >= 0 ? "CNS" : valid[0];
    }

    // 从 {EN,CNS,CNT,...} 形状的多语言条目里按当前语言取值，缺失则回退并告警
    public static pickByLang(entry, keyForWarn?:string) {
        if (entry == null) return entry;
        var lang = ViewUtils.getLanguage();
        if (entry[lang] != undefined) return entry[lang];
        for (var fb of ViewUtils.langFallbacks) {
            if (entry[fb] != undefined) {
                if (DEBUG) console.warn("[i18n] missing '" + lang + "' for " + (keyForWarn || "?") + ", fallback " + fb);
                return entry[fb];
            }
        }
        // 最后兜底：任意已有语言
        for (var k in entry) if (typeof entry[k] === "string") return entry[k];
        return entry;
    }

    // 顶层按语言分的配置（occUnlockDesc / achvDesc / worldmapeventsels）：取当前语言的整段，
    // 缺失则回退 CNS->EN。逻辑只存源语言(CNS)一份，其它语言可选地只翻译需要的部分。
    public static pickLangSection(cfg) {
        if (!cfg) return cfg;
        var lang = ViewUtils.getLanguage();
        if (cfg[lang]) return cfg[lang];
        for (var fb of ViewUtils.langFallbacks) if (cfg[fb]) return cfg[fb];
        return cfg; // 未迁移/异常时原样返回，保证不崩
    }

    // 获取元素显示名称和描述信息（elemdesc 顶层按语言分）
    public static getElemNameAndDesc(eType:string) {
        var descCfg = GCfg.getElemDescCfg();
        var lang = ViewUtils.getLanguage();
        // 候选语言优先级：当前语言 -> 回退链。逐字段补齐,确保 name/shortDesc/desc 都不为空。
        var order = [lang];
        for (var fb of ViewUtils.langFallbacks) if (order.indexOf(fb) < 0) order.push(fb);

        var primary = undefined;
        for (var l of order) {
            if (descCfg[l] && descCfg[l][eType] != undefined) { primary = descCfg[l][eType]; break; }
        }
        if (primary == undefined) return undefined;

        // 浅拷贝,避免污染配置;对缺失字段(尤其 desc 富文本正文)从回退语言补齐,
        // 否则部分翻译(只译了 name/shortDesc、漏了 desc)会让描述视图读到 undefined.desc 而抛错/空白。
        var merged:any = {};
        for (var k in primary) merged[k] = primary[k];
        var hasDesc = merged.desc != undefined && merged.desc.length > 0;
        var hasUDA = merged.useDescArr != undefined && merged.useDescArr.length > 0;
        // 该元素在任一语言里有 useDescArr,才说明它"应当"有(并非所有元素都有)。
        var udaExpected = false;
        for (var l of order) { var ee0 = descCfg[l] && descCfg[l][eType]; if (ee0 && ee0.useDescArr && ee0.useDescArr.length) { udaExpected = true; break; } }
        if (!hasDesc || (udaExpected && !hasUDA) || merged.name == undefined || merged.shortDesc == undefined) {
            for (var l of order) {
                var e = descCfg[l] && descCfg[l][eType];
                if (!e) continue;
                if (!hasDesc && e.desc != undefined && e.desc.length > 0) { merged.desc = e.desc; hasDesc = true; }
                if (!hasUDA && e.useDescArr != undefined && e.useDescArr.length > 0) { merged.useDescArr = e.useDescArr; hasUDA = true; }
                if (merged.name == undefined && e.name != undefined) merged.name = e.name;
                if (merged.shortDesc == undefined && e.shortDesc != undefined) merged.shortDesc = e.shortDesc;
            }
            if (DEBUG && !hasDesc) console.warn("[i18n] elemdesc no 'desc' anywhere for " + eType);
        }
        return merged;
    }

    // 获取指定提示信息
    public static getTipText(key) {
        var mlCfg = ViewUtils.ensureLangCfg();
        return ViewUtils.pickByLang(mlCfg.tips[key], "tip:" + key);
    }
    
    // 创建一批图像对象并赋值
    public static createImgs(view:egret.DisplayObjectContainer, varNames:string[], texNames:string[]) {
        Utils.assert(varNames.length == texNames.length, "var nubmer mismatched the tex number");
        varNames.forEach((vn, i) => {
            var img = ViewUtils.createBitmapByName(texNames[i]);
            img.name = vn;
            view[vn] = img;
            view.addChild(img);
        });
    }

    // 遍历所有子对象
    public static forEachChild(c:egret.DisplayObjectContainer, f) {
        var breakLoop = false;
        for (var i = 0; i < c.numChildren && !breakLoop; i++)
            breakLoop = f(c.getChildAt(i))
    }

    // 对给定显示对象进行多语言处理
    public static multiLang(view, ...ps) {
        if (!ViewUtils.languageCfg)
            ViewUtils.languageCfg = GCfg.getMultiLanguageCfg();

        var mlCfg = ViewUtils.languageCfg;
        var curCfg = mlCfg.views[view.name];
        if (!curCfg) return;

        for (var p of ps) {
            var name = p.name;

            // layout
            if (curCfg.layout && curCfg.layout[name]) {
                var lyt = curCfg.layout[name][mlCfg.currentLanguage] ? curCfg.layout[name][mlCfg.currentLanguage] : curCfg.layout[name];
                p.x = lyt.x != undefined ? lyt.x : p.x;
                p.y = lyt.y != undefined ? lyt.y : p.y;
                p.width = lyt.w != undefined ? lyt.w : p.width;
                p.height = lyt.h != undefined ? lyt.h : p.height;
                p.size = lyt.size != undefined ? lyt.size : p.size;
                p.rotation = lyt.rotation != undefined ? lyt.rotation : p.rotation;
            }

            // text
            if ((p instanceof egret.TextField || p instanceof TextButtonWithBg) && curCfg.text && curCfg.text[name])
                p.text = ViewUtils.pickByLang(curCfg.text[name], "view:" + view.name + "." + name);

            // image
            if ((p instanceof egret.Bitmap || p instanceof TextButtonWithBg) && curCfg.imgs && curCfg.imgs[name]) {
                var bmp = p instanceof TextButtonWithBg ? p.bg : p;
                ViewUtils.setTexName(bmp, curCfg.imgs[name][mlCfg.currentLanguage] ? curCfg.imgs[name][mlCfg.currentLanguage] : curCfg.imgs[name]);
            }

            if (p instanceof TextButtonWithBg)
                (<TextButtonWithBg>p).refresh();
        }
    }

    // 根据对象身上的动态属性，替换掉目标字符串中的 {propertyName} 标签
    public static replaceByProperties(s:string, e, player, forLevelUp:number = undefined):string {
        const r = /\{[a-z,A-Z,0-9,_,-]*\}/g;        
        var ss = s;
        var m = r.exec(s);
        while (m) {
            var value = m[0];
            var key = value.substr(1, value.length - 2);
            if(ElemActiveDesc.elems[e.type] && ElemActiveDesc.elems[e.type][key])
                ss = ss.replace(value, ElemActiveDesc.elems[e.type][key](player, e));
            else if (e[key] != undefined)
                ss = ss.replace(value, e[key].toString());
            else if (e.attrs[key] != undefined) {
                if (forLevelUp != undefined && e.attrs.reinforce[0] && e.attrs.reinforce[0][key]) { // 针对升级属性特别处理
                    var lastValue = ElemActiveDesc.getRelicReinforceLvOnPlayerAddLv(player, e, key, forLevelUp-1);
                    var nowValue = ElemActiveDesc.getRelicReinforceLvOnPlayerAddLv(player, e, key, forLevelUp);
                    if (!lastValue)
                        ss = ss.replace(value, e.attrs[key].toString());
                    else {
                        var dv = nowValue - lastValue;
                        var dvStr = "(" + (dv >= 0 ? "+" + dv.toString() : dv.toString()) + ")";
                        ss = ss.replace(value, lastValue + dvStr);
                    }
                } else
                    ss = ss.replace(value, e.attrs[key].toString());
            }

            m = r.exec(s);
        }

        return ss;
    }

    // 格式化字符串
    public static formatString(fmt, ...ps):string {
        return fmt.replace(/{(\d+)}/g, (match, number) => typeof ps[number] != 'undefined' ? ps[number] : match);
    }

    // 格式化提示字符串
    public static formatTip(tip, ...ps):string {
        var fmt = ViewUtils.getTipText(tip);
        return ViewUtils.formatString(fmt, ...ps);
    }

    // 安全显示区域，去掉刘海部分，比主显示区域大，非标准纵横比
    public static FullArea:egret.DisplayObjectContainer;

    // 主显示区域，标准纵横比
    public static MainArea:egret.DisplayObjectContainer;

    // 作为背景填充安全显示区域
    public static fullSize = {w:758, h:1280};
    public static stageSize;
    public static asFullBg(obj:egret.DisplayObject) {
        var parent = obj.parent;
        var parentScale = ViewUtils.getGlobalScale(parent);
        var parentPos = AniUtils.ani2global(parent);
        obj.width = ViewUtils.fullSize.w / parentScale.scaleX;
        obj.height = ViewUtils.fullSize.h / parentScale.scaleY;
        obj.x = (ViewUtils.MainArea.width - obj.width) / 2 - parentPos.x;
        obj.y = (ViewUtils.MainArea.height - obj.height) / 2 - parentPos.y;
    }
    
    // 获取全局缩放值
    public static getGlobalScale(obj:egret.DisplayObject) {
        if (obj == ViewUtils.MainArea || obj == ViewUtils.FullArea)
            return {scaleX:1, scaleY:1};

        Utils.assert(!!obj.parent, "the object must rooted at MainArea or FullArea");
        var s = {scaleX:obj.scaleX, scaleY:obj.scaleY};
        var ps = ViewUtils.getGlobalScale(obj.parent);
        s = {scaleX:s.scaleX*ps.scaleX, scaleY:s.scaleY*ps.scaleY};

        return s;
    }

    // 解析 xml 为 textflow
    public static fromHtml(txt):egret.ITextElement[] {
        return (new egret.HtmlTextParser).parser(txt);
    }

    // 针对给定遗物生成等级符号并布局
    public static createRelicLevelStars(r:Relic, g:egret.DisplayObject, fakeRelic = false):egret.Bitmap[] {
        var totalLevel;
        var scale = g.width / 84;
        if(GCfg.getElemAttrsCfg(r.type).reinforce)
            totalLevel = GCfg.getElemAttrsCfg(r.type).reinforce.length + 1;
        else
            totalLevel = 1;
        var xStride = 11 * scale;
        var bmps:egret.Bitmap[] = [];
        var center = (totalLevel - 1) / 2;
        var radius = 80 * scale;
        var point = {x: g.x + g.width / 2, y:g.y + g.height + radius}
        for (var j = 0; j < totalLevel; j++) {
            var star = ViewUtils.createBitmapByName("relicLvSign_png");
            star.width = star.width * scale;
            star.height = star.height * scale;
            star.anchorOffsetX = star.width / 2;
            star.anchorOffsetY = star.height / 2;
            var angle = 90 - (j - center) * 8;
            var radian = angle / 360 * 2 * Math.PI;
            star.x = point.x + Math.cos(radian) * radius + (j - center) * 1;
            star.y = point.y - Math.sin(radian) * radius ;
            star.rotation = 90 - angle;
            bmps.push(star);
        }
        // 部分只做表现用的技能是没有等级的
        if (!fakeRelic)
            for (var i = 0; i <= r.reinforceLv; i++)
                ViewUtils.setTexName(bmps[i], "relicLvSign2_png");

        return bmps;
    }

    // 创建一个小型的显示遗物信息的区域
    public static createSmallRelicInfoRect(e:Relic):egret.DisplayObject[] {
        // 背景底图
        var bg = ViewUtils.createBitmapByName("confirmBg_png");
        bg.name = "bg";
        bg.width = 300;

        // 图标
        var icon = ViewUtils.createBitmapByName(e.getElemImgRes() + "_png");
        icon.x = bg.x + 40;
        icon.y = bg.y + 20;
        icon.width *= 0.75;
        icon.height *= 0.75;
        icon.name = "icon";

        // 添加遗物等级星星
        var stars = ViewUtils.createRelicLevelStars(<Relic>e, icon);

        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);

        // 标题
        var title = ViewUtils.createTextField(30, 0x7d0403);
        title.text = nameAndDesc.name;
        title.textAlign = egret.HorizontalAlign.LEFT;
        title.x = icon.x + icon.width + 10;
        title.width = bg.width + bg.x - title.x;
        title.y = bg.y + 40;

        var currentY = title.y + title.height;

        // 多段描述信息，不是简要描述

        var descArr = ViewUtils.getElemNameAndDesc(e.type).desc;
        descArr = Utils.map(descArr, (desc) => ViewUtils.fromHtml(ViewUtils.replaceByProperties(desc, e, e.player)));
        var descObjs = [];
        for (var i = 0; i < descArr.length; i++) {
            var txt = ViewUtils.createTextField(0, 0x000000);
            txt.textAlign = egret.HorizontalAlign.LEFT;
            txt.lineSpacing = 8;
            txt.textFlow = descArr[i];
            txt.x = bg.x + 50;
            txt.width = bg.width - 80;

            var bgFrame = ViewUtils.createBitmapByName("bgFrame_png");
            bgFrame.x = bg.x + 30;
            bgFrame.width = bg.width - 60;
            bgFrame.y = currentY + 50;
            bgFrame.height = txt.height + 50;
            bgFrame.scale9Grid = new egret.Rectangle(45, 45, 225, 1);
            txt.y = bgFrame.y + 20;

            currentY = bgFrame.y + bgFrame.height;

            descObjs.push(bgFrame, txt);
        }

        bg.height = currentY + 50 - bg.y;

        return [bg, icon, title, title, ...stars, ...descObjs];
    }

    // 尝试移除一个子DisplayObject
    public static try2RemoveChild(parent:egret.DisplayObjectContainer, child:egret.DisplayObject){
        if (parent.getChildIndex(child) > -1)
                parent.removeChildAt(parent.getChildIndex(child));
    }

    // 尝试添加一个子DisplayObject
    public static tyr2AddChild(parent:egret.DisplayObjectContainer, child:egret.DisplayObject){
        if (parent.getChildIndex(child) == -1)
                parent.addChild(child);
    }
}
