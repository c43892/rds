class LevelLogicTakeKey extends LevelLogic{
    constructor(){
        super("LevelLogicTakeKey");

        this.addAI("beforeLevelInitedTakeKey", async (ps) => {
            var bt = this.level.bt;
            var keys = this.level.keys;

            var index = bt.btType.indexOf("_");
            index = index < 0 ? bt.btType.length : index;
            var btType = bt.btType.substring(0 , index);
            var seniorTypes = GCfg.getBattleTypes("senior");
            var bossTypes = GCfg.getBattleTypes("boss");
            
            // 精英关卡,如果是双精英怪,每个精英怪取走2把,单精英则取走4把
            if(Utils.indexOf(seniorTypes, (t:string) => t == btType) > -1){
                var elites = <Monster[]>bt.level.map.findAllElems((e:Elem) => e instanceof Monster && e.isBig());
                // 多个精英怪
                if(elites.length > 1){
                    for(var elite of elites){
                        for(var i = 0; i < 2; i++){
                            var key = keys[bt.srand.nextInt(0, keys.length)];
                            await bt.implMonsterAddDropItem(elite, key);
                            keys = Utils.remove(keys, key);
                        }
                    }
                }
                // 单个精英怪
                else if(elites.length == 1) {
                    var elite = elites[0];
                    for(var i = 0; i < 4; i++){
                        var key = keys[bt.srand.nextInt(0, keys.length)];
                        await bt.implMonsterAddDropItem(elite, key);
                        keys = Utils.remove(keys, key);
                    }
                }

                // 多余的钥匙分配给普通怪
                if(keys.length > 0){
                    var takeByNormal = bt.srand.nextInt(keys.length - 1, keys.length + 1);
                    keys = await this.normalMonsterTakeKey(bt, keys, takeByNormal);
                    if (keys.length > 0) {
                        var gs = BattleUtils.findRandomGrids(bt, (g: Grid) => !g.getElem(), keys.length);
                        Utils.assert(gs.length == keys.length, "not enough empty grids");
                        for (var i = 0; i < gs.length; i++)
                            await bt.implAddElemAt(keys[i], gs[i].pos.x, gs[i].pos.y);
                    }
                }
            }
            // boss关卡,4把钥匙分配到boss身上
            else if(Utils.indexOf(bossTypes, (t:string) => t == btType) > -1){
                var boss = <Monster>bt.level.map.findAllElems((e:Elem) => e instanceof Monster && e.isBoss)[0];
                for (var i = 0; i < 4; i++) {
                    var key = keys[bt.srand.nextInt(0, keys.length)];
                    await bt.implMonsterAddDropItem(boss, key);
                    keys = Utils.remove(keys, key);
                }
                // 多余的钥匙分配给普通怪
                keys = await this.normalMonsterTakeKey(bt, keys, keys.length);
                if (keys.length > 0) {
                    var gs = BattleUtils.findRandomGrids(bt, (g: Grid) => !g.getElem(), keys.length);
                    Utils.assert(gs.length == keys.length, "not enough empty grids");
                    for (var i = 0; i < gs.length; i++)
                        await bt.implAddElemAt(keys[i], gs[i].pos.x, gs[i].pos.y);
                }
            }
            // 普通关卡将钥匙分配至普通怪物身上,地上留0~1把钥匙
            else {
                var takeNum = bt.srand.nextInt(keys.length - 1, keys.length + 1);
                keys = await this.normalMonsterTakeKey(bt, keys, takeNum);
                if (keys.length > 0) {
                    var gs = BattleUtils.findRandomGrids(bt, (g:Grid) => !g.getElem(), keys.length);
                    Utils.assert(gs.length == keys.length, "not enough empty grids");
                    for (var i = 0; i < gs.length; i++)
                        await bt.implAddElemAt(keys[i], gs[i].pos.x, gs[i].pos.y);
                }
            }
        })
    }

    // 将一定数量的钥匙分配给普通怪物
    public async normalMonsterTakeKey(bt:Battle, keys:Elem[], takeNum:number) {
        Utils.assert(keys.length >= takeNum && takeNum > 0 , "keys's amount or takeNum error.")
        var ms = <Monster[]>BattleUtils.findRandomElems(bt, takeNum, (e:Elem) => e instanceof Monster && !e.isBoss && !e.isElite && e.isHazard() && !e.attrs.cannotTake);
        for(var m of ms){
            var key = keys[bt.srand.nextInt(0, keys.length)];
            keys = Utils.remove(keys, key);
            await bt.implMonsterAddDropItem(m, key);
        }
        return keys;
    }
}