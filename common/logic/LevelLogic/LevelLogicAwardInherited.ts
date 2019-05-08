class LevelLogicAwardInherited extends LevelLogic {
    private relicTypes = [];
    private leftCoinsNum = 0;
    private allCoinsNum = 0;
    private relicsLv;

    constructor(ps){
        super("LevelLogicAwardInherited");

        this.relicTypes = ps.relicTypes;
        this.leftCoinsNum = ps.leftCoinsNum;
        this.allCoinsNum = ps.allCoinsNum;
        this.relicsLv = ps.relicsLv;

        this.addAI("onLevelInitElems", (ps) => {
            Utils.assert(this.relicTypes.length == 2, "not enough relicTypes for award");
            // 6个宝箱,分别装两个技能,金币,3种药水
            var tb1 = this.level.createElem("TreasureBox");
            var relic1 = <Relic>this.level.createElem(this.relicTypes[0]);
            if(this.relicsLv[relic1.type] > 0)
                relic1.setReinfoceLv(this.relicsLv[relic1.type]);

            tb1.addDropItem(relic1);
            
            var tb2 = this.level.createElem("TreasureBox");
            var relic2 = <Relic>this.level.createElem(this.relicTypes[1]);
            if(this.relicsLv[relic2.type])
                relic2.setReinfoceLv(this.relicsLv[relic2.type]);

            tb2.addDropItem(relic2);

            var tb3 = this.level.createElem("TreasureBox");
            tb3.addDropItem(this.level.createElem("Coins", {"cnt": this.allCoinsNum}));

            var tb4 = this.level.createElem("TreasureBox");
            tb4.addDropItem(this.level.createElem("RayGun"));

            var tb5 = this.level.createElem("TreasureBox");
            tb5.addDropItem(this.level.createElem("IceGun"));

            var tb6 = this.level.createElem("TreasureBox");
            var occPropType = GCfg.getOccupationCfg(this.level.bt.player.occupation)["occPropType"];
            tb6.addDropItem(this.level.createElem(occPropType));

            // 金币
            var coins = this.level.createElem("Coins", {"cnt":this.leftCoinsNum});

            var awards = [tb1, tb2, tb3, tb4, tb5, tb6, coins];

            // 7把钥匙
            for(var i = 0; i < 7; i++){
                var key = this.level.createElem("Key");
                awards.push(key);
            }

            for(var award of awards)
                ps.elems.push(award);

        }, true)
    }
}