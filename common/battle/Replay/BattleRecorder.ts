
// 战斗录像及回放
class BattleRecorder {
    private static replay:Replay; // 当前录像数据
    public static inRecording:boolean; // 是否在录像中（否则就是回放中）

    public static startNew(btid:string, player:Player, trueRandomSeed:number) {
        BattleRecorder.inRecording = true;
        BattleRecorder.replay = new Replay(btid, player, trueRandomSeed);
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

        // 测试期间在本地自动存放录像
        BattleRecorder.$$autoSaveReplay();
    }

    // 读取当前录像列表
    public static getReplayList() {
        var replayList = JSON.parse(Utils.$$loadItem("replayList"));
        return replayList;
    }

    // 从 json 载入录像
    public static loadReplay(btid:string):Replay {
        var str = Utils.$$loadItem(btid);
        BattleRecorder.replay = Replay.fromString(str);
        return BattleRecorder.replay;
    }

    // 播放指定录像
    public static startNewBattleImpl;
    static replayIndex = 0; // 重播录像的当前指令序号
    public static play(r:Replay = undefined) {
        if (r != undefined)
            BattleRecorder.replay = r;

        Utils.assert(BattleRecorder.replay != undefined, "current replay should not be undefined");
        BattleRecorder.startNewBattleImpl(r.player, r.trueRandomSeed);
        BattleRecorder.inRecording = false;
        BattleRecorder.replayIndex = 0;
    }

    public static stop() {
        BattleRecorder.inRecording = true;
        BattleRecorder.replay.ops = BattleRecorder.replay.ops.slice(0, BattleRecorder.replayIndex);
        BattleRecorder.replayIndex = 0;
    }

    // 推动录像播放前进一步
    public static currentReplayMoveOneStep():boolean {
        var r = BattleRecorder.replay;
        var ops = r.ops;
        var op = ops[BattleRecorder.replayIndex++];
        var h = BattleRecorder.replayOpHandlers[op.op];
        Utils.assert(h, "unhandled replay indication: " + op.op);
        h(op.ps);
        BattleRecorder.inRecording = BattleRecorder.replayIndex >= ops.length;
        return BattleRecorder.inRecording; // 返回值表示录像是否已经回放结束（回放结束就是进入录制状态）
    }

    // 录像指令处理，基本上就是对应 Battle 中 fireEventSync 的部分
    public static registerReplayIndicatorHandlers(bt:Battle) {
        BattleRecorder.onReplayOp("try2UncoverAt", (ps) => { ElemView.try2UncoverAt(ps.x, ps.y); });
        BattleRecorder.onReplayOp("try2UseElem", (ps) => { ElemView.try2UseElem(bt.level.map.getElemAt(ps.x, ps.y)); });
        BattleRecorder.onReplayOp("try2BlockGrid", (ps) => { ElemView.try2BlockGrid(ps.x, ps.y, ps.mark); });
        BattleRecorder.onReplayOp("try2UseElemAt", (ps) => { ElemView.try2UseElemAt(bt.level.map.getElemAt(ps.x, ps.y), ps.tox, ps.toy); });
        BattleRecorder.onReplayOp("reposElemTo", (ps) => { ElemView.reposElemTo(bt.level.map.getElemAt(ps.x, ps.y), ps.tox, ps.toy); });
    }

    private static replayOpHandlers = {}; // 执行所有录像指令
    // 注册录像指令处理函数
    public static onReplayOp(op:string, handler) {
        BattleRecorder.replayOpHandlers[op] = handler;
    }

    // 自动保存录像，测试期间用
    public static $$autoSaveReplay() {
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