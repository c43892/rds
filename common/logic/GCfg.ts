// 游戏全局配置
class GCfg {
    public static mapsize; // 地图尺寸
    public static getLevelCfg; // 获取指定关卡配置，形如 function(lv:string):{...}
    public static getElemAttrsCfg; // 默认的元素属性配置
    public static playerCfg; // 获取角色相关配置
    public static getRandomDropGroupCfg; // 获取随机掉落组配置
    public static worldMapConnectionCfg; // 世界地图连接配置
    public static getWorldMapCfg; // 获取指定世界地图配置
    public static getShopCfg; // 获取商店配置
    public static getRobCfg; // 获取抢劫配置
    public static getWorldMapEventSelsDesc;
    public static getWorldMapEventSelGroupsCfg; // 获取大地图事件组配置
    public static getMultiLanguageCfg; // 获取多语言配置
    public static getElemDescCfg; // 获取元素描述文本配置
    public static getOccupationCfg; // 获取职业相关配置
    public static getElemPosCfg; // 获取关卡中指定元素位置的配置
    public static getLevelLogicCfg; // 获取关卡逻辑配置
    public static getElemAttrsOfLevel; // 获取元素在特定层数的配置
    public static getBattleViewElemTipTypes; // 获取战斗内需要特殊元素提示的类型
    public static getBattleTypes; // 获取各种战斗关卡的战斗类型,boss或senior
    public static getMiscConfig; // 在misc.json获取各类单独的小配置
    public static getRandomNameCfg; // 获取随机玩家名所用的配置
    public static getInvalidNameCfg; // 获取随机玩家名所用的配置
    public static getAchvCfg; // 获取成就配置
    public static getAchvAwardCfg; // 成就奖励配置
    public static getDifficultyCfg; // 难度相关配置
}