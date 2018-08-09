class LevelLogicBasic extends LevelLogic{
    constructor(){
        super("LevelLogicBasic");

        this.onLevelInited = async (ps) => {
            var bt:Battle = ps.bt;
            var keys = bt.level.map.findAllElems((e:Elem) => e.type == "Key");

            var index = bt.btType.indexOf("_");
            var btType = bt.btType.substring(0 , index);

            switch(btType){
                case "normal":{
                    var takeNum = bt.srand.nextInt(keys.length - 1, keys.length + 1);
                    await this.normalMonsterTakeKey(bt, keys, takeNum);
                    break;
                }
                case "senior":{
                    var elites = <Monster[]>bt.level.map.findAllElems((e:Elem) => e instanceof Monster && e.isBig());
                    if(elites.length > 1){
                        for(var elite of elites){
                            for(var i = 0; i < 2; i++){
                                var key = bt.level.map.findFirstElem((e:Elem) => e.type == "Key");
                                await bt.implMonsterTakeElems(elite, [key], true);
                                keys = Utils.remove(keys, key);
                                elite.addDropItem(key);
                            }
                        }
                    }
                    else if(elites.length == 1) {
                        var elite = elites[0];
                        for(var i = 0; i < 4; i++){
                            var key = bt.level.map.findFirstElem((e:Elem) => e.type == "Key");
                            await bt.implMonsterTakeElems(elite, [key], true);
                            keys = Utils.remove(keys, key);
                            elite.addDropItem(key);
                        }
                    }
                    if(keys.length > 0){
                        var takeByNormal = bt.srand.nextInt(keys.length - 1, keys.length + 1);
                        await this.normalMonsterTakeKey(bt, keys, takeByNormal);
                    }
                    break;
                }
                case "boss":{
                    var boss = <Monster>bt.level.map.findAllElems((e:Elem) => e instanceof Monster && e.isBig())[0];
                    for(var key of keys){
                        await bt.implMonsterTakeElems(boss, [key], true);
                        boss.addDropItem(key);
                    }
                    break;
                }
            }    
        }
    }

    public async normalMonsterTakeKey(bt:Battle, keys:Elem[], takeNum:number){
        var ms = <Monster[]>BattleUtils.findRandomElems(bt, takeNum, (e:Elem) => e instanceof Monster && !e.attrs.cannotTake);
        for(var m of ms){
            var key = keys[bt.srand.nextInt(0, keys.length)];
            keys = Utils.remove(keys, key);
            await bt.implMonsterTakeElems(m, [key], true);
            m.addDropItem(key);
        }
    }
}