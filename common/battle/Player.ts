
// 玩家角色数据
class Player extends egret.EventDispatcher {

    // 应该序列化的字段
    private static serializableFields = [
        "currentLevel", "battleRandomSeed", "avatar", 
        "hp", "maxHp", "power", "defence", "dodge"];

    public currentLevel:string; // 当前关卡配置名称
    public battleRandomSeed:number; // 下一场战斗随机种子

    // 重新创建角色
    public static createTestPlayer():Player {
        var p = new Player();
        p.currentLevel = "testLevel1";
        p.hp = 10;
        p.maxHp = 20;
        p.avatar = "avator1";
        p.power = 2;
        p.defence = 0;
        p.dodge = 0;
        p.battleRandomSeed = (new Date()).getMilliseconds();
        return p;
    }

    // 头像逻辑
    public avatar:string;

    // 血量逻辑
    public hp:number;
    public maxHp:number;
    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
        else if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }
    
    // 战斗逻辑
    public power:number; // 攻击力
    public defence:number; // 防御力
    public dodge:number; // 闪避%

    public static fromString(str:string):Player {
        var pinfo = JSON.parse(str);
        var p = new Player();
        for (var f of Player.serializableFields)
            p[f] = pinfo[f];

        return p
    }

    public toString():string {
        var pinfo = {};
        for (var f of Player.serializableFields)
            pinfo[f] = this[f];

        return JSON.stringify(pinfo);
    }
}
