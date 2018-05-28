// 创建各种元素对象
class ElemFactory {

    static InitElem(e:Elem, map:Map) {
        e.getBrick = () => map.getBrickAt(e.pos.x, e.pos.y);
    }
    
    static creators = [
        new ItemFactory(),
        new MonsterFactory()
    ];

    // 创建指定类型元素
    public static create(type:string, map:Map, elemCfg) {
        for (var factory of ElemFactory.creators) {
            if(factory.creators[type]) {
                var e = factory.creators[type](elemCfg[type]);
                e.type = type;
                ElemFactory.InitElem(e, map);
                return e;
            }
        }
    }

    
}