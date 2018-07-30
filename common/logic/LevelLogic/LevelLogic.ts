class LevelLogic{
    public type:string;

    constructor(type:string){
        this.type = type;
    }

    // 各逻辑挂接点
    public onLevelInited;
}