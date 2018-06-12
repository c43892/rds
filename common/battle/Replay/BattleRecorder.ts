
// 战斗录像及回放
class BattleRecorder {
    private static replay:Replay; // 当前录像数据
    private static inRecording:boolean; // 是否在录像中（否则就是回放中）

    public static startNew(btid:string, srandSeed:number) {
        BattleRecorder.inRecording = true;
        BattleRecorder.replay = new Replay(btid, srandSeed);
        
        var replayList = JSON.parse(Utils.$$loadItem("replayList"));
        if (!replayList)
            replayList = [];
        else if (replayList.length > 10)
            replayList.shift();

        replayList.push({id:btid, time:(new Date()).toLocaleString()});
        Utils.$$saveItem("replayList", JSON.stringify(replayList));
    }

    public static getRecord():Replay {
        return BattleRecorder.replay;
    }

    // 记录玩家操作
    public static onPlayerOp(op:string, ps) {
        if (!BattleRecorder.inRecording)
            return;

        Utils.assert(BattleRecorder.replay != undefined, "should have replay");
        BattleRecorder.replay.addOp(op, ps);
    }

    // 从 json 载入录像
    public static loadReplay(json):Replay {
        BattleRecorder.replay = new Replay(json.btid, json.srandSeed);
        for (var op of json.ops)
            BattleRecorder.replay.addOp(op.op, op.ps);

        return BattleRecorder.replay;
    }

    // 自动保存录像，测试期间用
    public static $$autoSaveReplay(op:string, ps) {
        var bt = BattleRecorder.getRecord();
        var r = bt.toString();
        Utils.$$saveItem("replays_" + bt.btid, r);
    }
}