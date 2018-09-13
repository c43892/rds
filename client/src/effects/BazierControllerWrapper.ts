class BazierControllerWrapper extends egret.DisplayObjectContainer {
    public obj:egret.DisplayObject;
    public constructor(obj:egret.DisplayObject) {
        super();
        this.obj = obj;
        this.addChild(obj);
    }

    bazierFromPos;
    bazierControlPos;
    bazierToPos;

    // 设置贝塞尔轨迹相关点
    public setBazierPoints(fromPos, controlPos, toPos) {
        this.bazierFromPos = fromPos;
        this.bazierControlPos = controlPos;
        this.bazierToPos = toPos;
    }

    bf:number;
    public get bezierFactor():number {
        return this.bf;
    }

    public set bezierFactor(p:number) {
        this.bf = p;
        var x1 = this.bazierFromPos.x;
        var y1 = this.bazierFromPos.y;
        var x2 = this.bazierControlPos.x;
        var y2 = this.bazierControlPos.y;
        var x3 = this.bazierToPos.x;
        var y3 = this.bazierToPos.y;
        var lastX = this.obj.x;
        var lastY = this.obj.y;
        this.obj.x = (1 - p) * (1 - p) * x1 + 2 * p * (1 - p) * x2 + p * p * x3;
        this.obj.y = (1 - p) * (1 - p) * y1 + 2 * p * (1 - p) * y2 + p * p * y3;
        var r = Utils.getRotationFromTo({x:this.obj.x, y:this.obj.y}, {x:lastX, y:lastY});
        this.obj.rotation = r;
    }
}