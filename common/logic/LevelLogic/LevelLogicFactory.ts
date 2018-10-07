class LevelLogicFactory{
    public static createLevelLogic(type:string, ...ps:any[]):LevelLogic{
        var levelLogic:LevelLogic;        
        switch(type){
            case "LevelLogicTakeKey" : levelLogic = new LevelLogicTakeKey(); break;
            case "LevelLogicSearchBody" : levelLogic = new LevelLogicSearchBody(ps[0]); break;
            case "LevelLogicAddBoxAndKey" : levelLogic = new LevelLogicAddBoxAndKey(ps[0]); break;
            case "LevelLogicChangeMonster" : levelLogic = new LevelLogicChangeMonster(ps[0], ps[1]); break;
            case "LevelLogicAddElemOnInit" : levelLogic = new LevelLogicAddElemOnInit(ps[0]); break;
            case "LevelLogicMarkAllAward" : levelLogic = new LevelLogicMarkAllAward(ps[0]); break;
        }
        return levelLogic;
    };
}