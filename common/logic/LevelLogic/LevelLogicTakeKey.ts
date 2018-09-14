class LevelLogicTakeKey extends LevelLogic{
    constructor(){
        super("LevelLogicTakeKey");

        this.onLevelInited = async (ps) => {
            var bt:Battle = ps.bt;
            var keys = bt.level.map.findAllElems((e:Elem) => e.type == "Key");

            var index = bt.btType.indexOf("_");
            index = index < 0 ? bt.btType.length : index;
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
                            }
                        }
                    }
                    else if(elites.length == 1) {
                        var elite = elites[0];
                        for(var i = 0; i < 4; i++){
                            var key = bt.level.map.findFirstElem((e:Elem) => e.type == "Key");
                            await bt.implMonsterTakeElems(elite, [key], true);
                            keys = Utils.remove(keys, key);
                        }
                    }
                    if(keys.length > 0){
                        var takeByNormal = bt.srand.nextInt(keys.length - 1, keys.length + 1);
                        await this.normalMonsterTakeKey(bt, keys, takeByNormal);
                    }
                    break;
                }
                case "boss":{
                    var boss = <Monster>bt.level.map.findAllElems((e:Elem) => e instanceof Monster && e.isBoss)[0];
                    for(var i = 0; i < 4; i++)
                        await bt.implMonsterTakeElems(boss, [keys[i]], true);
                    
                    var leftKeys = [];
                    for(var j = 0; j < keys.length - 4; j++)
                        leftKeys.push(keys[4 + j])

                    await this.normalMonsterTakeKey(bt, leftKeys, leftKeys.length);
                    break;
                }
                default:{
                    var takeNum = bt.srand.nextInt(keys.length - 1, keys.length + 1);
                    await this.normalMonsterTakeKey(bt, keys, takeNum);
                    break;
                }
            }    
        }
    }

    public async normalMonsterTakeKey(bt:Battle, keys:Elem[], takeNum:number){
        var ms = <Monster[]>BattleUtils.findRandomElems(bt, takeNum, (e:Elem) => e instanceof Monster && e.isHazard() && !e.attrs.cannotTake);
        for(var m of ms){
            var key = keys[bt.srand.nextInt(0, keys.length)];
            keys = Utils.remove(keys, key);
            await bt.implMonsterTakeElems(m, [key], true);
        }
    }
}