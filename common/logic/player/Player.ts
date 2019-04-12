
// 玩家数据

class Player {
    // 应该序列化的字段
    private static serializableFields = [
        "currentStoreyPos", "finishedStoreyPos", "finishedEvent", "finishedWorldMapName", "battleRandomSeed",  
        "deathStep", "maxDeathStep", "hp", "maxHp", "power", "defence", "dodge", 
        "occupation", "exp", "lv", "money", "globalEventFinishedCount", "relicsEquippedCapacity",
        "worldName", "difficulty", "rebornCnt"];

    // 所属战斗
    private $$bt;
    public bt = ():Battle => this.$$bt;
    public setBattle(bt:Battle) {
        this.$$bt = bt;

        for (var r of this.allRelics)
            r.setBattle(bt);

        for (var p of this.props)
            p.setBattle(bt);
    }

    public rebornCnt = 0; // 复活次数统计

    // 战斗统计
    public st:BattleStatistics;

    // 关卡逻辑
    public worldmap:WorldMap;
    public worldName:string;
    public worldmapRandomSeed:number; // 世界地图随机种子
    public playerRandom:SRandom; // 伴随角色的随机数，会被 save/load
    public currentStoreyPos; // 当前所在层数以及该层位置
    public currentTotalStorey = () => Utils.playerCurrentTotalStorey(this); // 当前所在的总层数
    public finishedTotalStorey = () => Utils.playerFinishedTotalStorey(this); // 当前所在的总层数
    public finishedStoreyPos; // 已经完成的世界地图节点
    public finishedWorldMap:WorldMap[] = []; // 已经完成的世界
    public finishedWorldMapName:string[] = []; // 已经完成的世界名,方便进行存档
    public finishedEvent = [];
    public globalEventFinishedCount = {}; // 全局事件计数
    public difficulty:string; // 游戏难度

    // 重新创建角色
    public static createPlayer(occ:string, diff:number):Player {
        var p = new Player();
        p.difficulty = "level" + diff;
        p.worldmap = undefined;
        p.currentStoreyPos = {lv:0, n:0, status:"finished"};
        p.finishedStoreyPos = [{lv:0, n:0}];
        p.occupation = occ;
        p.deathStep = GCfg.getDifficultyCfg()[p.difficulty]["deathStep"];

        p.maxDeathStep = 150;
        p.maxHp = GCfg.getDifficultyCfg()[p.difficulty]["maxHp"];
        p.hp = p.maxHp;
        p.dodge = 0;
        p.power = [4, 0];
        p.playerRandom = new SRandom();
        p.worldmapRandomSeed = p.playerRandom.nextInt(0, 1000000000);
        p.money = 50;
        p.exp = 0;
        p.lv = 0;
        p.relicsEquippedCapacity = Utils.getPlayerInitRelicsEquippedCapacity(p.difficulty);
        p.rebornCnt = 0;

        p.st = new BattleStatistics(p);

        AchievementMgr.mgr.player = p;

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
        if (dm > 0) {
            this.st.addCoins(dm);

            if (!this.bt())
                AchievementMgr.mgr.actOnLogicPointSync("onPlayerGetMoneyOutside", {d:dm});
        }

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

        hs.push(...this.commonRelics, ...this.relicsEquipped);

        hs.push(...AchievementMgr.mgr.unfinishedAchvs);

        return hs;
    }

    // 复活
    public reborn() {
        this.rebornCnt++;
        // this.clear();
        this.hp = Math.floor(this.maxHp / 2);
    }

    // 触发逻辑点，参数为逻辑点名称，该名称直接字面对应个各元素对逻辑点的处理函数，
    // 处理函数的返回值表示是否需要截获该事件，不再传递给其它元素
    public async triggerLogicPoint(lpName:string, ps = undefined) {
        var trueLpName = lpName + "Async";
        if(!this.bt()){
            var hs = this.collectAllLogicHandler();
            for (var h of hs) {
                if (h[trueLpName]) 
                    await h[trueLpName](ps)
            }
        }
        else await this.bt().triggerLogicPoint(lpName, ps);
    }

    public triggerLogicPointSync(lpName:string, ps = undefined) {
        var trueLpName = lpName + "Sync";
        if(!this.bt()){
            var hs = this.collectAllLogicHandler();
            for (var h of hs) {
                if (h[trueLpName])
                    h[trueLpName](ps)
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
        // 序列化之前，要先把遗物移除，这样才能去掉遗物的数值影响，处理完之后，再放回来
        var commonRelics = [];
        var relicsEquipped = [];
        var removedCommonRelics = this.commonRelics;
        var removedRelicsEquipped = this.relicsEquipped;
        for (var r of this.commonRelics){
            commonRelics.push(r.toString());
            this.removeRelic(r.type);
        }
        for (var r of this.relicsEquipped){
            relicsEquipped.push(r.toString());
            this.removeRelic(r.type);
        }

        var relicsInBag = [];
        var removedRelicsInBag = this.relicsInBag;
        for (var r of this.relicsInBag){
            relicsInBag.push(r.toString());
            this.removeRelic(r.type);
        }

        var props = [];
        for (var p of this.props)
            props.push(p.toString());

        var elems2NextLevel = [];
        for(var e of this.elems2NextLevel){
            var elemInfo = {type:undefined, attrs:undefined, hp:undefined, shield:undefined};
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

        // 统计数据
        var st = this.st.toString();

        // 成就管理器中部分需要保存的数据
        var achievementMgrInfo = AchievementMgr.mgr.toString();

        // 目前 buff 不参与
        var srand = this.playerRandom.toString();
        var worldmapRandomSeed = this.worldmapRandomSeed;

        var pinfo = {commonRelics:commonRelics, relicsEquipped:relicsEquipped, 
            relicsInBag:relicsInBag, props:props, 
            elems2NextLevel:elems2NextLevel, 
            worldmapRandomSeed:worldmapRandomSeed, srand:srand, 
            statistics:st, achievementMgrInfo:achievementMgrInfo};
        for (var f of Player.serializableFields)
            pinfo[f] = this[f];

        var saveData = JSON.stringify(pinfo);

        for(var relic of removedCommonRelics)
            this.addRelicInternal(relic, true);

        for(var relic of removedRelicsEquipped)
            this.addRelicInternal(relic, true);

        for(var relic of removedRelicsInBag)
            this.addRelicInternal(relic, false);

        return saveData;
    }

    public static fromString(str:string):Player {
        var pinfo = JSON.parse(str);
        var p = new Player();
        for (var f of Player.serializableFields)
            p[f] = pinfo[f];

        // 暂用,对于玩家闪避数据的特殊处理
        if(p.dodge > 20)
            p.dodge = 20;

        for (var r of pinfo.commonRelics) {
            var relic = Relic.fromString(r);
            p.addRelicInternal(relic, true);
            (<Relic>relic).redoAllMutatedEffects();
        }

        for (var r of pinfo.relicsEquipped) {
            var relic = Relic.fromString(r);
            p.addRelicInternal(relic, true);
            (<Relic>relic).redoAllMutatedEffects();
        }

        for (var r of pinfo.relicsInBag) {
            var relic = Relic.fromString(r);
            p.addRelicInternal(relic, false);
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
        p.playerRandom = SRandom.fromString(pinfo.srand);
        p.worldmapRandomSeed = pinfo.worldmapRandomSeed;   

        p.finishedWorldMap = [];   
        for(var finishedWorldMapName of p.finishedWorldMapName) 
            p.finishedWorldMap.push(WorldMap.buildFromConfig(finishedWorldMapName, p));

        p.worldmap = WorldMap.buildFromConfig(p.worldName, p);        
        
        p.st = BattleStatistics.fromString(p, pinfo.statistics);
        AchievementMgr.mgr.fromString(pinfo.achievementMgrInfo);
        p = Occupation.makeOccupationBuff(p);

        return p;
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

    public relicEquippedCapacityMax = 12; // 装备格上限
    public relicsEquippedCapacity; // 遗物装备格容量
    public commonRelics:Relic[] = []; // 通用技能
    public get commonRelicTypes():string[] { 
        return GCfg.getOccupationCfg(this.occupation).commonRelics;
    }
    public commonRelicsIncludeNotGet():Relic[] {
        var rs = [];
        for (var type of this.commonRelicTypes){
            var index = Utils.indexOf(this.commonRelics, (rt:Relic) => rt.type == type);
            var r:Relic;
            if(index > -1)
                r = this.commonRelics[index];
            else
                r = <Relic>ElemFactory.create(type);
                
            rs.push(r);
        }
        return rs;
    }
    public relicsEquipped:Relic[] = []; // 已经装备的遗物
    public relicsInBag:Relic[] = []; // 包裹中的遗物
    public get allRelics():Relic[] {
        return [...this.commonRelics, ...this.relicsEquipped, ...this.relicsInBag];
    }

    // 获取还可以强化的遗物
    public getReinforceableRelics(allCommonRelic = false) {
        if(allCommonRelic)
            return Utils.filter([...this.commonRelicsIncludeNotGet(), ...this.relicsEquipped, ...this.relicsInBag], (r:Relic) => r.canReinfoce());
        else
            return Utils.filter(this.allRelics, (r:Relic) => r.canReinfoce());
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

    // player 内部使用
    private addRelicInternal(e:Relic, equipped:boolean) {
        Utils.assert(Utils.indexOf(this.allRelics, (r) => r.type == e.type) < 0, "relic conflicted in add4internal");
        if (equipped){
            if (Utils.contains(this.commonRelicTypes, e.type))
                this.commonRelics.push(e.toRelic(this));
            else
                this.relicsEquipped.push(e.toRelic(this));
        }
        else
            this.relicsInBag.push(e);
    }

    public addRelic(e:Relic) {
        // 不加相同的遗物
        var allRelics = this.allRelics;
        var n = Utils.indexOf(allRelics, (r) => r.type == e.type);
        if (n >= 0) {
            for (var i = 0; i <= e.reinforceLv; i++)
                allRelics[n].reinforceLvUp();

            return;
        }

        // 新的
        // 是否属于通用技能,不属于则根据装备栏是否已满决定去处
        if (Utils.contains(this.commonRelicTypes, e.type))
            this.commonRelics.push(e.toRelic(this));
        else {
            if (this.relicsEquipped.length < this.relicsEquippedCapacity)
                this.relicsEquipped.push(e.toRelic(this));
            else
                this.relicsInBag.push(e);
        }
        
        if (!this.bt())
            AchievementMgr.mgr.actOnLogicPointSync("onAddRelicOutside", {relicType:e.type});
    }

    public removeRelic(type:string):Elem {
        for (var i in this.commonRelics) {
            var e = this.commonRelics[i];
            if (e.type == type) {
                this.commonRelics = Utils.removeAt(this.commonRelics, i);
                (<Relic>e).removeAllEffects();
                e.player = undefined;
                return e;
            }
        }

        for (var i in this.relicsEquipped) {
            var e = this.relicsEquipped[i];
            if (e.type == type) {
                this.relicsEquipped = Utils.removeAt(this.relicsEquipped, i);
                (<Relic>e).removeAllEffects();
                e.player = undefined;
                return e;
            }
        }

        for (var i in this.relicsInBag) {
            var e = this.relicsInBag[i];
            if (e.type == type) {
                this.relicsInBag = Utils.removeAt(this.relicsInBag, i);
                return e;
            }
        }

        Utils.assert(false, "player has no relic: " + type + " to remove");
    }

    // 改变遗物位置
    public changeRelicPosition(rsEquipped:Relic[], rsInBag:Relic[]) {
        rsEquipped.forEach((relic: Relic, i) => {
            if (!relic) return;
            if (relic == this.relicsEquipped[i])
                return;
            else if (Utils.indexOf(this.relicsEquipped, (r: Relic) => r == relic) > -1)
                return;
            else
                relic.toRelic(this);
        })

        rsInBag.forEach((relic: Relic, i) => {
            if (relic == this.relicsInBag[i])
                return;
            else if (Utils.indexOf(this.relicsInBag, (r: Relic) => r == relic) > -1)
                return;
            else{
                relic.removeAllEffects();
                relic.player = undefined;
            }
        })

        this.relicsEquipped = rsEquipped;
        this.relicsInBag = rsInBag;
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

    // 完成世界地图
    public finishedWorld(worldMap:WorldMap){
        this.finishedWorldMap.push(worldMap);
        this.finishedWorldMapName.push(worldMap.cfg.name);
    }

    // 进入新的世界地图
    public goToWorld(world:WorldMap, newWorld = true){
        this.worldName = world.cfg.name;
        this.worldmap = world;
        if(newWorld){
            this.currentStoreyPos = {lv:0, n:0, status:"finished"};
            this.finishedStoreyPos = [{lv:0, n:0}];
            this.finishedEvent = [];
        }
        Utils.savePlayer(this);
    }
}
