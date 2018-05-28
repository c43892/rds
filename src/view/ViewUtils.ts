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
            }
        }
        
        result.anchorOffsetX = 0;
        result.anchorOffsetY = 0;
        result.x = 0;
        result.y = 0;
        
        return result;
    }
}