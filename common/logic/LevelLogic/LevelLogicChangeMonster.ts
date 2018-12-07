class LevelLogicChangeMonster extends LevelLogic{
    public changeTypes:string[];
    public num:number;
    constructor(changeTypes:string[], num, prior = undefined){
        super("LevelLogicChangeMonster");
        this.changeTypes = changeTypes;
        this.num = num;

        this.addAI("onLevelInited", async (ps) => {
            var bt = this.level.bt;
            var noDropItems = (e:Elem) => Utils.filter(e.dropItems, (d:Elem) => d.type != "Coins").length == 0;
            var notSameType = (e:Elem) => Utils.indexOf(this.changeTypes, (changeType:string) => e.type == changeType) < 0;
            // 筛选不属于要改变的种类之一并且不含金币以外掉落的敌对怪进行替换
            var tarms = BattleUtils.findRandomElems(bt, this.num, (e:Elem) => {
                    if(!(e instanceof Monster)) return false;
                    return e.isHazard() && !e.isBoss && noDropItems(e) && notSameType(e) && !Utils.contains(this.changeTypes, e.type) && e.type != "PlaceHolder";})
            
            // 部分变化属于优先的 prior是形如{type1:num1, type2:num2}的表
            if (prior){
                for (var priorType in prior)
                    for(var i = 0; i < prior[priorType]; i++){
                        if(tarms.length > 0)
                            var target = tarms.shift();
                            var pos = target.pos;
                            var m = this.level.createElem(priorType);
                            await bt.implRemoveElemAt(pos.x, pos.y);
                            await bt.implAddElemAt(m, pos.x, pos.y);
                    }
            }

            for(var i = 0; i < tarms.length; i++){
                var type = changeTypes[bt.srand.nextInt(0, changeTypes.length)];
                var m = this.level.createElem(type);
                var pos = tarms[i].pos;
                await bt.implRemoveElemAt(pos.x, pos.y);
                await bt.implAddElemAt(m, pos.x, pos.y);
            }
        })
    }
}