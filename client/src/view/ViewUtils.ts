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
        let tex: egret.Texture = RES.getRes(name);
        if (!tex)
            Utils.assert(false, "no texture created: " + name);

        return tex;
    }

    public static setTexName(bmp:egret.Bitmap, name:string, resetSize:boolean = false, fillMode = egret.BitmapFillMode.SCALE):egret.Bitmap {
        if (name) {
            let tex: egret.Texture = RES.getRes(name);
            if (!tex)
                Utils.assert(false, "no texture created: " + name);
            ViewUtils.setTex(bmp, tex, resetSize, fillMode);
        }

        return bmp;
    }

    public static getFont(fnt) {
        return RES.getRes(fnt);
    }

    public static loadTex(name:string) {
        return egret.Texture = RES.getRes(name);
    }

    // 创建指定帧动画
    public static createFrameAni(name:string, clipName:string = "default"):egret.MovieClip {
        var data = RES.getRes(name + "_json");
        var txtr = RES.getRes(name + "_png");
        var fact:egret.MovieClipDataFactory = new egret.MovieClipDataFactory(data, txtr);
        var eff = new egret.MovieClip(fact.generateMovieClipData(clipName));

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
        var skeletonData = RES.getRes(name + "_ske_json");
        var textureData = RES.getRes(name + "_tex_json");
        var texture = RES.getRes(name + "_tex_png");
        var fat:dragonBones.EgretFactory = new dragonBones.EgretFactory();
        fat.addDragonBonesData(fat.parseDragonBonesData(skeletonData));
        fat.addTextureAtlasData(fat.parseTextureAtlasData(textureData, texture));
        var ani:dragonBones.Armature = fat.buildArmature(name);
        var onAniFnished;
        onAniFnished = (evt:dragonBones.AnimationEvent) => {
            onFinished(ani);
            ani.getDisplay().removeEventListener(dragonBones.AnimationEvent.COMPLETE, onAniFnished, this);
            dragonBones.WorldClock.clock.remove(ani);
        };

        if (onFinished)
            ani.getDisplay().addEventListener(dragonBones.AnimationEvent.COMPLETE, onAniFnished, this);
        dragonBones.WorldClock.clock.add(ani);
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
    public static createTextField(size:number, color:number, alignCenter:boolean = true, vAlignMiddle:boolean = true) {
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
        var pos = obj.localToGlobal();
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
                p.x = lyt.x ? lyt.x : p.x;
                p.y = lyt.y ? lyt.y : p.y;
                p.width = lyt.w ? lyt.w : p.width;
                p.height = lyt.h ? lyt.h : p.height;
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
    public static replaceByProperties(s:string, e, player):string {
        const r = /\{[a-z,A-Z,0-9,_,-]*\}/g;
        const m = r.exec(s);
        var ss = s;
        if (m) {
            for (var i = 0; i < m.length; i++) {
                var value = m[i];
                var key = value.substr(1, value.length - 2);
                if(ElemActiveDesc.elems[e.type] && ElemActiveDesc.elems[e.type][key])
                    ss = ss.replace(value, ElemActiveDesc.elems[e.type][key](player, e));                
                else if (e[key] != undefined)
                    ss = ss.replace(value, e[key].toString());
                else if (e.attrs[key] != undefined)
                    ss = ss.replace(value, e.attrs[key].toString());
            };
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
    public static asFullBg(obj:egret.DisplayObject) {
        var parent = obj.parent;
        var parentScale = ViewUtils.getGlobalScale(parent);
        var parentPos = parent.localToGlobal();
        obj.width = ViewUtils.fullSize.w / parentScale.scaleX;
        obj.height = ViewUtils.fullSize.h / parentScale.scaleY;
        obj.x = (ViewUtils.MainArea.width - obj.width) / 2 - parentPos.x;
        obj.y = (ViewUtils.MainArea.height - obj.height) / 2 - parentPos.y;
    }

    // 获取全屏幕安全区域相对主参考区域的四边距离，一般都是负值，因为会比主参考区域大
    public static getScreenEdges() {
        var mainAreaPos = ViewUtils.MainArea.localToGlobal();
        var left = -mainAreaPos.x;
        var top = -mainAreaPos.y;
        var right = ViewUtils.MainArea.width - left;
        var bottom = ViewUtils.MainArea.height - top;

        return {left:left, right:right, top:top, bottom:bottom};
    }

    // 获取全局缩放值
    public static getGlobalScale(obj:egret.DisplayObject) {
        if (obj instanceof Main) return {scaleX:1, scaleY:1};

        var s = {scaleX:obj.scaleX, scaleY:obj.scaleY};
        if (obj.parent) {
            var ps = ViewUtils.getGlobalScale(obj.parent);
            s = {scaleX:s.scaleX*ps.scaleX, scaleY:s.scaleY*ps.scaleY};
        }

        return s;
    }

    // 解析 xml 为 textflow
    public static fromHtml(txt):egret.ITextElement[] {
        return (new egret.HtmlTextParser).parser(txt);
    }

    // 针对给定遗物生成等级符号并布局
    public static createRelicLevelStars(r:Relic, g:egret.DisplayObject):egret.Bitmap[] {
        var totalLevel;
        if(GCfg.getElemAttrsCfg(r.type).reinforce)
            totalLevel = GCfg.getElemAttrsCfg(r.type).reinforce.length + 1;
        else
            totalLevel = 1;
        var xStride = 11;
        var bmps:egret.Bitmap[] = [];
        var center = (totalLevel - 1) / 2;
        var radius = 80;
        var point = {x: g.x + g.width / 2, y:g.y + g.height + radius}
        for (var j = 0; j < totalLevel; j++) {
            var star = ViewUtils.createBitmapByName("relicLvSign_png");
            star.anchorOffsetX = star.width / 2;
            star.anchorOffsetY = star.height / 2;
            var angle = 90 - (j - center) * 8;
            var radian = angle / 360 * 2 * Math.PI;
            star.x = point.x + Math.cos(radian) * radius + (j - center) * 1;
            star.y = point.y - Math.sin(radian) * radius ;
            star.rotation = 90 - angle;
            bmps.push(star);
        }
        for (var i = 0; i <= r.reinforceLv; i++)
            ViewUtils.setTexName(bmps[i], "relicLvSign2_png");

        return bmps;
    }

    public static createRelicUpgradeSubView(r1:Relic, r2:Relic):egret.DisplayObject[] {
        var objs = [];

        // 左边的遗物信息
        objs.push(...ViewUtils.createSmallRelicInfoRect(r1, 0));

        // 右边的遗物信息
        objs.push(...ViewUtils.createSmallRelicInfoRect(r2, 320));

        // 箭头
        var arrow = ViewUtils.createBitmapByName("relicUpgradeArrow_png");
        arrow.x = 320 - arrow.width / 2;
        var bg = objs[0];
        arrow.y = bg.y + bg.height - 50;
        objs.push(arrow);

        return objs;
    }

    // 创建一个小型的显示遗物信息的区域
    public static createSmallRelicInfoRect (e:Relic, left:number):egret.DisplayObject[] {
        // 背景底图
        var bg = ViewUtils.createBitmapByName("confirmBg_png");
        bg.width = 300;
        bg.x = left + 10;
        bg.y = 200;

        // 图标
        var icon = ViewUtils.createBitmapByName(e.getElemImgRes() + "_png");
        icon.x = bg.x + 40;
        icon.y = bg.y + 20;
        icon.width *= 0.75;
        icon.height *= 0.75;

        var nameAndDesc = ViewUtils.getElemNameAndDesc(e.type);

        // 标题
        var title = ViewUtils.createTextField(30, 0xff0000);
        title.text = nameAndDesc.name;
        title.textAlign = egret.HorizontalAlign.LEFT;
        title.x = icon.x + icon.width + 20;
        title.width = bg.width + bg.x - title.x;
        title.y = bg.y + 35;

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

        return [bg, icon, title, title, ...descObjs];
    }
}
