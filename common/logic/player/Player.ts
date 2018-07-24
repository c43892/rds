
// 玩家数据

class Player {
    // 应该序列化的字段
    private static serializableFields = [
        "currentStoreyPos", "finishedStoreyPos", "battleRandomSeed",  
        "deathStep", "maxDeathStep", "hp", "maxHp", "power", "defence", "dodge", 
        "occupation", "exp", "lv", "money"];

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
    public worldmap:WorldMap;
    public playerRandom:SRandom; // 伴随角色的随机数，会被 save/load
    public currentStoreyPos; // 当前所在层数以及该层位置
    public finishedStoreyPos; // 已经完成的世界地图节点

    // 重新创建角色
    public static createTestPlayer():Player {
        var p = new Player();
        p.worldmap = undefined;
        p.currentStoreyPos = {lv:0, n:0, status:"finished"};
        p.finishedStoreyPos = [{lv:0, n:0}];
        p.occupation = "Nurse";
        p.deathStep = 100;
        p.maxDeathStep = 120;
        p.hp = 10;
        p.maxHp = 20;
        p.power = [3, 0];
        p.playerRandom = new SRandom();
        p.money = 50;
        p.exp = 0;
        p.lv = 0;

        return p;
    }

    // 经验等级

    public exp:number;
    public lv:number;

    // 加经验，不检查等级变化
    public addExp(dExp:number) {
        this.exp += dExp;
    }

    // 获取当前经验升级进度 [0, 1]
    public lvUpProgress() {
        var exp2Lv = GCfg.playerCfg.exp2Lv;        
        if (this.lv >= exp2Lv.Length) // 已经满级了
            return 1;

        if (this.exp >= exp2Lv[this.lv])
            return 1;
        
        return this.exp / exp2Lv[this.lv];
    }

    // 检查是否已经升级
    public checkLevelUp():boolean {
        var exp2Lv = GCfg.playerCfg.exp2Lv;        
        if (this.lv >= exp2Lv.Length) // 已经满级了
            return false;

        var oldLv = this.lv;
        while (this.exp >= exp2Lv[this.lv]) {
            this.exp -= exp2Lv[this.lv];
            this.lv++;
        }

        return this.lv > oldLv;
    }

    // 非战斗逻辑
    public money:number; // 金币

    public addMoney(dm:number):boolean {
        if (this.money  + dm < 0)
            return false;

        this.money += dm;
        return true;
    }

    // 战斗逻辑
    public deathStep:number; // 死神剩余步数
    public maxDeathStep:number; // 最大死神步数
    public hp:number;
    public maxHp:number;

    public attackFlags:string[][] = [[], ["item"]]; // 攻击属性
    public resistFlags:string[][] = [[], []]; // 抵抗属性
    public immuneFlags:string[][] = [[], []]; // 免疫属性

    public power:number[] = [0, 0]; // 攻击力
    public accuracy:number[] = [0, 0]; // 命中
    public critical:number[] = [0, 0]; // 暴击
    public damageAdd:number[] = [0, 0]; // +伤

    public shield:number = 0; // 护盾
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
            critical:{a:0, b:this.critical[n], c:0},
            damageAdd:{a:0, b:this.damageAdd[n], c:0},
            attackFlags: [...this.attackFlags[n]],
            addBuffs:[]
        };
    }

    public getAttrsAsTarget() {
        return {
            owner:this,
            shield:{a:0, b:this.shield, c:0},
            dodge:{a:0, b:this.dodge, c:0},
            damageDec:{a:0, b:this.damageDec, c:0},
            resist:{a:0, b:0, c:this.resist},
            immuneFlags:[...this.immuneFlags]
        };
    }

    public addHp(dhp:number) {
        this.hp += dhp;
        if (this.hp < 0)
            this.hp = 0;
        else if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }

    public addMaxHp(dmax:number) {
        this.maxHp += dmax;
        if (this.maxHp < 0)
            this.maxHp = 0;

        if (this.hp > this.maxHp)
            this.hp = this.maxHp;
    }

    public addShield(ds:number) {
        this.shield += ds;
        if (this.shield < 0)
            this.shield = 0;
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

        var world = this.worldmap.toString();
        var srand = this.playerRandom.toString();

        var pinfo = {relics:relics, props:props, world:world, srand:srand};
        for (var f of Player.serializableFields)
            pinfo[f] = this[f];

        return JSON.stringify(pinfo);
    }

    public static fromString(str:string):Player {
        var pinfo = JSON.parse(str);
        var p = new Player();
        for (var f of Player.serializableFields)
            p[f] = pinfo[f];

        for (var r of pinfo.relics) {
            var e = Elem.fromString(r);
            p.addRelic(<Relic>e);
            (<Relic>e).redoAllMutatedEffects();
        }

        for (var prop of pinfo.props)
            p.props.push((<Prop>Elem.fromString(prop)).toProp());

        // 目前 buff 不参与

        p.worldmap = WorldMap.fromString(pinfo.world);
        p.worldmap.player = p;
        p.playerRandom = SRandom.fromString(pinfo.srand);

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
            this.buffs[n].addBuffCnt(this.buffs[n].cnt, buff.cnt);
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

    public relics:Relic[] = []; // 所有遗物

    // 获取还可以强化的遗物
    public getReinfoceableRelics() {
        return Utils.filter(this.relics, (r:Relic) => r.canReinfoce());
    }

    public addItem(e:Elem) {
        e.setBattle(this.bt());
        if (e instanceof Relic)
            this.addRelic(<Relic>e);
        else if (e instanceof Prop)
            this.addProp(<Prop>e);
        else if (e.type == "Coins")
            this.addMoney(e.cnt);
        else
            Utils.assert(false, "player can not take: " + e.type);
    }

    public addRelic(e:Relic) {
        // 不加相同的遗物
        var n = Utils.indexOf(this.relics, (r) => r.type == e.type);
        if (n >= 0)
            this.relics[n].reinforceLvUp();
        else {
            e.player = this;            
            this.relics.push(e.toRelic(this));
        }
    }

    public removeRelic(type:string):Elem {
        for (var i in this.relics) {
            var e = this.relics[i];
            if (e.type == type) {
                this.relics = Utils.removeAt(this.relics, i)
                (<Relic>e).removeAllEffect();
                return e;
            }
        }

        Utils.assert(false, "player has no relic: " + type + " to remove");
    }

    // 道具相关逻辑

    public props:Elem[] = []; // 所有道具

    public addProp(e:Prop) {
        var prop = e.toProp();

        // 合并可叠加的物品
        var n = Utils.indexOf(this.props, (p:Elem) => p.type == prop.type);
        if (n >= 0 && e.attrs.canOverlap)
            this.props[n].cnt += prop.cnt;
        else
            this.props.push(prop);
    }

    public removeProp(type:string) {
        var n = Utils.indexOf(this.props, (prop:Elem) => prop.type == type);
        Utils.assert(n >= 0, "no prop: " + type + " to remove");
        this.props = Utils.removeAt(this.props, n);
    }

    // 大地图相关逻辑

    // 通知进入世界地图节点
    public notifyStoreyPosIn(lv:number, n:number) {
        this.currentStoreyPos = {lv:lv, n:n, status:"in"};
    }

    // 通知完成世界地图节点
    public notifyStoreyPosFinished(lv:number, n:number) {
        Utils.assert(
            this.currentStoreyPos.lv == lv
            && this.currentStoreyPos.n == n
            && this.currentStoreyPos.status == "in",
            "player current storey status ruined"
        );

        this.currentStoreyPos.status = "finished";
        this.finishedStoreyPos.push({lv:lv, n:n});
        
    }
}
