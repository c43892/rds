
// 玩家数据
class Player {

    // 应该序列化的字段
    private static serializableFields = [
        "currentLevel", "battleRandomSeed", "avatar", 
        "deathStep", "hp", "maxHp", "power", "defence", "dodge", 
        "occupation", "exp", "lv",
        "money", ""];

    // 所属战斗
    private $$bt;
    public bt = ():Battle => this.$$bt;
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
        p.deathStep = 10;
        p.hp = 10;
        p.maxHp = 20;
        p.avatar = "avator1";
        p.power = [2, 0];
        p.battleRandomSeed = 0;
        p.money = 100;
        p.exp = 0;
        p.lv = 0;

        return p;
    }

    // 经验等级

    public exp:number;
    public lv:number;

    // 加经验，返回值表示是否发生等级变化
    public addExp(dExp:number):boolean {
        var exp2Lv = GCfg.playerCfg.exp2Lv;        
        if (this.lv >= exp2Lv.Length) // 已经满级了
            return false;

        this.exp += dExp;
        if (this.exp >= exp2Lv[this.lv]) {
            this.exp -= exp2Lv[this.lv];
            this.lv++;
            return true;
        }
        else
            return false;
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

    public attackFlags:string[][] = [[], ["item"]]; // 攻击属性
    public resistFlags:string[][] = [[], []]; // 抵抗属性
    public immuneFlags:string[][] = [[], []]; // 免疫属性

    public power:number[] = [0, 0]; // 攻击力
    public accuracy:number[] = [0, 0]; // 命中
    public critial:number[] = [0, 0]; // 暴击
    public damageAdd:number[] = [0, 0]; // +伤

    public sheild:number = 0; // 护盾
    public dodge:number = 0; // 闪避
    public damageDec:number = 0; // -伤
    public resist:number = 0; // 抗性

    public isDead = () => this.hp <= 0;

    // 获取攻击属性，n 表示用哪一套
    public getAttrsAsAttacker(n:number) {
        return {
            owner:this,
            power:{a:0, b:this.power[n], c:0},
            accuracy:{a:0, b:this.accuracy[n], c:0},
            critial:{a:0, b:this.critial[n], c:0},
            damageAdd:{a:0, b:this.damageAdd[n], c:0},
            attackFlags: this.attackFlags[n],
            addBuffs:[]
        };
    }

    public getAttrsAsTarget() {
        return {
            owner:this,
            sheild:{a:0, b:this.sheild, c:0},
            dodge:{a:0, b:this.dodge, c:0},
            damageDec:{a:0, b:this.damageDec, c:0},
            resist:{a:0, b:0, c:this.resist},
            immuneFlags:this.immuneFlags
        };
    }

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
        else if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }

    public addSheild(ds:number) {
        this.sheild += ds;
        if (this.sheild < 0)
            this.sheild = 0;
    }

    // 序列化反序列化

    public toString():string {
        var relics = [];
        for (var r of this.relics)
            relics.push(r.toString());

        var props = [];
        for (var p of this.props)
            props.push(p.toString());

        // 目前 buff 不参与
        // var buffs = [];
        // for (var b of this.buffs)
        //     buffs.push(b.toString());

        var pinfo = {relics:relics, props:props/*, buffs:buffs*/};
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
            p.relics.push((<Relic>Elem.fromString(r)).toRelic());

        for (var prop of pinfo.props)
            p.props.push((<Prop>Elem.fromString(prop)).toProp());

        // 目前 buff 不参与
        // for (var b of pinfo.buffs)
        //     p.addBuff(Buff.fromString(b));

        return p
    }

    public occupation:string; // 当前职业
    public clear() {
        this.buffs = [];
    }

    // buff 相关

    public buffs:Buff[] = []; // 所有 buff
    
    public addBuff(buff:Buff) {
        // 如果有相同的 buff，就合并
        var n = Utils.indexOf(this.buffs, (b) => b.type == buff.type);
        if (n < 0) {
            buff.getOwner = () => this;
            this.buffs.push(buff);
        }
        else if (buff.cnt)
            this.buffs[n].cnt += buff.cnt;
    }

    public removeBuff(type:string):Buff {
        var n = Utils.indexOf(this.buffs, (b) => b.type == type);
        var buff;
        if (n >= 0) {
            buff = this.buffs[n];
            this.buffs = Utils.removeAt(this.buffs, n);
        }

        return buff;
    }

    // 遗物相关逻辑

    public relics:Elem[] = []; // 所有遗物

    public addRelic(e:Elem) {
        // 不加相同的遗物
        if (Utils.indexOf(this.relics, (r) => r.type == e.type) >= 0)
            return;

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

    public removeProp(type:string) {
        var n = Utils.indexOf(this.props, (prop:Elem) => prop.type == type);
        Utils.assert(n >= 0, "no prop: " + type + " to remove");
        this.props = Utils.removeAt(this.props, n);
    }
}
