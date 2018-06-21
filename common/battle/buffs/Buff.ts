class Buff {
    public type:string;
    public getOwner; // 获取所属对象
    constructor(type:string) {
        this.type = type;
    }

    public cd = undefined; // 剩余回合数，undefined 表示永远不结束

    // 生效一次（可以用来手动生效）
    public doEffect;

    // 各逻辑挂接点
    public onPlayerActed;
    public onLevelInited;
    public beforeGoOutLevel1;
    public beforeGoOutLevel2;
    public onGridUncovered; // 形如 function(x:number, y:number, statusBeforeUncoverd:GridStatus)
}