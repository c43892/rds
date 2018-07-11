
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

    // 创建一组选项
    public createGroup(player:Player, group:string) {
        var sels = GCfg.getWorldMapEventSelGroupsCfg(group);
        var ss = [];
        for (var sel in sels) {
            var func = sels[sel].func
            var ps = sels[sel].ps;
            var s = this.newSel(ps);
            for (var f of func)
                s = this.creators[f](s, player, ps);

            s.refreshDesc = () => {
                var genDesc = !sels[sel].desc;
                var desc = genDesc ? "" : sels[sel].desc;
                if (genDesc) {
                    for (var i = 0; i < func.length; i++) {
                        var d = GCfg.getWorldMapEventSelsDesc(func[i]);
                        desc += (i != func.length - 1) ? (d + ", ") : d;
                    }
                }
                
                for (var p in ps) {
                    var pName = "{"+p+"}";
                    var pValue = ps[p];
                    if (p == "item") pValue = GCfg.getElemAttrsCfg(pValue).name;
                    desc = desc.replace(pName, pValue);
                }

                s.getDesc = () => desc;
            };
            
            s.refreshDesc();
            ss.push(s);
        }

        return ss;
    }

    newSel(ps):WMES {
        var sel = new WMES();
        sel.exec = () => {};
        sel.valid = () => true;
        sel.exit = () => true;
        return sel;
    }

    exec(exec, sel:WMES):WMES {
        var priorExec = sel.exec;
        sel.exec = () => {
            if (priorExec) priorExec();
            exec();
        };
        return sel;
    }

    valid(valid, sel:WMES):WMES {
        var priorValid = sel.valid;
        sel.valid = () => priorValid ? priorValid() && valid() : valid();
        return sel;
    }

    creators = {
        "exit": (sel:WMES, p:Player, ps) => sel.exit = () => true,
        "-money": (sel:WMES, p:Player, ps) => this.exec(() => p.addMoney(-ps.money), sel),
        "+money": (sel:WMES, p:Player, ps) => this.exec(() => p.addMoney(ps.money), sel),
        "-allMoney": (sel:WMES, p:Player, ps) => this.exec(() => p.addMoney(-p.money), sel),
        "-hp": (sel:WMES, p:Player, ps) => this.exec(() => p.addHp(-ps.hp), sel),
        "+hp": (sel:WMES, p:Player, ps) => this.exec(() => p.addHp(ps.hp), sel),
        "-maxHpPrecentage": (sel:WMES, p:Player, ps) => this.exec(() => p.addMaxHp(Math.ceil(-p.maxHp * ps.maxHpPrecentage / 100)), sel),
        "-maxHp": (sel:WMES, p:Player, ps) => this.exec(() => p.addMaxHp(-ps.maxHp), sel),
        "+maxHp": (sel:WMES, p:Player, ps) => this.exec(() => p.addMaxHp(ps.maxHp), sel),
        "+item": (sel:WMES, p:Player, ps) => this.valid(() => Utils.occupationCompatible(p.occupation, ps.item), 
            this.exec(() => {
                var item = ElemFactory.create(ps.item);
                if (item instanceof Prop) p.addProp(item);
                else if (item instanceof Relic) p.addRelic(item);
        }, sel)),
        "reinforceRandomRelics": (sel:WMES, p:Player, ps) => this.valid(() => p.getReinfoceableRelics().length > 0, 
            this.exec(() => {
                var relics = p.getReinfoceableRelics();
                var rs = p.playerRandom.selectN(relics, 2);
                Utils.assert(rs.length > 0, "no relic can be reinforced");
                for (var relic of rs)
                    p.addRelic(ElemFactory.create(relic.type));
        }, sel))
    };
}
