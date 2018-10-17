class ResMgr {

    public static getRes(name:string):any {
        if (window.platform.platformType == "wx")
            return ResMgr.getResWX(name);
        else 
            return ResMgr.getResNormal(name);
    }

    public static async loadResGroup(group, eventHandler) {
        if (window.platform.platformType == "wx")
            return ResMgr.loadResGroupWX(group, eventHandler);
        else 
            return ResMgr.loadResGroupNormal(group, eventHandler);
    }

    // for non-weixin game

    static getResNormal(name:string):any {
        return RES.getRes(name);
    }

    static async loadResGroupNormal(group, eventHandler) {
        await RES.loadGroup(group, 0, eventHandler);
    }

    // for weixin game

    static URLPrefix = "https://rds.wudouwxg.xyz/resource/";
    static resMap = {};
    
    static getResWX(name:string):any {
        return ResMgr.resMap[name];
    }

    static async loadResGroupWX(group, eventHandler) {
        var items = RES.getGroupByName(group);
        var finished = 0;
        return new Promise<void>((r, _) => {
            items.forEach((it, i) => {
                RES.getResByUrl(ResMgr.URLPrefix + it.url, (res) => {                    
                    finished++;
                    ResMgr.resMap[it.name] = res;

                    if (DEBUG)
                        Utils.log("load " + it.url + (res ? "ok" : "failed"));

                    if (eventHandler)
                        eventHandler.onProgress(finished, items.length);

                    if (finished == items.length)
                        r();
                }, this, it.type);
            });
        });
    }
}