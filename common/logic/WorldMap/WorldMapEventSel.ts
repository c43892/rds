
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
    public confirmOkYesNo; // yesno 确认
    public selRelic; // 选择遗物
    public openEventSelGroup; // 重新打开一个选项组
    public openSels; // 重新打开一个选项列表
    public openTurntable; // 打开转盘

    // 创建一组选项
    public createGroup(player:Player, sels) {
        var ss = [];
        for (var i = 0; i < sels.length; i++) {
            var sel = sels[i];
            var func = sel.func;
            var ps = Utils.clone(sel.ps);
            var s = this.newSel();
            for (var f of func) {
                var c = this.creators[f];
                Utils.assert(!!c, "not support event selection: " + f + " yet");
                s = c(s, player, ps);
            }
            
            if (!s.desc)
                s.desc = this.genDesc(sel.desc, func, ps);

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

    // 加减钱
    async implAddMoney(p:Player, dm) {
        p.addMoney(dm);
        await p.fireEvent("onGetMoneyInWorldmap", {dm:dm});
    }

    // 加减血
    async implAddHp(p:Player, dhp) {
        p.addHp(dhp);
    }

    // 加减最大血量
    async implAddMaxHp(p:Player, dMaxHp) {
        p.addMaxHp(dMaxHp);
    }

    // 加闪避
    async implAddDodge(p:Player, dDodge) {
        p.addDodge(dDodge);
    }

    // 加攻击
    async implAddPower(p:Player, dPower) {
        p.power[0] += dPower;
    }

    // 获得东西
    async implAddItem(p:Player, e:Elem) {
        if (Utils.checkCatalogues(e.type, "coin"))
            await this.implAddMoney(p, e.cnt);
        else {
            p.addItem(e);
            await p.fireEvent("onGetElemInWorldmap", {e:e});
        }
    }

    // 强化遗物
    async implReinforceRelic(p:Player, r:Relic) {
        r.reinforceLvUp();
    }

    creators = {
        "exit": (sel:WMES, p:Player, ps) => { sel.exit = () => true; return sel; },
        "battle": (sel:WMES, p:Player, ps) => this.exec(async () => await this.startBattle(ps.battleType), sel),
        "-money": (sel:WMES, p:Player, ps) => this.valid(() => p.money >= ps.money, 
            this.exec(async () => await this.implAddMoney(p, -ps.money), sel)),
        "+money": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddMoney(p, ps.money), sel),
        "-allMoney": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddMoney(p, -p.money), sel),
        "-hp": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddHp(p, -ps.hp), sel),
        "+hp": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddHp(p, ps.hp), sel),
        "-hpPrecentage": (sel:WMES, p:Player, ps) => { 
            var hp = Math.ceil(p.maxHp * ps.hpPrecentage / 100);
            ps["hp"] = hp;
            return this.exec(async () => await this.implAddHp(p, -hp), sel);
        },
        "-maxHpPrecentage": (sel:WMES, p:Player, ps) => {
            var maxHp = Math.ceil(p.maxHp * ps.maxHpPrecentage / 100);
            ps["maxHp"] = maxHp;
            return this.exec(async () => await this.implAddHp(p, -maxHp), sel)
        },
        "-maxHp": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddMaxHp(p, -ps.maxHp), sel),
        "+maxHp": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddMaxHp(p, ps.maxHp), sel),
        "+dodge": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddDodge(p, ps.dDodge), sel),
        "+power": (sel:WMES, p:Player, ps) => this.exec(async () => await this.implAddPower(p, ps.dPower), sel),
        "+item": (sel:WMES, p:Player, ps) => this.valid(() => Utils.occupationCompatible(p.occupation, ps.item), 
            this.exec(async () => await this.implAddItem(p, ElemFactory.create(ps.item)), sel)),
        "reinforceRandomRelics": (sel:WMES, p:Player, ps) => this.valid(() => p.getReinfoceableRelics().length > 0, 
            this.exec(async () => {
                var relics = p.getReinfoceableRelics();
                var rs = p.playerRandom.selectN(relics, 2);
                Utils.assert(rs.length > 0, "no relic can be reinforced");
                for (var relic of rs)
                    await this.implAddItem(p, <Relic>ElemFactory.create(relic.type));
        }, sel)),
        "reinfoceRelic": (sel:WMES, p:Player, ps) => this.valid(() => p.getReinfoceableRelics().length > 0, 
            this.exec(async () => {
                var sel = -1;
                var rs = Utils.filter(p.relics, (r:Relic) => r.canReinfoce());
                while (sel < 0) {                    
                    sel = await this.selRelic(rs, "selRelic", ViewUtils.getTipText("selRelic"), ViewUtils.getTipText("makeSureSelRelic"));
                    if (sel >= 0) {
                        var e:Relic = <Relic>p.relics[sel];
                        await this.implReinforceRelic(p, e);
                        break;
                    } else if (sel == -2)
                        break;
                }
        }, sel)),
        "gambling": (sel:WMES, p:Player, ps) => this.valid(() => p.money >= ps.wager,
            this.exec(async () => {
                await this.implAddMoney(p, -ps.wager);

                var nextSelsGroup;
                if (p.playerRandom.next100() < ps.rate) {
                    await this.implAddMoney(p, ps.award);
                    nextSelsGroup = ps.succeedRedirectGroup;
                }
                else
                    nextSelsGroup = ps.failedRedirectGroup;

                if (nextSelsGroup)
                    await this.openEventSelGroup(p, nextSelsGroup);
        }, sel)),
        "+randomItems": (sel:WMES, p:Player, ps) => this.exec(async () => {
            var es = Utils.randomSelectByWeightWithPlayerFilter(p, ps.items, p.playerRandom, ps.randomNum, ps.randomNum+1, true);
            for (var et of es) {
                var e = ElemFactory.create(et);
                delete ps.items[et];
                await this.implAddItem(p, e);
            }
        }, sel),
        "redirectSelGroup": (sel:WMES, p:Player, ps) => this.exec(async () => {
            if (p.isDead())
                sel.exit = () => true;
            else
                await this.openEventSelGroup(p, ps.group);
        }, sel),
        "redirectSelGroup2": (sel:WMES, p:Player, ps) => this.exec(async () => {
            if (p.isDead())
                sel.exit = () => true;
            else
                await this.openEventSelGroup(p, ps.group2);
        }, sel),
        "rob": (sel:WMES, p:Player, ps) => this.exec(async () => {
            var robCfg = GCfg.getRobCfg(ps.rob);
            var robItems = Utils.doRobEvent(p, robCfg, p.playerRandom);
            for (var e of robItems)
                await this.implAddItem(p, ElemFactory.create(e));
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
                    if (n < subSels.length && !p.isDead()) {
                        sel["move2NextSubSel"](n);
                        sel.exit = () => true;
                    } else
                        sel.exit = () => true;
                };
                sel.desc = ss.desc;
            };

            sel["move2NextSubSel"](0);
            
            return sel;
        },
        "toTurnTable": (sel:WMES, p:Player, ps) => this.exec(async () => await this.openTurntable(p.worldmap.cfg.turntable), sel),
        "searchOnCropse": (sel:WMES, p:Player, ps) => {
            var rate = ps.rateArr[0];
            ps.rateArr = Utils.removeAt(ps.rateArr, 0);
            var upDescArr = ps.upDescArr[0];
            ps.upDescArr = Utils.removeAt(ps.upDescArr, 0);
            var title = ps.titleArr[0];
            ps.title = Utils.removeAt(ps.titleArr, 0);
            var desc = ps.descArr[0];
            ps.desc = desc;
            ps.descArr = Utils.removeAt(ps.descArr, 0);

            var hit = p.playerRandom.next100() < rate;
            if (hit) { // 成功就掉落，再进列表
                return this.exec(async () => {
                    var subSel = this.newSel();
                    
                    // 掉落列表是事件过程中一直维护，去掉已经掉落的内容，保留未掉落的内容
                    var items2Drop = ps.items2Drop;
                    var n = p.playerRandom.nextInt(0, items2Drop.length);
                    var itemType = items2Drop[n];
                    ps.items2Drop = Utils.removeAt(items2Drop, n);

                    if (itemType == "+money")
                        await this.implAddMoney(p, ps.money);
                    else
                        await this.implAddItem(p, ElemFactory.create(itemType));

                    subSel = this.creators["searchOnCropse"](subSel, p, ps);
                    subSel.desc = this.genDesc(desc, "searchOnCropse", ps);
                    await this.openSels(p, title, upDescArr, [subSel]);
                }, sel);
            } else { // 失败就战斗
                // items2Drop 里面的东西是剩下还没掉过的
                return this.exec(async () => await this.startBattle(ps.battleType), sel);
            }
        },
    };
}
