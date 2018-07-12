
// 大地图事件选项
class WMES {
    public getDesc; // 获取玩家可见的描述
    public valid; // 获取选项的当前可用性
    public exec; // 执行该选项
    public exit; // 执行该选项后，是否结束对话
    public refreshDesc; // 刷新显示
}

// 根据指定配置创建选项集
class WorldMapEventSelFactory {

    public startBattle;

    // 创建一组选项
    public createGroup(player:Player, sels) {
        var ss = [];
        for (var i = 0; i < sels.length; i++) {
            var sel = sels[i];
            var func = sel.func
            var ps = sel.ps;
            var s = this.newSel(ps);
            for (var f of func) {
                var c = this.creators[f];
                Utils.assert(!!c, "not support event selection: " + f + " yet");
                s = c(s, player, ps);
            }
            
            s.getDesc = this.genGetDesc(sel.desc, func, ps);
            ss.push(s);
        }

        return ss;
    }

    // 生成动态获取选项描述的函数
    genGetDesc(specificDesc:string, func, ps) {
        var genDesc = !specificDesc;
        var desc = genDesc ? "" : specificDesc;

        // 如果没有明确的描述文字，则自动拼接生成一个
        if (genDesc) {
            for (var i = 0; i < func.length; i++) {
                var f = func[i];
                var d = GCfg.getWorldMapEventSelsDesc(func[i]);
                desc += (i != func.length - 1) ? (d + ", ") : d;
            }
        }

        return () => {
            if (ps) {
                for (var p in ps) {
                    var pName = "{"+p+"}";
                    var pValue = ps[p];
                    if (p == "item") pValue = GCfg.getElemAttrsCfg(pValue).name;
                    desc = desc.replace(pName, pValue);
                }
            }

            return desc;
        };
    }

    newSel(ps):WMES {
        var sel = new WMES();
        sel.exec = async () => {};
        sel.valid = () => true;
        sel.exit = () => true;
        return sel;
    }

    exec(exec, sel:WMES):WMES {
        var priorExec = sel.exec;
        sel.exec = async () => {
            await priorExec();
            await exec();
        };
        return sel;
    }

    valid(valid, sel:WMES):WMES {
        var priorValid = sel.valid;
        sel.valid = () => priorValid() && valid();
        return sel;
    }

    creators = {
        "exit": (sel:WMES, p:Player, ps) => { sel.exit = () => true; return sel; },
        "battle": (sel:WMES, p:Player, ps) => this.exec(async () => await this.startBattle(ps.battleType), sel),
        "-money": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMoney(-ps.money), sel),
        "+money": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMoney(ps.money), sel),
        "-allMoney": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMoney(-p.money), sel),
        "-hp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addHp(-ps.hp), sel),
        "+hp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addHp(ps.hp), sel),
        "-maxHpPrecentage": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMaxHp(Math.ceil(-p.maxHp * ps.maxHpPrecentage / 100)), sel),
        "-maxHp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMaxHp(-ps.maxHp), sel),
        "+maxHp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMaxHp(ps.maxHp), sel),
        "+item": (sel:WMES, p:Player, ps) => this.valid(async () => Utils.occupationCompatible(p.occupation, ps.item), 
            this.exec(async () => {
                var item = ElemFactory.create(ps.item);
                if (item instanceof Prop) p.addProp(item);
                else if (item instanceof Relic) p.addRelic(item);
        }, sel)),
        "reinforceRandomRelics": (sel:WMES, p:Player, ps) => this.valid(() => p.getReinfoceableRelics().length > 0, 
            this.exec(async () => {
                var relics = p.getReinfoceableRelics();
                var rs = p.playerRandom.selectN(relics, 2);
                Utils.assert(rs.length > 0, "no relic can be reinforced");
                for (var relic of rs)
                    p.addRelic(ElemFactory.create(relic.type));
        }, sel)),
        "gambling": (sel:WMES, p:Player, ps) => this.valid(() => p.money >= ps.wager,
            this.exec(async () => {
                p.addMoney(-ps.wager);
                if (p.playerRandom.next100() < ps.rate)
                    p.addMoney(ps.award);
        }, sel)),
    };
}
