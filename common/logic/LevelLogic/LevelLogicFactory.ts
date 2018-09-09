class LevelLogicFactory{
    public static createLevelLogic(level, type:string):LevelLogic{
        var levelLogic;
        switch(type){
            case "levelLogicBasic" : levelLogic = new LevelLogicBasic(level);
        }

        return levelLogic;
    };
}