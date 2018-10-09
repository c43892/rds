// 测试期间用的录像界面
class ReplayView extends egret.DisplayObjectContainer {
    private openBtn:egret.TextField; // 打开录像界面
    private listArea:egret.DisplayObjectContainer; // 列表区域
    private replaybg:egret.Bitmap; // 背景接受点击

    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.openBtn = ViewUtils.createTextField(30, 0x000000);
        this.openBtn.width = 30;
        this.openBtn.height = 30;
        this.openBtn.size = 30;
        this.openBtn.touchEnabled = true;
        this.addChild(this.openBtn);

        this.listArea = new egret.DisplayObjectContainer();
        this.listArea.name = "ListArea";
        this.replaybg = ViewUtils.createBitmapByName();
        this.replaybg.x = this.replaybg.y = 0;
        this.replaybg.touchEnabled = true;
        this.replaybg.name = "ReplayBg";

        this.refresh();
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, (evt) => {
            this.eventBuffer.push(evt);
            if (this.eventBuffer.length == 1)
                this.playOn();
        }, this);
    }

    eventBuffer = [];
    async playOn() {
        while (this.eventBuffer.length > 0) {
            let evt = this.eventBuffer[0];
            await this.onTouchTap(evt);
            this.eventBuffer.shift();
        }
    }

    public refresh() {        
        this.openBtn.x = this.width - this.openBtn.width - 5;
        this.openBtn.y = 5;
        this.replaybg.width = this.width;
        this.replaybg.height = this.height;

        this.openBtn.text = "⚪";
    }

    public clear() {
        this.listArea.removeChildren();
        if (this.getChildByName(this.replaybg.name) != undefined)
            this.removeChild(this.replaybg);
    }

    // 打开录像界面
    listBtns = [];
    replays = [];
    openReplayList() {
        // 生成列表内容
        this.listArea.removeChildren();
        this.listArea.width = this.width - 100;
        this.listBtns = [];
        this.replays = [];
        var rs = BattleRecorder.getReplayList();
        this.listArea.height = rs.length * 50;
        
        for (var i = 0; i < rs.length; i++) {
            var r = rs[rs.length - i - 1];
            var rt = ViewUtils.createTextField(45, 0x00ff00);
            rt.width = this.listArea.width;
            rt.height = 50;
            rt.text = r.time;
            rt.stroke = 1;
            rt.strokeColor = 0x888888;
            rt.textAlign = egret.HorizontalAlign.CENTER;
            rt.x = 0;
            rt.y = rt.height * i;
            this.listArea.addChild(rt);
            rt.touchEnabled = true;
            this.listBtns.push(rt);
            this.replays.push(r);
        }

        this.listArea.x = (this.width - this.listArea.width) / 2;
        this.listArea.y = (this.height - this.listArea.height) / 2;
        this.addChild(this.listArea);
    }

    async onTouchTap(evt:egret.TouchEvent) {
        if (evt.target == this.openBtn) { // 打开关闭录像界面/停止录像播放
            if (BattleRecorder.inRecording) { // 非录像回放状态
                if (this.getChildByName(this.listArea.name) != undefined) {
                    this.removeChild(this.listArea);
                    this.touchEnabled = false;
                }
                else
                    this.openReplayList();
            }
            else {
                // 录像回放状态，点击该按钮，则退出录像回放
                this.removeChild(this.replaybg);
                BattleRecorder.stop();
                this.openBtn.text = "⚪";
            }
        }
        else {
            var n = Utils.indexOf(this.listBtns, (bt) => bt == evt.target);
            if (n >= 0) {
                 // 选择某一录像
                 var btid = this.replays[n].id;
                 var r = BattleRecorder.loadReplay(btid);
                 BattleRecorder.play(r);

                 // 关闭列表界面
                 this.removeChild(this.listArea);
                 this.addChild(this.replaybg);
                 this.setChildIndex(this.openBtn, this.getChildIndex(this.replaybg) + 1);
                 this.openBtn.text = "■";
            }
            else {
                if (BattleRecorder.inRecording)
                    return;
                
                var ended = await BattleRecorder.currentReplayMoveOneStep();
                if (ended) {
                    this.removeChild(this.replaybg);
                    this.openBtn.text = "⚪";
                }
            }
        }
    }
}
