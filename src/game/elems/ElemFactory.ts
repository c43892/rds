
// 创建各种元素对象

class ElemFactory {
    static InitElem(e:Elem, map:Map) {
        e.getBrick = map.getBrickAt(e.pos.x, e.pos.y);
    }

    static creators = {
        ExcapePort: () => new EscapePort(), // 逃跑出口
        NextLevelPort: () => new NextLevelPort(), // 下一关入口
    }

    // 创建指定类型元素
    public static Create(type:string, map:Map) {
        var e = ElemFactory.creators[type]();
        ElemFactory.InitElem(e, map);
        return e;
    }
}