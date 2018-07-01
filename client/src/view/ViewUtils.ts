class ViewUtils {
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    public static createBitmapByName(name: string = undefined) {
        let result = new egret.Bitmap();

        if (name) {
            let texture: egret.Texture = RES.getRes(name);
            result.texture = texture;
            if (texture) {
                result.width = texture.textureWidth;
                result.height = texture.textureHeight;
            } else
                Utils.log("no texture created: " + name);
        }
        
        result.anchorOffsetX = 0;
        result.anchorOffsetY = 0;
        result.x = 0;
        result.y = 0;
        
        return result;
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
}