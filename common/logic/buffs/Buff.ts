class Buff {
    public type:string;
    public getOwner; // 获取所属对象
    public onAttrs = {};
    
    constructor(type:string) {
        this.type = type;
        this.onAttrs = {};
    }

    public cnt = undefined; // 剩余回合数，undefined 表示永远不结束
    public overBuff; // buff的叠加方式

    // 生效一次（可以用来手动生效）
    public doEffect;

    // 各逻辑挂接点
    public onPlayerActed;
    public onLevelInited;
    public beforeGoOutLevel1;
    public beforeGoOutLevel2;
    public onGridChanged; // 形如 function(x:number, y:number, statusBeforeUncoverd:GridStatus)    
    public onSneaking;
    public onCalcAttacking;
    public preAttack;
    public onAttacking;
    public onPlayerHealing;
}