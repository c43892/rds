
// 玩家数据
class Player {

    // 应该序列化的字段
    private static serializableFields = [
        "currentLevel", "battleRandomSeed", "avatar", 
        "money", 
        "deathStep", "hp", "maxHp", "power", "defence", "dodge", 
        "occupation"];

    public getBattle; // 当前战斗

    // 关卡逻辑
    public currentLevel:string; // 当前关卡配置名称
    public battleRandomSeed:number; // 下一场战斗随机种子

    // 重新创建角色
    public static createTestPlayer():Player {
        var p = new Player();
        p.currentLevel = "testLevel1";
        p.occupation = "nurse";
        p.deathStep = 10;
        p.hp = 10;
        p.maxHp = 20;
        p.avatar = "avator1";
        p.power = 2;
        p.defence = 0;
        p.dodge = 0;
        p.battleRandomSeed = 0;
        p.money = 100;

        return p;
    }

    // 头像逻辑
    public avatar:string;

    // 非战斗逻辑
    public money:number; // 金币

    public addMoney(dm:number) {
        this.money += dm;
        if (this.money < 0)
            this.money = 0;
    }

    // 战斗逻辑
    public deathStep:number; // 死神剩余步数
    public hp:number;
    public maxHp:number;
    public power:number; // 攻击力
    public defence:number; // 防御力
    public dodge:number; // 闪避%

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
        else if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }

    // 序列化反序列化

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

    // 各逻辑点，不同职业的能力挂接于此
    public occupation:string; // 当前职业
    public onLevelInited = []; // 关卡数据初始化之后
    public onAllCoveredAtInit = []; // 关卡初始盖住所有元素之后
    public onStartupRegionUncovered = []; // 初始区域揭开之后
    public onGoOutLevel = []; // 离开当前关卡
    public onPlayerActed = [];
    public clear() {
        this.buffs = [];
        this.onLevelInited = [];
        this.onAllCoveredAtInit = [];
        this.onStartupRegionUncovered = [];
        this.onGoOutLevel = [];
    }

    public buffs = []; // 所有 buff
    mountBuffLogicPoint() {
        this.onPlayerActed.push(async () => {
            for (var b of this.buffs) {
                var h = b.onPlayerActed;
                if (!h)
                    continue;

                await h();
            }
        });
    }
}
