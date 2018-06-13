
// 战斗录像数据
class Replay {
    public btid:string;
    public srandSeed:number; // 战斗随机数种子
    public ops:any[]; // 操作列表，按操作顺序记录，格式是 [[op:op1, ps:{...}], [op:op2, ps:{...}], ...]

    constructor(btid:string, srandSeed:number) {
        this.btid = btid;
        this.srandSeed = srandSeed;
        this.ops = [];
    }

    public addOp(op:string, ps) {
        this.ops.push({op:op, ps:ps});
    }

    // 序列化为字符串
    public toString():string {
        return JSON.stringify({"btid": this.btid, "srandSeed": this.srandSeed, "ops":this.ops});
    }

    public static fromString(str:string):Replay {
        var json = JSON.parse(str);
        var r = new Replay(json.btid, json.srandSeed);
        for (var op of json.ops)
            r.addOp(op.op, op.ps);

        return r;
    }
}