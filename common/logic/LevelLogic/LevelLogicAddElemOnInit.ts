// 用于在关卡创建时添加特定的元素,该元素可能不方便在配置中确定,典型的用途是添加一个Boss
class LevelLogicAddElemOnInit extends LevelLogic {
    public elemTypes: string[] = [];

    constructor(elemTypes:string[]) {
        super("LevelLogicAddElemOnInit");
        this.elemTypes = elemTypes;

        this.addAI("onLevelInitElems", (ps) => {
            for (var elemType of this.elemTypes) {
                var e = this.level.createElem(elemType);
                ps.elems.push(e);
            }
        }, true)
    }
}