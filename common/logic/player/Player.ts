
// 玩家数据

class Player {
    // 应该序列化的字段
    private static serializableFields = [
        "currentStoreyPos", "finishedStoreyPos", "finishedWorldMap", "finishedEvent", "battleRandomSeed",  
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
    public currentTotalStorey = () => Utils.playerFinishedStorey(this); // 当前总层数
    public finishedStoreyPos; // 已经完成的世界地图节点
    public finishedWorldMap:string[] = []; // 已经完成的世界
    public finishedEvent = [];

    // 重新创建角色
    public static createTestPlayer():Player {
        var p = new Player();
        p.worldmap = undefined;
        p.currentStoreyPos = {lv:0, n:0, status:"finished"};
        p.finishedStoreyPos = [{lv:0, n:0}];
        p.occupation = "Nurse";
        p.deathStep = 100;

        p.maxDeathStep = 150;
        p.hp = 20;
        p.maxHp = 20;
        p.dodge = 0;
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
        if (this.lv >= exp2Lv.length) // 已经满级了
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
    public targetFlags:string[][] = [[], []]; // 被攻击时的属性

    public power:number[] = [0, 0]; // 攻击力
    public accuracy:number[] = [0, 0]; // 命中
    public critical:number[] = [0, 0]; // 暴击
    public damageAdd:number[] = [0, 0]; // +伤

    public shield:number = 0; // 护盾
    public dodge:number = 0; // 闪避
    public damageDec:number = 0; // -伤
    public resist:number = 0; // 抗性
    public damageShared:number = 0; // 伤害分担
    public muiltAttack:number[] = [1, 0]; // 多重攻击

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
            addBuffs:[],
            muiltAttack:this.muiltAttack[n],
        };
    }

    public getAttrsAsTarget() {
        return {
            owner:this,
            shield:{a:0, b:this.shield, c:0},
            dodge:{a:0, b:this.dodge, c:0},
            damageDec:{a:0, b:this.damageDec, c:0},
            resist:{a:0, b:0, c:this.resist},
            damageShared:{a:0, b:this.damageShared, c:0},
            targetFlags:[...this.targetFlags]            
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

    public addDodge(dd:number) {
        this.dodge += dd;
        if (this.dodge < 0)
            this.dodge = 0;
    }

    // 带到下一层去的Elem
    public elems2NextLevel:Elem[] = [];

    collectAllLogicHandler() {
        var hs = [];

        hs.push(...this.relics);

        return hs;
    }

    // 触发逻辑点，参数为逻辑点名称，该名称直接字面对应个各元素对逻辑点的处理函数，
    // 处理函数的返回值表示是否需要截获该事件，不再传递给其它元素
    public async triggerLogicPoint(lpName:string, ps = undefined) {
        if(!this.bt()){
            var hs = this.collectAllLogicHandler();
            for (var h of hs) {
                if (h[lpName] && await h[lpName](ps))
                    return;
            }
        }
        else await this.bt().triggerLogicPoint(lpName, ps);
    }

    public triggerLogicPointSync(lpName:string, ps = undefined) {
        if(!this.bt()){
            var hs = this.collectAllLogicHandler();
            for (var h of hs) {
                if (h[lpName] && h[lpName](ps))
                    return;
            }
        }
        else this.bt().triggerLogicPointSync(lpName, ps);        
    }

    private eventHandlers = {}; // 事件处理函数

    // 注册事件响应函数，这些事件是一个个异步执行的函数，需要一个个 wait 顺序执行，这也是不直接使用 egret.EventDispatcher 的原因
    public registerEvent(eventType:string, h) {
        var handlers = this.eventHandlers[eventType];
        if (handlers == undefined) {
            handlers = [];
            this.eventHandlers[eventType] = handlers;
        }

        handlers.push(h);
    }

    // 触发事件，这些事件是一个个异步执行的函数，需要一个个 wait 顺序执行，这也是不直接使用 egret.EventDispatcher 的原因    
    public async fireEvent(eventType:string, ps = undefined) {
        var handlers = this.eventHandlers[eventType];
        if (handlers == undefined)
            return;

        for (var h of handlers)
            await h(ps);
    }

    // 同步触发事件，不会使用协程等待，典型的用途是录像
    public fireEventSync(eventType:string, ps = undefined) {
        var handlers = this.eventHandlers[eventType];
        if (handlers == undefined)
            return;

        for (var h of handlers)
            h(ps);
    }

    // 序列化反序列化

    public toString():string {
        var relics = [];
        var removedRelics = this.relics;
        for (var r of this.relics){
            relics.push(r.toString());
            this.removeRelic(r.type);
        }

        var props = [];
        for (var p of this.props)
            props.push(p.toString());

        var elems2NextLevel = [];
        for(var e of this.elems2NextLevel){
            var elemInfo = {type:{}, attrs:{}, hp:{}, shield:{}};
            if(e instanceof Item || e instanceof Prop){
                elemInfo.type = "ItemProp";
                elemInfo.attrs = e.toString();
                elems2NextLevel.push(elemInfo);
            }
            else if(e instanceof Relic){
                elemInfo.type = "Relic";
                elemInfo.attrs = e.toString();
                elems2NextLevel.push(elemInfo);
            }
            else if(e instanceof Monster){
                elemInfo.type = e.type;
                elemInfo.attrs = e.attrs;
                elemInfo.hp = e.hp;
                elemInfo.shield = e.shield;
                elems2NextLevel.push(elemInfo);
            }
            else
                Utils.log("Unknown type in elems2NextLevel");
        }

        // 目前 buff 不参与

        var world = this.worldmap.toString();
        var srand = this.playerRandom.toString();

        var pinfo = {relics:relics, props:props, elems2NextLevel:elems2NextLevel, world:world, srand:srand};
        for (var f of Player.serializableFields)
            pinfo[f] = this[f];

        var saveData = JSON.stringify(pinfo);

        for(var relic of removedRelics)
            this.addRelic(relic);

        return saveData;
    }

    public static fromString(str:string):Player {
        var pinfo = JSON.parse(str);
        var p = new Player();
        for (var f of Player.serializableFields)
            p[f] = pinfo[f];

        for (var r of pinfo.relics) {
            var relic = Relic.fromString(r);
            p.addRelic(<Relic>relic);
            (<Relic>relic).redoAllMutatedEffects();
        }

        for (var prop of pinfo.props) {
            var pi = <Prop>Elem.fromString(prop);
            var cnt = pi.cnt;
            var pp = pi.toProp();
            pp.cnt = cnt;
            p.props.push(pp);
        }

        for (var elemInfo of pinfo.elems2NextLevel){
            if(elemInfo.type == "ItemProp"){
                var e = Elem.fromString(elemInfo.attrs);
                p.elems2NextLevel.push(e);
            }
            else if(elemInfo.type == "Relic"){
                var relic = Relic.fromString(elemInfo.attrs);
                p.elems2NextLevel.push(relic);
            }
            else {
                var m = <Monster>ElemFactory.create(elemInfo.type, elemInfo.attrs);
                m.hp = elemInfo.hp;
                m.shield = elemInfo.shield;
                p.elems2NextLevel.push(m);
            }
        }

        // 目前 buff 不参与

        p.worldmap = WorldMap.fromString(pinfo.world);
        p.worldmap.player = p;
        p.playerRandom = SRandom.fromString(pinfo.srand);
        p = Occupation.addOccupationBuff(p);

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
        else 
            this.buffs[n].overBuff(buff);
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
        if (Utils.checkCatalogues(e.type, "coin")) {
            this.addMoney(e.cnt);
            return;
        }

        e.setBattle(this.bt());
        if (e instanceof Relic)
            this.addRelic(<Relic>e);
        else if (e instanceof Prop)
            this.addProp(<Prop>e);
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
                this.relics = Utils.removeAt(this.relics, i);
                (<Relic>e).removeAllEffects();
                return e;
            }
        }

        Utils.assert(false, "player has no relic: " + type + " to remove");
    }

    // 道具相关逻辑

    public props:Elem[] = []; // 所有道具

    // 添加道具，并返回被添加到的位置
    public addProp(e:Prop):number {
        var prop = e.toProp();

        // 合并可叠加的物品
        var n = Utils.indexOf(this.props, (p:Elem) => p.type == prop.type);
        if (n >= 0 && e.attrs.canOverlap) {
            this.props[n].cnt += prop.cnt;
            return n;
        }
        else {
            this.props.push(prop);
            return this.props.length - 1;
        }
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

    // 进入新的世界地图
    public goToNewWorld(newWorld:WorldMap){
        this.worldmap = newWorld;
        this.currentStoreyPos = {lv:0, n:0, status:"finished"};
        this.finishedStoreyPos = [{lv:0, n:0}];
        this.finishedEvent = [];
        Utils.savePlayer(this);
    }
}
