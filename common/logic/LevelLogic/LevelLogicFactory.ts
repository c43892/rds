class LevelLogicFactory{
    public static createLevelLogic(type:string, level:Level, ...ps:any[]):LevelLogic{
        var levelLogic:LevelLogic;        
        switch(type){
            case "LevelLogicTakeKey" : levelLogic = new LevelLogicTakeKey(); break;
            case "LevelLogicSearchBody" : levelLogic = new LevelLogicSearchBody(ps[0]); break;
            case "LevelLogicAddBoxAndKey" : levelLogic = new LevelLogicAddBoxAndKey(); break;
            case "LevelLogicChangeMonster" : levelLogic = new LevelLogicChangeMonster(ps[0], ps[1]); break;
        }
        levelLogic.level = level;
        return levelLogic;
    };
}