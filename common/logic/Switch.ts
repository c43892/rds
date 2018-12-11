// 各类开关
class Switch {
    // 音乐开关
    public static volume = () => Utils.loadLocalData("SysSetting_AudioOn") == 0 ? false : true;
    // 金币动画开关
    public static coinAni = () => Utils.loadLocalData("coinAni") == undefined ? true : Utils.loadLocalData("coinAni");
    // 初始增添元素动画开关
    public static initAddElemAni  = () => Utils.loadLocalData("initAddElemAni") == undefined ? true : Utils.loadLocalData("initAddElemAni");

    // 切换开关状态
    public static onSwitch(type:string){
        switch (type){
            case "coinAni":
            case "initAddElemAni":
                if (Switch[type]())
                    Utils.saveLocalData(type, false);
                else 
                    Utils.saveLocalData(type, true);
                
                break;
            case "volume":
                if(AudioFactory.AudioOn){
                    Utils.saveLocalData("SysSetting_AudioOn", 0);
                    AudioFactory.AudioOn = 0;
                }
                else {
                    Utils.saveLocalData("SysSetting_AudioOn", 1);
                    AudioFactory.AudioOn = 1;
                }
                break;
        }
    }
}