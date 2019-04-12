// 用于处理各逻辑点所有职业等级相关的加强效果
class OccupationEffectMgr {
    // 影响技能的属性
    static effectOnCreateRelic(type, attrs){
        if (OccupationEffectMgr.changeRelicAttrs[type])
            attrs = OccupationEffectMgr.changeRelicAttrs[type](attrs);

        return attrs;
    }

    static changeRelicAttrs = {
        "Endurance": (attrs) => {
            var nurseLevel:number = Utils.getOccupationLevelAndExp("Nurse").level;            
            switch (nurseLevel){
                case 2:{
                    attrs.dMaxHp = 6;
                    attrs.reinforce = [{"dMaxHp":12}, {"dMaxHp":18}, {"dMaxHp":24}, {"dMaxHp":30}]
                    break;
                }
                case 3:{
                    attrs.dMaxHp = 7;
                    attrs.reinforce = [{"dMaxHp":14}, {"dMaxHp":21}, {"dMaxHp":28}, {"dMaxHp":35}]
                    break;
                }
                case 4:{
                    attrs.dMaxHp = 8;
                    attrs.reinforce = [{"dMaxHp":16}, {"dMaxHp":24}, {"dMaxHp":32}, {"dMaxHp":40}]
                    break;
                }
                case -1:{
                    attrs.dMaxHp = 9;
                    attrs.reinforce = [{"dMaxHp":18}, {"dMaxHp":27}, {"dMaxHp":36}, {"dMaxHp":45}]
                    break;
                }
            }
        return attrs;
        },

        "Agile": (attrs) => {
            var rogueLevel:number = Utils.getOccupationLevelAndExp("Rogue").level;
            switch (rogueLevel){
                case 2:{
                    attrs.dDodge = 5;
                    attrs.reinforce = [{"dDodge":10}, {"dDodge":15}, {"dDodge":20}, {"dDodge":25}]
                    break;
                }
                case 3:{
                    attrs.dDodge = 6;
                    attrs.reinforce = [{"dDodge":12}, {"dDodge":18}, {"dDodge":24}, {"dDodge":30}]
                    break;
                }
                case 4:{
                    attrs.dDodge = 7;
                    attrs.reinforce = [{"dDodge":14}, {"dDodge":21}, {"dDodge":28}, {"dDodge":35}]
                    break;
                }
                case -1:{
                    attrs.dDodge = 8;
                    attrs.reinforce = [{"dDodge":16}, {"dDodge":24}, {"dDodge":32}, {"dDodge":40}]
                    break;
                }
            }
        return attrs;
        }
    }

    static effectOnCreatePlayer(p:Player){
        for (var occFunc of OccupationEffectMgr.addPropAndRelic)
            p = occFunc(p);
        
        return p;
    }

    static addPropAndRelic = [
        // 护士妹妹
        (p:Player) => { 
            var nurseLevel:number = Utils.getOccupationLevelAndExp("Nurse").level;
            switch (nurseLevel){
                case 1:{
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    break;
                }
                case 2:{
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    break;
                }
                case 3:{
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    break;
                }
                case 4:{
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    break;
                }
                case -1:{
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    p.addItem(<Prop>ElemFactory.create("HpPotion"));
                    break;
                }
            }
            return p;
        },

        // 强盗
        (p:Player) => {
            var rogueLevel:number = Utils.getOccupationLevelAndExp("Rogue").level;
            switch (rogueLevel){
                case 1:{
                    p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    break;
                }
                case 2:{
                    p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    if ((new SRandom()).next100() < 25)
                        p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    break;
                }
                case 3:{
                    p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    if ((new SRandom()).next100() < 50)
                        p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    break;
                }
                case 4:{
                    p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    if ((new SRandom()).next100() < 75)
                        p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    break;
                }
                case -1:{
                    p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    if ((new SRandom()).next100() < 100)
                        p.addRelic(<Relic>ElemFactory.create("Fierce"));
                    break;
                }
            }
            return p;
        }
    ]
}