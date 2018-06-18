
// 玩家数据
class Player {

    // 应该序列化的字段
    private static serializableFields = [
        "currentLevel", "battleRandomSeed", "avatar", 
        "deathStep", "hp", "maxHp", "power", "defence", "dodge", 
        "occupation", 
        "money", ""];

    // 所属战斗
    private $$bt;
    public getBattle = ():Battle => this.$$bt;
    public setBattle(bt:Battle) {
        this.$$bt = bt;

        for (var r of this.relics)
            r.setBattle(bt);

        for (var p of this.props)
            p.setBattle(bt);
    }

    // 关卡逻辑
    public currentLevel:string; // 当前关卡配置名称
    public battleRandomSeed:number; // 下一场战斗随机种子

    // 重新创建角色
    public static createTestPlayer():Player {
        var p = new Player();
        p.currentLevel = "testLevel1";
        p.occupation = "nurse";
        p.deathStep = 100;
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

    public toString():string {
        var relics = [];
        for (var r of this.relics)
            relics.push(r.toString());

        var props = [];
        for (var p of this.props)
            props.push(p.toString());

        var buffs = [];
        for (var b of this.buffs)
            buffs.push(b.toString());

        var pinfo = {relics:relics, props:props, buffs:buffs};
        for (var f of Player.serializableFields)
            pinfo[f] = this[f];

        return JSON.stringify(pinfo);
    }

    public static fromString(str:string):Player {
        var pinfo = JSON.parse(str);
        var p = new Player();
        for (var f of Player.serializableFields)
            p[f] = pinfo[f];

        for (var r of pinfo.relics)
            p.relics.push(Elem.fromString(r));

        for (var prop of pinfo.props)
            p.props.push(Elem.fromString(prop));

        for (var b of pinfo.buffs)
            p.buffs.push(Buff.fromString(p, b));

        return p
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

    public buffs:Buff[] = []; // 所有 buff
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

    // 遗物相关逻辑

    public relics:Elem[] = []; // 所有遗物

    public addRelic(e:Elem) {
        this.relics.push(e);
    }

    public removeRelic(type:string):Elem {
        for (var i in this.relics) {
            var e = this.relics[i];
            if (e.type == type) {
                this.relics = Utils.removeAt(this.relics, i)
                return e;
            }
        }

        Utils.assert(false, "player has no relic: " + type + " to remove");
    }

    // 道具相关逻辑

    public props:Elem[] = []; // 所有道具

    public addProp(e:Elem) {
        // 合并可叠加的物品
        var n = Utils.indexOf(this.props, (prop:Elem) => prop.type == e.type);
        if (n >= 0 && e.attrs.canOverlap) {
            var p = this.props[n];
            p.cnt += e.cnt;
        }
        else
            this.props.push(e);
    }

    public removeProp(type:string, cnt:number = 1) {
        var n = Utils.indexOf(this.props, (prop:Elem) => prop.type == type);
        Utils.assert(n >= 0, "no prop: " + type + " to remove");

        var p = this.props[n];
        Utils.assert(p.attrs.canOverlap || n == 1, type + " can be removed only 1 each time");
        p.cnt -= cnt;

        if (p.cnt <= 0 || !p.attrs.canOverlap)
            this.props = Utils.removeAt(this.props, n);
    }
}
