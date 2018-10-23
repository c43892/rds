class ResMgr {

    public static getRes(name:string):any {
        if (window.platform.platformType == "wx1")
            return ResMgr.getResWX(name);
        else 
            return ResMgr.getResNormal(name);
    }

    public static async loadResGroup(group, eventHandler) {
        if (window.platform.platformType == "wx1")
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

    static URLPrefix = "https://rds.wudouwxg.xyz/resource/";
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
                soundTB[it.url] = {name:it.name, url:it.url, type:it.type, retry:0};
            else
                tb[it.url] = {name:it.name, url:it.url, type:it.type, retry:0};
        });

        var total = items.length;
        var loaded = 0;
        var retryTimes = 0;

        // 一般资源 2 线程加载
        RES.setMaxLoadingThread(2);
        while (true) {
            var arr = Utils.values(tb);
            if (arr.length == 0) // 加载完毕
                break;

            Utils.log("loading res " + arr.length + " items(loaded=" + loaded + ", retry=" + retryTimes + ")");
            await ResMgr.loadResItemsWx(arr, (itUrl, name, res) => {
                if (res) {
                    ResMgr.resMap[name] = res;
                    delete tb[itUrl];
                    loaded++;
                    eventHandler.onProgress(loaded, total);
                }
                else if (tb[itUrl])
                    tb[itUrl].retry = retryTimes;
            }, 20000);
            retryTimes++;
        }

        // mp3 单线程加载，不然总是遇到加载 mp3 卡住的问题
        RES.setMaxLoadingThread(1);
        retryTimes = 0;
        while (true) {
            var arr = Utils.values(soundTB);
            if (arr.length == 0) // 加载完毕
                break;

            Utils.log("loading mp3 " + arr.length + " items(loaded=" + loaded + ", retry=" + retryTimes + ")");
            await ResMgr.loadResItemsWx(arr, (itUrl, name, res) => {
                if (res) {
                    ResMgr.resMap[name] = res;
                    delete soundTB[itUrl];
                    loaded++;
                    eventHandler.onProgress(loaded, total);
                }
                else if (soundTB[itUrl])
                    soundTB[itUrl].retry = retryTimes;
            }, 20000);
            retryTimes++;
        }
    }

    static async loadResItemsWx(arr, cb, expiredTime) {
        var cnt = arr.length;
        var tm = {};
        return new Promise((r, _) => {
            arr.forEach((item, i) => {
                let it = item;
                tm[it.url] = 0;
                egret.setTimeout(() => {
                    if (tm[it.url] > 0)
                        return;
                    else
                        tm[it.url] = -1;

                    cb(it.url, it.name, undefined);
                    cnt--;
                    Utils.log("load " + it.url + " timeout");
                    if (cnt == 0)
                        r();
                }, this, expiredTime);

                RES.getResByUrl(ResMgr.URLPrefix + it.url, (res) => {
                    if (tm[it.url] < 0)
                        return;
                    else
                        tm[it.url] = 1;

                    cb(it.url, it.name, res);
                    cnt--;
                    if (cnt == 0)
                        r();
                }, this, it.type);
            });
        });
    }
}