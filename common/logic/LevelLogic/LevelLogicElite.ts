class LevelLogicElite extends LevelLogic {
    private eliteType;

    constructor(eliteType:string){
        super("LevelLogicElite");

        this.eliteType = eliteType;

        // 创建关卡时添加elite
        this.addAI("onLevelInitElems", (ps) => {
            var e = this.level.createElem(this.eliteType);
            ps.elems.push(e);
        }, true)
    }
}