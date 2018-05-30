
// 玩家角色数据
class Player extends egret.EventDispatcher {
    public currentLevel:string; // 当前关卡配置名称
    public battleRandomSeed:number; // 下一场战斗随机种子

    // 重新创建角色
    public static createTestPlayer():Player {
        var p = new Player();
        p.currentLevel = "testLevel";
        p.hp = 10;
        p.maxHp = 20;
        p.avatar = "avator1";
        p.power = 2;
        p.defence = 0;
        p.dodge = 10; // 10%
        p.battleRandomSeed = 0;
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
}
