
// 玩家角色数据
class Player extends egret.EventDispatcher {
    public currentLevel:string; // 当前关卡配置名称

    // 重新创建角色
    public static createTestPlayer():Player {
        var p = new Player();
        p.currentLevel = "testLevel";
        p.hp = 10;
        p.maxHp = 20;
        p.avatar = "avator1";
        return p;
    }

    // 头像逻辑
    public avatar:string;

    // 血量逻辑
    public hp:number;
    public maxHp:number;
    public addHp(num:number) {
        this.hp += num;
        if (this.hp < 0)
            this.hp = 0;
        else if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }
    
}
