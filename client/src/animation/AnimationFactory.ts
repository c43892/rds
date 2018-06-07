
// 动画工厂
class AnimationFactory {

    // 创建按指定路径移动的动画
    public static createMovingAnim(g:egret.DisplayObject, path:number[][]):Promise<void> {
        var tw = egret.Tween.get(g);
        for (var pt of path) {
            var x = pt[0];
            var y = pt[1];
            tw = tw.to({x:x, y:y}, 250);
        }

        return Utils.delay(250 * path.length);
    }
}
