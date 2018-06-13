
// 战斗录像及回放
class BattleRecorder {
    private static replay:Replay; // 当前录像数据
    public static inRecording:boolean; // 是否在录像中（否则就是回放中）

    public static startNew(btid:string, srandSeed:number) {
        BattleRecorder.inRecording = true;
        BattleRecorder.replay = new Replay(btid, srandSeed);
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

    // 读取当前录像列表
    public static getReplayList() {
        var replayList = JSON.parse(Utils.$$loadItem("replayList"));
        return replayList;
    }

    // 从 json 载入录像
    public static loadReplay(btid:string):Replay {
        var str = Utils.$$loadItem(btid);
        var json = JSON.parse(str);
        BattleRecorder.replay = new Replay(json.btid, json.srandSeed);
        for (var op of json.ops)
            BattleRecorder.replay.addOp(op.op, op.ps);

        return BattleRecorder.replay;
    }

    // 播放指定录像
    public static play(r:Replay = undefined) {
        if (r != undefined)
            BattleRecorder.replay = r;

        Utils.assert(BattleRecorder.replay != undefined, "current replay should not be undefined");
        BattleRecorder.inRecording = false;
    }

    // 推动录像播放前进一步
    public static currentReplayMoveOneStep():boolean {
        return true;
    }

    // 自动保存录像，测试期间用
    public static $$autoSaveReplay(op:string, ps) {
        var bt = BattleRecorder.getRecord();

        var btid = "replay_" + bt.btid;
        if (Utils.$$loadItem(btid) == undefined) {
            var replayList = JSON.parse(Utils.$$loadItem("replayList"));
            if (!replayList)
                replayList = [];
            else if (replayList.length > 10)
                replayList.shift();

            replayList.push({id:btid, time:(new Date()).toLocaleString()});
            Utils.$$saveItem("replayList", JSON.stringify(replayList));
        }

        var r = bt.toString();
        Utils.$$saveItem(btid, r);
    }
}