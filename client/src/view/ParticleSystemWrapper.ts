class ParticleSystemWrapper extends egret.DisplayObjectContainer {
    ps:particle.GravityParticleSystem;
    public constructor(ps:particle.GravityParticleSystem) {
        super();
        this.ps = ps;
        this.addChild(ps);
    }

    public get x() {
        return this.ps.emitterX;
    }

    public set x(px:number) {
        this.ps.emitterX = px;
    }

    public get y() {
        return this.ps.emitterY;
    }

    public set y(py:number) {
        this.ps.emitterY = py;
    }

    public get rotation() {
        return this.ps.emitAngle;
    }

    public set rotation(angle:number) {
        this.ps.emitAngle = angle;
    }

    public start() {
        this.ps.start();
    }

    public stop() {
        this.ps.stop();
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
        var lastX = this.ps.emitterX;
        var lastY = this.ps.emitterY;
        this.ps.emitterX = (1 - p) * (1 - p) * x1 + 2 * p * (1 - p) * x2 + p * p * x3;
        this.ps.emitterY = (1 - p) * (1 - p) * y1 + 2 * p * (1 - p) * y2 + p * p * y3;
        var r = Utils.getRotationFromTo({x:this.ps.emitterX, y:this.ps.emitterY}, {x:lastX, y:lastY});
        this.ps.emitAngle = r;
    }
}