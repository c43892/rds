class ColorEffect extends egret.DisplayObjectContainer {
    objs:egret.DisplayObject[];
    fromMat;
    toMat;
    tw:egret.Tween;

    public constructor(fromMatrix, toMatrix, time, ...objs:egret.DisplayObject[]) {
        super();
        this.objs = objs;
        this.fromMat = fromMatrix;
        this.toMat = toMatrix;
        this.p = 0;
        if (time != 0) {
            this.tw = egret.Tween.get(this, {loop:true}).to({"p":1}, time/2).to({"p":0}, time/2);
            this.tw.setPaused(true);
        }
    }

    public start() {
        if (this.tw)
            this.tw.setPaused(false);
    }

    public stop() {
        if (this.tw)
            this.tw.setPaused(true);
    }

    progress:number;

    public get p() {
        return this.progress;
    }

    public set p(progress:number) {
        this.progress = progress;
        var colorMatrix = Utils.arrInterpolate(this.fromMat, this.toMat, this.progress);
        var colorFilter:egret.ColorMatrixFilter = new egret.ColorMatrixFilter(colorMatrix);
        this.objs.forEach((obj, _) => obj.filters = [colorFilter]);
    }
}