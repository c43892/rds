
// 创建各种元素对象

class ElemFactory {
    static InitElem(e:Elem, map:Map) {
        e.getBrick = () => map.getBrickAt(e.pos.x, e.pos.y);
    }

    // 创建指定类型元素
    public static create(type:string, map:Map) {
        var creators = {};
        creators["EscapePort"] = () => new EscapePort(); // 逃跑出口
        creators["NextLevelPort"] = () => new NextLevelPort(); // 下一关入口
        creators["BigHpPortion"] = () => new HpPotion(10); // 大红药
        
        var e = creators[type]();
        ElemFactory.InitElem(e, map);
        return e;
    }
}