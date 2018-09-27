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

    public addAI(logicPoint:string, act, Sync:boolean = false){
        this[logicPoint + (Sync ? "Sync" : "Async")] = act;
    }
}