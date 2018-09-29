class LevelLogicAddBoxAndKey extends LevelLogic{
    public rdps:string[];
    constructor(rdps:string[]){
        super("LevelLogicAddBoxAndKey");

        this.rdps = rdps;

        this.addAI("beforeLevelInited", async (ps) => {
            var bt = <Battle>ps.bt;
            var cfg = bt.lvCfg;
            var poses = [];

            // Utils.assert(this.rdps.length == cfg.treasureBoxNum, "the rdps should have the same amount with boxes");

            // 开宝箱用的钥匙和宝箱,根据战斗类型确定
            var index = bt.btType.indexOf("_");
            var type = bt.btType.substring(0 , index);
            var boxes:Elem[] = [];
            var seniorTypes = ["senior", "randomEgg"];
            var bossTypes = ["boss", "slimeKing"];
            
            if(Utils.indexOf(seniorTypes, (t:string) => t == type) > -1){
                for(var i = 0; i < cfg.treasureBoxNum; i++)
                    boxes.push(this.level.createElem("TreasureBox", {"rdp": this.rdps[i]}));                    
            }
            else if(Utils.indexOf(bossTypes, (t:string) => t == type) > -1){
                for(var i = 0; i < cfg.treasureBoxNum; i++)
                    boxes.push(this.level.createElem("TreasureBox", {"rdp": this.rdps[i]}));                    
            }
            else{
                var tb1 = this.level.createElem("TreasureBox", {"rdp": this.rdps[0]});
                var changeToMonsterBox = bt.srand.next100();
                if(changeToMonsterBox < cfg.monsterBox) // 是否变成怪物宝箱
                    boxes.push(this.level.createElem("TreasureBox", {"rdp":"MonsterBox"}));
                else
                    boxes.push(tb1);

                var tn = bt.srand.next100();
                if(tn < cfg.extraTreasureBox)
                    boxes.push(this.level.createElem("TreasureBox", {"rdp": this.rdps[1]}));
            }
            
            for(var i = 0; i < boxes.length; i++){
                var key = this.level.createElem("Key");
                var gs = BattleUtils.findRandomGrids(bt, (g:Grid) => !g.getElem() && !g.isCovered(), 2);
                if(gs.length == 2){
                    bt.addElemAt(boxes[i], gs[0].pos.x, gs[0].pos.y);
                    bt.addElemAt(key, gs[1].pos.x, gs[1].pos.y);
                    poses.push(gs[0].pos);
                    poses.push(gs[1].pos);
                }
            }
            for(var pos of poses)
                await bt.fireEvent("onGridChanged", {"subType":"elemAdded" , x:pos.x, y:pos.y, e:this.level.map.getElemAt(pos.x, pos.y)})
            
        })

    }
}