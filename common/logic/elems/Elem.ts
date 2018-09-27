
// 地图上每个怪物，物品，符文都是一个元素
class Elem {
    constructor() {}

    public $$id:string; // 调试用
    public $$bt; // 所属战斗对象
    public setBattle(bt:Battle) { this.$$bt = bt; }
    public bt():Battle { return this.$$bt; } // 所属战斗对象
    public map():Map { return this.bt().level.map; }
    public type: string; // 元素类型
    public cnt:number; // 叠加数量
    public cd:number; // 冷却回合数
    public pos = {x: 0, y: 0}; // 元素当前坐标位置
    public hazard:boolean;
    public barrier:boolean;
    public isHazard = () => this.hazard; // 是否有害，有害的元素会被相邻格子计数
    public hideHazardNum = () => this.attrs.hideHazardNum ? this.attrs.hideHazardNum : false; // 是否隐藏周围的计数
    public isBarrier = () => this.barrier; // 是否会阻挡道路
    public movingSpeed:number; // 移动速度
    public getGrid = () => this.bt().level.map.getGridAt(this.pos.x, this.pos.y); // 当前元素所在的地图格
    public getElemImgRes = () => this.attrs.elemImg ? this.attrs.elemImg : this.type;
    public isBig = () => this.attrs.size.w > 1 || this.attrs.size.h > 1; // 是否是大尺寸元素

    // 各逻辑点，挂接的都是函数
    public canUse = () => { return false; } // 一个 function():boolean
    public canNotUseReason = () => undefined;
    public useWithTarget = () => this.attrs.useWithTarget;
    public canUseAt = (x:number, y:number):boolean => {  // 是否可对指定位置使用
        if (!this.attrs.useWithTarget) return false;
        var g = this.map().getGridAt(x, y);
        var e = this.map().getElemAt(x, y);
        switch (this.attrs.validTarget) {
            case "all": // 全图
                return true;
            case "uncoveredEmpty": // 揭开的空格子
                return !g.isCovered() && !e;
            case "markedMonster|uncoveredMonster|uncoverable": // 标记或者揭开的怪或者临近块
                return (e instanceof Monster && g.isUncoveredOrMarked()) || g.isUncoverable();
            case "markedHazardMonster|uncoveredHazardMonster|uncoverable": // 标记或者揭开的威胁怪或临近块
                return (e instanceof Monster && g.isUncoveredOrMarked() && (e.isHazard() || (e["linkTo"] && e["linkTo"].isHazard())) || g.isUncoverable());
            case "uncoveredMonser": // 揭开的怪
                return e instanceof Monster && !g.isCovered();
            case "markedMonster|uncoveredMonser": // 标记或者揭开的怪
                return e instanceof Monster && g.isMarked();
            default:
                return false;
        }
    };
    public isValid = () => { return this.bt().level.map.isGenerallyValid(this.pos.x, this.pos.y); } // 是否被周围怪物影响导致失效
    public canBeDragDrop = false; // 可以被玩家拖拽移动
    public checkCD = () => true;
    public resetCD;
    
    // 以下关于 use 相关的逻辑，都不考虑未揭开情况，因为 Elem 并不包含揭开这个逻辑，
    // 也不考虑被其它元素的影响的情况，这种影响属于地图整体逻辑的一部分
    public use; // 一个 function():{boolean, boolean}, 返回值表示是否要保留（不消耗），消耗死神步数
    public useAt; // 一个 function(x:number, y:number):boolean, 返回值表示是否要保留（不消耗）

    // 各种逻辑点，Elem 应该在此作响应逻辑
    // public afterPlayerActed; // 当角色行动结束时触发，会被赋值为一个 function():void 的函数
    // public beforePlayerMove2NextLevel; // 当角色准备进入下一层时触发
    public beforeDie // 物品死亡前（物品使用后从地图上移除也算）
    public onDie; // 物品死亡时（物品使用后从地图上移除也算）
    public afterDie; // 物品死亡后（物品使用后从地图上移除也算）
    
    public attrs; // 来自配置表的属性，不允许在代码中修改!
    public btAttrs; // 战斗相关属性
    public onAttrs = {}; // 影响战斗属性的参数
    public dropItems:Elem[] = [];

    // 添加掉落物品
    public addDropItem(e:Elem) {        
        // 目前限定，Item 和 Prop 类型的非金钱掉落，最多只能有一个
        Utils.assert(e.type == "Coins" || e instanceof Prop || e instanceof Relic || e instanceof Monster
                         || Utils.indexOf(this.dropItems, (elem) => elem.type != "Coins" && elem.type != e.type 
                                && !(elem instanceof Prop || elem instanceof Relic || e instanceof Monster)) < 0,
                 "only one type drop item allowed (except Coins or Prop or Relic or Monster). no more " + e.type);

        if (e.attrs.canOverlap) { // 叠加物品
            var n = Utils.indexOf(this.dropItems, (elem) => elem.type == e.type);
            if (n >= 0)
                this.dropItems[n].cnt += e.cnt;
            else
                this.dropItems.push(e);
        } else {
            this.dropItems.push(e);
        }
    }

    // 手动移除某个逻辑点的AI
    public clearAIAtLogicPoint(logicPoint:string){
        this[logicPoint + "Async"] = undefined;
        this[logicPoint + "Sync"] = undefined;
    }

    // 获取攻击属性，怪物或者武器都可以作为攻击者
    public getAttrsAsAttacker() {
        return {
            owner:this,
            power:{a:0, b:this.btAttrs.power, c:0},
            accuracy:{a:0, b:this.btAttrs.accuracy, c:0},
            critical:{a:0, b:this.btAttrs.critical, c:0},
            damageAdd:{a:0, b:this.btAttrs.damageAdd, c:0},
            attackFlags: [...this.btAttrs.attackFlags],
            addBuffs:[...this.btAttrs.addBuffs],
            muiltAttack:(this.btAttrs.muiltAttack ? this.btAttrs.muiltAttack : 1)
        };
    }

    // 序列化和反序列化

    public toString():string {
        var dropItmes = [];
        for (var dp of this.dropItems)
            dropItmes.push(dp.toString());

        return JSON.stringify({type:this.type, 
            attrs:this.attrs, 
            cnt:this.cnt,
            dropItems:dropItmes, 
        });
    }

    public static fromString(str:string):Elem {
        var info = JSON.parse(str);
        var e = ElemFactory.create(info.type, info.attrs);
        e.cnt = info.cnt;
        for (var dp of info.dropItems)
            e.dropItems.push(Elem.fromString(dp));
        
        return e;
    }
}
