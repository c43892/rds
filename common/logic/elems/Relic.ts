// 遗物
class Relic extends Elem {
    constructor() {super();}
    
    public player:Player;
    public toRelic; // 从地上的遗物物品，变成真正的遗物，这时才具备基础遗物逻辑

    // 强化相关逻辑
    
    public reinforceLv = 0; // 强化等级
    public canReinfoce():boolean { return this.attrs.reinforce && this.reinforceLv < this.attrs.reinforce.length; }
    public reinforceLvUp():boolean { 
        if (!this.canReinfoce())
            return false;

        this.setReinfoceLv(this.reinforceLv + 1);
        return true;
    }
    public setReinfoceLv(lv:number) {
        Utils.assert(lv > 0 && lv < this.attrs.reinforce.length, "reinforce level overflow");
        var reinforceAttrs = this.attrs.reinforce[lv - 1];
        this.reinforceLv = lv;
        for (var attr in reinforceAttrs)
            this.attrs[attr] = reinforceAttrs[attr];
    }

    // 变异相关逻辑，或者不能变异，或者固定 5 个变异逻辑
    public enabledFuncs = [];
    public funcs = []; // 0 是基础属性，1-5 是变异属性，前 3 个正面，后 2 个负面
    public canMutate():boolean { // 最多变异 3 次，每次一定出现 1 个正面属性，所以 3 个属性都生效，都不可变异了
        return this.funcs.length > 1 &&
            !(Utils.contains(this.funcs, 1)
                && Utils.contains(this.funcs, 2)
                && Utils.contains(this.funcs, 3));
    }

    // 获取可候选的正面变异属性
    getValidPositiveFuncs() {
        var r = [];
        for (var p of [1, 2, 3])
            if (!Utils.contains(this.enabledFuncs, p))
                r.push(p);

        return r;
    }

    // 获取可候选的负面变异属性
    getValidNegativeFuncs() {
        var r = [];
        for (var p of [4, 5])
            if (!Utils.contains(this.enabledFuncs, p))
                r.push(p);

        return r;
    }

    // 执行一次变异逻辑
    public mutate() {
        if (!this.canMutate()) return;
        var pfs = this.getValidPositiveFuncs();
        var nfs = this.getValidNegativeFuncs();
        var f2mutate = [];
        switch(pfs.length) {
            case 3: // 第一次变异，出一条正面属性
                f2mutate.push(this.player.playerRandom.select(pfs));
                break;
            case 2: // 第二次变异
                f2mutate.push(this.player.playerRandom.select(pfs));
                if (this.player.playerRandom.next100() < 50)
                    f2mutate.push(this.player.playerRandom.select(nfs));
                break;
            case 1: // 第三次变异
                f2mutate.push(this.player.playerRandom.select(pfs));
                if (this.player.playerRandom.next100() < 75)
                    f2mutate.push(this.player.playerRandom.select(nfs));
                break;
            default:
                Utils.assert(false, "invalid valid positive funcs number to mutate: " + pfs.length);
        }

        for (var fp of f2mutate) {
            Utils.assert(!Utils.contains(this.enabledFuncs, fp), "relic func enable duplicated: " + this.type + ":" + fp);
            this.enabledFuncs.push(fp);
            this.funcs[fp](this, true);
        }
    }

    // 重新使所有变异属性生效（基础属性除外），一般用在 save/load 的时候
    public redoAllMutateEffects() {
        for (var fp of this.enabledFuncs)
            if (fp != 0)
                this.funcs[fp](this, false);
    }

    // 遗物从身上移除时，可能需要手动移除所有功能
    public removeAllEffects() {
        for (var fp of this.enabledFuncs)
            this.funcs[fp](this, false);
    }
}
