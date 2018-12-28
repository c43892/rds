// 各类开关
class Switch {
    // 音乐开关
    public static volume = () => Utils.loadLocalData("SysSetting_AudioOn") == "off" ? false : true;
    // 金币动画开关
    public static coinAni = () => Utils.loadLocalData("coinAni") == "off" ? false : true;
    // 初始增添元素动画开关
    public static initAddElemAni  = () => Utils.loadLocalData("initAddElemAni") == "off" ? false : true;

    // 切换开关状态
    public static onSwitch(type:string){
        switch (type){
            case "coinAni":
            case "initAddElemAni":
                if (Switch[type]())
                    Utils.saveLocalData(type, "off");
                else 
                    Utils.saveLocalData(type, "on");
                
                break;
            case "volume":
                if(AudioFactory.AudioOn){
                    Utils.saveLocalData("SysSetting_AudioOn", "off");
                    AudioFactory.AudioOn = 0;
                }
                else {
                    Utils.saveLocalData("SysSetting_AudioOn", "on");
                    AudioFactory.AudioOn = 1;
                }
                break;
        }
    }
}