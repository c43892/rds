
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
        return JSON.stringify({"btid": this.btid, "seed": this.srandSeed, "ops":this.ops});
    }
}