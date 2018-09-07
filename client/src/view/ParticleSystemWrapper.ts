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
}