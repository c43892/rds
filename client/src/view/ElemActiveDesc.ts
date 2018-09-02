class ElemActiveDesc {
    player:Player;

    constructor(p:Player){
        this.player = p;
    }
    
    public elems = {
        "Shield" : {
            "cd": (e:Elem) => this.getCD(e),
        },
        "HpCapsule" : {
            "heal": (e:Elem) => this.getHealPlayer(e, "heal"),
        }
    }
    
    // 获取elem受各因素影响后的cd
    getCD(e:Elem){
        var cd;
        var cdPs = {subType:"resetCD", e:e, dcd:{a:0, b:0, c:0}};
        if(this.player){
            this.player.triggerLogicPointSync("onCalcCD", cdPs)
            cd = (e.attrs.cd + cdPs.dcd.b) * (1 + cdPs.dcd.a) + cdPs.dcd.c;
            cd = cd < 0 ? 0 : cd;
        }
        else cd = e.attrs.cd
        return cd;
    }

    getHealPlayer(e:Elem, addType){
        var buff = BuffFactory.create("BuffAddHp", e.attrs.rounds, e.attrs[addType]);
        var dhp = e.attrs[addType];
        var onPlayerHealingPs = {dhp:dhp, source:buff, dhpPs:{a:0, b:0, c:0}}
        if(this.player){
            this.player.triggerLogicPointSync("onPlayerHealing", onPlayerHealingPs);
            dhp = (dhp + onPlayerHealingPs.dhpPs.b) * (1 + onPlayerHealingPs.dhpPs.a) + onPlayerHealingPs.dhpPs.c;
        }
        return dhp;
    }

    getPowerOnAttack(e:Elem){
        var attackerAttrs = e.getAttrsAsAttacker;
        
    }
}