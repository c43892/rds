class ViewUtils {
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    public static createBitmapByName(name: string = undefined):egret.Bitmap {
        return ViewUtils.setTex(new egret.Bitmap(), name, true);
    }

    public static setTex(bmp:egret.Bitmap, name:string, resetSize:boolean = false):egret.Bitmap {
        if (name) {
            let texture: egret.Texture = RES.getRes(name);
            bmp.texture = texture;
            if (texture && resetSize) {
                bmp.width = texture.textureWidth;
                bmp.height = texture.textureHeight;
            } else if (!texture)
                Utils.log("no texture created: " + name);
        }
        
        if (resetSize) {
            bmp.anchorOffsetX = 0;
            bmp.anchorOffsetY = 0;
            bmp.x = 0;
            bmp.y = 0;
        }
        return bmp;
    }

    public static loadTex(name: string) {
        return egret.Texture = RES.getRes(name);
    }

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

    public static createTextField(size:number, color:number, alignCenter:boolean = true, vAlignMiddle:boolean = true) {
        var t = new egret.TextField();
        t.size = size;
        t.textColor = color;
        t.textAlign = alignCenter ? egret.HorizontalAlign.CENTER : egret.HorizontalAlign.LEFT;
        t.verticalAlign = vAlignMiddle ? egret.VerticalAlign.MIDDLE : egret.VerticalAlign.TOP;
        t.x = t.y = 0;
        return t;
    }
}