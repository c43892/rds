class ElemActiveDesc {
    static elems = {
        "Shield" : {
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e),
        },
        "HpPotion" : {
            "heal": (p:Player, e:Elem) => ElemActiveDesc.getBuffAddHp(p, e, "heal"),
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e)
        },
        "Bazooka" : {
            "power": (p:Player, e:Elem) => ElemActiveDesc.getWeaponPower(p, e),
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e)
        },
        "RayGun":{
            "power": (p:Player, e:Elem) => ElemActiveDesc.getWeaponPower(p, e),
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e)
        },
        "SuperPotion":{
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e),
            "immunizeCnt-1": (p:Player, e:Elem) => e.attrs["immunizeCnt"] - 1
        },
        "StrengthPotion":{
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e),
            "enhanceCnt-1": (p:Player, e:Elem) => e.attrs["enhanceCnt"] - 1
        },
        "IceGun":{
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e)
        },
        "CandyCannon":{
            "elemCD": (p:Player, e:Elem) => ElemActiveDesc.getElemCD(p, e)
        },
        "Knife":{
            "power": (p:Player, e:Elem) => ElemActiveDesc.getWeaponPower(p, e)
        },
        "EconomyMagazine" : {
            "money": (p:Player, e:Elem) => GCfg.getElemAttrsOfLevel("CoinsSmall", p.currentTotalStorey()).cnt
        },
        "BombAbomination" : {
            "rounds": (p:Player, e:Elem) => e["attackInterval"] ? e["attackInterval"] : e.attrs.selfExplode.cnt
        },
        "Vampire": {
            "percent": (p:Player, e:Elem) => e.attrs.suckBlood.percent
        }
    }
    
    // 获取elem受各因素影响后的cd
    static getElemCD(p:Player, e:Elem){
        var elemCD;
        var cdPs = {subType:"resetCD", e:e, dcd:{a:0, b:0, c:0}};
        if(p){
            p.triggerLogicPointSync("onCalcCD", cdPs)
            elemCD = (e.attrs.cd + cdPs.dcd.b) * (1 + cdPs.dcd.a) + cdPs.dcd.c;
            elemCD = elemCD < 0 ? 0 : elemCD;
        }
        else elemCD = e.attrs.cd;
        return elemCD;
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