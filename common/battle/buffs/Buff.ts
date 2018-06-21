class Buff {
    public type:string;
    public getOwner; // 获取所属对象
    constructor(type:string) {
        this.type = type;
    }

    public cd = undefined; // 剩余回合数，undefined 表示永远不结束

    getConstructorPs = () => []; // 序列化时需要带什么参数，由各 buff 自己决定，和各自构造参数对应
    public toString():string {
        var info = {type:this.type, ps:this.getConstructorPs()};
        Utils.log(" => ", this.type, info.ps);
        return JSON.stringify(info);
    }

    public static fromString(str:string):Buff {
        var info = JSON.parse(str);
        var type = info.type;
        var buff = BuffFactory.create(type, ...info.ps);
        Utils.log(" <= ", type, info.ps);
        Utils.assert(!!buff, "no such a buff: " + type);
        return buff;
    }

    // 生效一次（可以用来手动生效）
    public doEffect;

    // 各逻辑挂接点
    public onPlayerActed;
    public onLevelInited;
    public beforeGoOutLevel1;
    public beforeGoOutLevel2;
    public onGridUncovered; // 形如 function(x:number, y:number, statusBeforeUncoverd:GridStatus)
}