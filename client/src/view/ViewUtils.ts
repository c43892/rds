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
        } else
            bmp.texture = undefined;

        return bmp;
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
        t.fontFamily = "Microsoft YaHei";
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

    // 获取元素显示名称和描述信息
    public static getElemNameAndDesc(eType:string) {
        if (!ViewUtils.languageCfg)
            ViewUtils.languageCfg = GCfg.getMultiLanguageCfg();

        var descCfg = GCfg.getElemDescCfg();
        return descCfg[ViewUtils.languageCfg.currentLanguage][eType];
    }

    // 获取指定提示信息
    public static getTipText(key) {
        if (!ViewUtils.languageCfg)
            ViewUtils.languageCfg = GCfg.getMultiLanguageCfg();

        var mlCfg = ViewUtils.languageCfg;
        var curCfg = mlCfg.tips;
        return curCfg[key][mlCfg.currentLanguage];
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
                p.text = curCfg.text[name][mlCfg.currentLanguage] ? curCfg.text[name][mlCfg.currentLanguage] : curCfg.text[name];

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
