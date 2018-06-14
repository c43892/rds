
// 战斗录像数据
class Replay {
    public btid:string;
    public player:Player;
    public trueRandomSeed:number;
    public ops:any[]; // 操作列表，按操作顺序记录，格式是 [[op:op1, ps:{...}], [op:op2, ps:{...}], ...]

    constructor(btid:string, player:Player, trueRandomSeed:number) {
        this.btid = btid;
        this.player = player;
        this.trueRandomSeed = trueRandomSeed;
        this.ops = [];
    }

    public addOp(op:string, ps) {
        this.ops.push({op:op, ps:ps});
    }

    // 序列化为字符串
    public toString():string {
        return JSON.stringify({
            "btid": this.btid, 
            "player": this.player.toString(), 
            "trueRandomSeed": this.trueRandomSeed, 
            "ops":this.ops
        });
    }

    public static fromString(str:string):Replay {
        var json = JSON.parse(str);
        var p = Player.fromString(json.player);
        var r = new Replay(json.btid, p, json.trueRandomSeed);
        for (var op of json.ops)
            r.addOp(op.op, op.ps);

        return r;
    }
}