class ElemActiveDesc {
    static elems = {
        "Shield" : {
            "cd": (p:Player, e:Elem) => ElemActiveDesc.getCD(p, e),
        },
        "HpCapsule" : {
            "heal": (p:Player, e:Elem) => ElemActiveDesc.getBuffAddHp(p, e, "heal")
        },
        "Bazooka" : {
            "power": (p:Player, e:Elem) => ElemActiveDesc.getWeaponPower(p, e)
        },
        "RayGun":{
            "power": (p:Player, e:Elem) => ElemActiveDesc.getWeaponPower(p, e)
        },
        "Knife":{
            "power": (p:Player, e:Elem) => ElemActiveDesc.getWeaponPower(p, e)
        },
        "BombAbomination" : {
            "rounds": (p:Player, e:Elem) => e["attackInterval"] ? e["attackInterval"] : e.attrs.selfExplode.cnt
        },
    }
    
    // 获取elem受各因素影响后的cd
    static getCD(p:Player, e:Elem){
        var cd;
        var cdPs = {subType:"resetCD", e:e, dcd:{a:0, b:0, c:0}};
        if(p){
            p.triggerLogicPointSync("onCalcCD", cdPs)
            cd = (e.attrs.cd + cdPs.dcd.b) * (1 + cdPs.dcd.a) + cdPs.dcd.c;
            cd = cd < 0 ? 0 : cd;
        }
        else cd = e.attrs.cd
        return cd;
    }

    // 获取通过BuffAddHp治疗玩家的Elem受各因素影响后对玩家的治疗量
    static getBuffAddHp(p:Player, e:Elem, addType){
        var buff = BuffFactory.create("BuffAddHp", e.attrs.rounds, e.attrs[addType]);
        var dhp = e.attrs[addType];
        var onPlayerHealingPs = {dhp:dhp, source:buff, dhpPs:{a:0, b:0, c:0}}
        if(p){
            p.triggerLogicPointSync("onPlayerHealing", onPlayerHealingPs);
            dhp = (dhp + onPlayerHealingPs.dhpPs.b) * (1 + onPlayerHealingPs.dhpPs.a) + onPlayerHealingPs.dhpPs.c;
        }
        return dhp;
    }

    // 获取武器类Elem在受影响后的攻击力
    static getWeaponPower(p:Player, weapon:Elem){
        var powerABC = BattleUtils.calcWeaponAttackerAttrs(weapon, p).power;
        return powerABC.b * (1 + powerABC.a) + powerABC.c;
    }
}