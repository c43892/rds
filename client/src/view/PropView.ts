// 道具
class PropView extends egret.DisplayObjectContainer {
    private e:Elem;
    private elemImg:egret.Bitmap; // 元素图

    public constructor() {
        super();        
        this.elemImg = ViewUtils.createBitmapByName(); // 元素图
        this.elemImg.touchEnabled = true;

        this.anchorOffsetX = 0;
        this.anchorOffsetY = 0;

        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
    }

    public setElem(e:Elem) {
        this.e = e;
    }

    public refresh() {
        this.clear();
        if (!this.e)
            return;

        this.elemImg = ViewUtils.createBitmapByName(this.e.type + "_png");
        this.elemImg.name = "elemImg";
        var w = this.width;
        var h = this.height;
        this.elemImg.x = this.elemImg.y = 0;
        this.elemImg.width = this.width;
        this.elemImg.height = this.height;
        this.addChild(this.elemImg);
    }

    public clear() {
        if (this.getChildByName(this.elemImg.name))
            this.removeChild(this.elemImg);
    }

    public getElem():Elem {
        return this.e;
    }

    public getImg():egret.Bitmap {
        return this.elemImg;
    }

    // 各种操作逻辑构建
    public static try2UseProp; // 尝试无目标使用道具，会挂接形如 function(e:Elem) 的函数
    public static try2UsePropAt; // 尝试使用一个道具，将坐标为目标

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        if (this.e.canUse)
            PropView.try2UseProp(this.e);
    }
}
