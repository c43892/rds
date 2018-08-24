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

    public static loadTex(name: string) {
        return egret.Texture = RES.getRes(name);
    }

    // 将一个显示对象程序置灰
    public static makeGray(e:egret.DisplayObject, gray:boolean = true) {
        if (!gray) {
            e.filters = undefined;
            return;
        }
        
        var colorMatrix = [
            0.5,0,0,0,0,
            0.5,0,0,0,0,
            0.5,0,0,0,0,
            1,0,0,0,0
        ];
        var colorFlilter = new egret.ColorMatrixFilter(colorMatrix);
        e.filters = [colorFlilter];
    }

    // 创建一个显示文本
    public static createTextField(size:number, color:number, alignCenter:boolean = true, vAlignMiddle:boolean = true) {
        var t = new egret.TextField();
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
    public static replaceByProperties(s:string, e):string {
        const r = /\{[a-z,A-Z,0-9,_,-]*\}/g;
        const m = r.exec(s);
        var ss = s;
        if (m) {
            m.forEach((value, index) => {
                var key = value.substr(1, value.length - 2);
                if (e[key] != undefined)
                    ss = ss.replace(value, e[key].toString());
                else if (e.attrs[key] != undefined)
                    ss = ss.replace(value, e.attrs[key].toString());
            });
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
        obj.x = (ViewUtils.MainArea.height - obj.height) / 2 - parentPos.x;
        obj.y = (ViewUtils.MainArea.height - obj.height) / 2 - parentPos.y;
    }

    // 获取全局缩放值
    public static getGlobalScale(obj:egret.DisplayObject) {
        if (obj == ViewUtils.MainArea)
            return {scaleX:1, scaleY:1};

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
}
