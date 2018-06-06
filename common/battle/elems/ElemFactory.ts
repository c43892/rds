// 创建各种元素对象
class ElemFactory {
    static creators = [
        new ItemFactory(),
        new MonsterFactory()
    ];

    // 创建指定类型元素
    private static $$idSeqNo = 1; // 给 $$id 计数
    public static create(type:string, bt:Battle, elemCfg) {
        for (var factory of ElemFactory.creators) {
            if(factory.creators[type]) {
                var e:Elem = factory.creators[type](bt, elemCfg[type]);
                e.type = type;
                e.$$id = type + ":" + (ElemFactory.$$idSeqNo++);
                return e;
            }
        }
    }
}