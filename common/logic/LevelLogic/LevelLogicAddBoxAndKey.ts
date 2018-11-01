class LevelLogicAddBoxAndKey extends LevelLogic{
    public rdps:string[]; // 多个宝箱的掉落表,每个宝箱对应其中的一个
    public boxMonsterRdps:string[]; // 宝箱怪的掉落列表,默认为三选二,新手关自行配置

    constructor(rdps:string[], boxMonsterRdps:string[] = ["treasureBox1", "treasureBox2", "treasureBox2"]){
        super("LevelLogicAddBoxAndKey");

        this.rdps = rdps; 
        this.boxMonsterRdps = boxMonsterRdps; 

        this.addAI("beforeLevelInited", async (ps) => {
            var bt = this.level.bt;
            var cfg = bt.lvCfg;

            // Utils.assert(this.rdps.length == cfg.treasureBoxNum, "the rdps should have the same amount with boxes");

            // 开宝箱用的钥匙和宝箱,根据战斗类型确定
            var index = bt.btType.indexOf("_");
            var type = bt.btType.substring(0 , index);
            var boxes:Elem[] = [];
            var seniorTypes = GCfg.getBattleTypes("senior");
            var bossTypes = GCfg.getBattleTypes("boss");
            
            if(Utils.indexOf(seniorTypes, (t:string) => t == type) > -1 || Utils.indexOf(bossTypes, (t:string) => t == type) > -1){
                for(var i = 0; i < cfg.treasureBoxNum; i++)
                    boxes.push(this.level.createElem("TreasureBox", {"rdp": this.rdps[i]}));
            }
            else{
                var boxesConfig = this.level.bt.lvCfg.boxesConfig;
                var tb1 = this.level.createElem("TreasureBox", {"rdp": boxesConfig ? boxesConfig[0] : this.rdps[0]});
                var changeToMonsterBox = bt.srand.next100();
                if(changeToMonsterBox < cfg.monsterBox){ // 是否变成怪物宝箱
                    boxes.push(this.level.createElem("TreasureBox", {"rdp":"MonsterBox"}));
                    this.level["boxMonsterRdps"] = this.boxMonsterRdps; // 宝箱怪的掉落列表记在关卡身上,等需要的时候(宝箱怪死亡)取
                }
                else
                    boxes.push(tb1);

                // var tn = bt.srand.next100();
                // if(tn < cfg.extraTreasureBox)
                //     boxes.push(this.level.createElem("TreasureBox", {"rdp": this.rdps[1]}));
            }
            
            for(var i = 0; i < boxes.length; i++){
                var key = this.level.createElem("Key");
                var g = BattleUtils.findRandomGrids(bt, (g:Grid) => !g.getElem() && !g.isCovered(), 1)[0];
                if(g){
                    bt.addElemAt(boxes[i], g.pos.x, g.pos.y);
                    await bt.fireEvent("onGridChanged", {"subType":"elemAdded" , x:g.pos.x, y:g.pos.y, e:boxes[i]});
                    this.level.keys.push(key);
                }
            }
        })

    }
}