class ResMgr {

    public static getRes(name:string):any {
        if (window.platform.platformType == "wx")
            return ResMgr.getResWX(name);
        else 
            return ResMgr.getResNormal(name);
    }

    public static async loadResGroup(group, eventHandler) {
        if (window.platform.platformType == "wx")
            await ResMgr.loadResGroupWX(group, eventHandler);
        else 
            await ResMgr.loadResGroupNormal(group, eventHandler);
    }

    // for non-weixin game

    static getResNormal(name:string):any {
        return RES.getRes(name);
    }

    static async loadResGroupNormal(group, eventHandler) {
        await RES.loadGroup(group, 0, eventHandler);
    }

    // for weixin game

    static URLPrefix = "https://rds.wudouwxg.xyz/ver029/resource/";
    static resMap = {};
    
    static getResWX(name:string):any {
        return ResMgr.resMap[name];
    }

    static async loadResGroupWX(group, eventHandler) {
        var items = RES.getGroupByName(group);
        var tb = {};
        var soundTB = {};
        items.forEach((it, _) => {
            if (it.type == "sound")
                soundTB[it.url] = {name:it.name, url:it.url, type:it.type};
            else
                tb[it.url] = {name:it.name, url:it.url, type:it.type};
        });

        var total = items.length;
        var loaded = 0;
        var retryTimes = 0;

        // 一般资源 2 线程加载
        RES.setMaxLoadingThread(2);
        var arr = Utils.values(tb);
        while (arr.length > 0) {
            var failed = [];
            await ResMgr.loadResItemsWx(arr, (itUrl, name, res) => {
                if (res) {
                    ResMgr.resMap[name] = res;
                    delete tb[itUrl];
                    loaded++;
                    eventHandler.onProgress(loaded, total);
                }
            }, failed);
            arr = failed;
            retryTimes++;
            Utils.log("loading res " + arr.length + " items(loaded=" + loaded + ", retry=" + retryTimes + ")");
        }

        // mp3 单线程加载，不然总是遇到加载 mp3 卡住的问题
        RES.setMaxLoadingThread(1);
        retryTimes = 0;
        var arr = Utils.values(soundTB);
        while (arr.length > 0) {
            var failed = [];
            await ResMgr.loadResItemsWx(arr, (itUrl, name, res) => {
                if (res) {
                    ResMgr.resMap[name] = res;
                    delete soundTB[itUrl];
                    loaded++;
                    eventHandler.onProgress(loaded, total);
                }
            }, failed);
            arr = failed;
            retryTimes++;
            Utils.log("loading mp3 " + arr.length + " items(loaded=" + loaded + ", retry=" + retryTimes + ")");
        }
    }

    static async loadResItemsWx(arr, cb, failed) {
        var cnt = arr.length;
        var tm = {};
        return new Promise((r, _) => {
            arr.forEach((item, i) => {
                let it = item;
                // RES.getResAsync(it.name, (res) => {
                //     if (!res) {
                        RES.getResByUrl(ResMgr.URLPrefix + it.url + "?ver=" + Version.currentVersion.toString(), (res) => {
                            if (!res) {
                                failed.push(res);
                                cb(it.url, it.name, res);
                                cnt--;
                                if (cnt == 0)
                                    r();
                            } else {
                                cb(it.url, it.name, res);
                                cnt--;
                                if (cnt == 0)
                                    r();
                            }
                        }, this, it.type);
                //     } else {
                //         cb(it.url, it.name, res);
                //         cnt--;
                //         if (cnt == 0)
                //             r();
                //     }
                // }, this);
            });
        });
    }
}