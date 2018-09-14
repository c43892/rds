class ResMgr {

    // static resMap = {};
    // public static getRes(name:string):any {
    //     return ResMgr.resMap["name"];
    // }

    // public static URLPrefix = "http://119.23.110.78/resource/";
    // public static async loadResGroup(group, eventHandler) {
    //     var items = RES.getGroupByName(group);
    //     var finished = 0;
    //     return new Promise<void>((r, _) => {
    //         items.forEach((it, i) => {
    //             RES.getResByUrl(ResMgr.URLPrefix + it.url, (res) => {
    //                 finished++;

    //                 if (eventHandler)
    //                     eventHandler.onProgress(finished, items.length);

    //                 if (finished == items.length)
    //                     r();
    //             }, this, it.type);
    //         });
    //     });
    // }

    public static getRes(name:string):any {
        return RES.getRes(name);
    }

    public static async loadResGroup(group, eventHandler) {
        await RES.loadGroup(group, 0, eventHandler);
    }
}