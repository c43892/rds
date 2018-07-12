
// 大地图事件选项
class WMES {
    public desc; // 获取玩家可见的描述
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
            var ps = Utils.clone(sel.ps);
            var s = this.newSel();
            for (var f of func) {
                var c = this.creators[f];
                Utils.assert(!!c, "not support event selection: " + f + " yet");
                s = c(s, player, ps);
            }
            
            if (!s.desc) s.desc = this.genDesc(sel.desc, func, ps);
            ss.push(s);
        }

        return ss;
    }

    // 生成动态获取选项描述的函数
    genDesc(specificDesc:string, func, ps) {
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

        if (ps) {
            for (var p in ps) {
                var pName = "{"+p+"}";
                var pValue = ps[p];
                if (!Utils.contains(["number", "string"], typeof(pValue))) continue;
                if (p == "item") pValue = GCfg.getElemAttrsCfg(pValue).name;
                desc = desc.replace(pName, pValue);
            }
        }

        return desc;
    }

    newSel():WMES {
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
        "-money": (sel:WMES, p:Player, ps) => this.valid(() => p.money >= ps.money, 
            this.exec(async () => p.addMoney(-ps.money), sel)),
        "+money": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMoney(ps.money), sel),
        "-allMoney": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMoney(-p.money), sel),
        "-hp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addHp(-ps.hp), sel),
        "+hp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addHp(ps.hp), sel),
        "-hpPrecentage": (sel:WMES, p:Player, ps) => { 
            var hp = Math.ceil(p.maxHp * ps.hpPrecentage / 100);
            ps["hp"] = hp;
            return this.exec(async () => p.addHp(-hp), sel);
        },
        "-maxHpPrecentage": (sel:WMES, p:Player, ps) => {
            var maxHp = Math.ceil(p.maxHp * ps.maxHpPrecentage / 100);
            ps["maxHp"] = maxHp;
            return this.exec(async () => p.addMaxHp(-maxHp), sel)
        },
        "-maxHp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMaxHp(-ps.maxHp), sel),
        "+maxHp": (sel:WMES, p:Player, ps) => this.exec(async () => p.addMaxHp(ps.maxHp), sel),
        "+item": (sel:WMES, p:Player, ps) => this.valid(() => Utils.occupationCompatible(p.occupation, ps.item), 
            this.exec(async () => p.addItem(ElemFactory.create(ps.item)), sel)),
        "reinforceRandomRelics": (sel:WMES, p:Player, ps) => this.valid(() => p.getReinfoceableRelics().length > 0, 
            this.exec(async () => {
                var relics = p.getReinfoceableRelics();
                var rs = p.playerRandom.selectN(relics, 2);
                Utils.assert(rs.length > 0, "no relic can be reinforced");
                for (var relic of rs)
                    p.addRelic(<Relic>ElemFactory.create(relic.type));
        }, sel)),
        "gambling": (sel:WMES, p:Player, ps) => this.valid(() => p.money >= ps.wager,
            this.exec(async () => {
                p.addMoney(-ps.wager);
                if (p.playerRandom.next100() < ps.rate)
                    p.addMoney(ps.award);
        }, sel)),
        "+randomItems":(sel:WMES, p:Player, ps) => this.exec(async () => {
            var es = Utils.randomSelectByWeightWithPlayerFilter(p, ps.items, p.playerRandom, ps.randomNum, ps.randomNum+1, true);
            for (var et of es) {
                var e = ElemFactory.create(et);
                delete ps.items[et];
                p.addItem(e);
            }
        }, sel),
        "sequence": (sel:WMES, p:Player, ps) => {
            var subSels = [];
            for (var i = 0; i < ps.rates.length; i++) {
                var subSel = this.newSel();
                var rate = ps.rates[i];
                var hit = p.playerRandom.next100() < rate;
                var func = hit ? ps.func : ps.failedFunc;
                for (var f of func) {
                    var c = this.creators[f];
                    Utils.assert(!!c, "not support event selection: " + f + " yet");

                    // 合并子项参数
                    for (var pp in ps.ps[i]) ps[pp] = ps.ps[i][pp];
                    ps["rate"] = rate;
                    ps["-rate"] = 100 - rate;

                    subSel = c(subSel, p, Utils.clone(ps));
                    subSel.desc = this.genDesc(ps.desc, func, ps);
                }
                subSels.push(subSel);
                if (!hit) break;
            }

            sel["move2NextSubSel"] = (n) => {
                var ss = subSels[n++];
                sel.valid = ss.valid;
                sel.exec = async () => {
                    await ss.exec();
                    if (n < subSels.length) {
                        sel["move2NextSubSel"](n);
                        sel.exit = () => false;
                    } else
                        sel.exit = () => true;
                };
                sel.desc = ss.desc;
            };

            sel["move2NextSubSel"](0);
            
            return sel;
        }
    };
}
