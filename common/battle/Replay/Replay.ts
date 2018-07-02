
// 战斗录像数据
class Replay {
    public btid:string;
    public player:Player;
    public btType:string;
    public trueRandomSeed:number;
    public ops:any[]; // 操作列表，按操作顺序记录，格式是 [[op:op1, ps:{...}], [op:op2, ps:{...}], ...]

    private playerWhenStart;
    constructor(btid:string, player:Player, btType:string, trueRandomSeed:number) {
        this.btid = btid;
        this.player = player;
        this.btType = btType;
        this.playerWhenStart = player.toString();
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
            "player": this.playerWhenStart,
            "btType": this.btType,
            "trueRandomSeed": this.trueRandomSeed, 
            "ops":this.ops
        });
    }

    public static fromString(str:string):Replay {
        var json = JSON.parse(str);
        var p = Player.fromString(json.player);
        var r = new Replay(json.btid, p, json.btType, json.trueRandomSeed);
        for (var op of json.ops)
            r.addOp(op.op, op.ps);

        return r;
    }
}
