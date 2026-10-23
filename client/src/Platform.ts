/**
 * 平台数据接口。
 * 由于每款游戏通常需要发布到多个平台上，所以提取出一个统一的接口用于开发者获取平台数据信息
 * 推荐开发者通过这种方式封装平台逻辑，以保证整体结构的稳定
 * 由于不同平台的接口形式各有不同，白鹭推荐开发者将所有接口封装为基于 Promise 的异步形式
 */
declare interface Platform {

    init();
    getUserLocalStorage();
    setUserLocalStorage(data);
    getUserID():string;

    // canPlayAdsReborn();
    // playRewardAds(callback);
    canShare(): boolean;
    shareGame();

    platformType;
    openDataContext;
}

// 浏览器 / Capacitor 原生包(iOS、Android)通用:存档统一走 WebView 的 localStorage。
// 排行榜/打点服务器已下线,游戏不向任何服务器上传数据。
class DefaultPaltform implements Platform {
    // adMobReady:boolean = false;
    // adMobAppID:string = "ca-app-pub-3940256099942544~3347511713"; // google test
    // adMobAdID:string = "ca-app-pub-3940256099942544/5224354917"; // google test
    // adMobAppID:string = "ca-app-pub-1800218346925652~6940599097";
    // adMobAdID:string = "ca-app-pub-1800218346925652/3739720681";

    // rewardAdsCompletedCallback;
    async init() {
        // Utils.log("ads registed callback");

        // egret.ExternalInterface.addCallback("notifyAdMobLoaded", (msg) => {
        //     Utils.log("ads notifyAdMobLoaded");
        //     this.adMobReady = true;
        // });

        // egret.ExternalInterface.addCallback("notifyRewardAdCompleted", (msg) => {
        //     if (this.rewardAdsCompletedCallback)
        //         this.rewardAdsCompletedCallback(msg);

        //     this.rewardAdsCompletedCallback = undefined;
        // });

        // // 初始化广告模块
        // if (egret.Capabilities.os != "iOS")
        //     egret.ExternalInterface.call("rdsInitAdMob", this.adMobAppID + ";" + this.adMobAdID);

        egret.lifecycle.onPause = () => {
            AudioFactory.Paused = 1;
        };

        egret.lifecycle.onResume = () => {
            AudioFactory.Paused = 0;
        };
    }

    // public canPlayAdsReborn() {
    //     return egret.Capabilities.os == "iOS" || (this.adMobReady || egret.Capabilities.os == "Android");
    // }

    // public async playRewardAds(callback) {
    //     if (this.canPlayAdsReborn()) { // egret.Capabilities.os == "iOS" || egret.Capabilities.os == "Android") {
    //         var promise = new Promise((r, _) => {
    //             this.rewardAdsCompletedCallback = (msg) => {
    //                 Utils.log("ads reward callback: " + msg);
    //                 callback(msg == undefined || msg == "");
    //                 r();
    //             };
    //         });
    //         this.adMobReady = false;
    //         egret.ExternalInterface.call("rdsPlayRewardAds", "");
    //         callback(true);
    //         return promise;
    //     } else {
    //         Utils.log("ads: play reward ads: adMobReady = " + this.adMobReady);
    //     }
    // }

    public getUserID():string {
        var uid:string = Utils.loadLocalItem("UserID");
        if (!uid || uid.substring(0, 4) != "uid.") {
            var r = new SRandom((new Date()).getMilliseconds());
            uid = "uid." + Utils.nowTimeStr() + "." + this.platformType + "."  + r.nextInt(100000, 1000000);
            uid = uid.replace(",", "");
            Utils.saveLocalItem("UserID", uid);
        }

        return uid;
    }

    async getUserLocalStorage() {
        try {
            var str = egret.localStorage.getItem("localStorageData");
            Utils.log("load str: " + str.length);
            if (str) {
                var byteArray = new egret.ByteArray(egret.Base64Util.decode(str));
                str = byteArray.readUTF();
            }
            await Utils.delay(1);
            var data = str ? JSON.parse(str) : {};
            return data;
        } catch (ex) {
            var exMsg = "load localstorage exception: " + str + ":" + ex.toString();
            Utils.log(exMsg);
            egret.localStorage.setItem("localStorageData", "");
            return {};
        }
    }

    setUserLocalStorage(data) {
        var str = JSON.stringify(data);
        var byteArray = new egret.ByteArray();
        byteArray.writeUTF(str);
        str = egret.Base64Util.encode(byteArray.buffer);
        egret.localStorage.setItem("localStorageData", str);
    }

    canShare(): boolean { return false; }
    shareGame() {}

    platformType = egret.Capabilities.os;
    openDataContext = {
        createDisplayObject: () => {}
    }
}

// ========================= 内购(IAP)服务 =========================
// 角色付费永久解锁(非消耗型商品)。
// - iOS:原生 StoreKit 2 插件 RdsIap(rds-pixi/ios/App/App/RdsIapPlugin.swift),经 Capacitor 桥调用。
// - 浏览器开发预览(DEBUG 且没有原生插件):mock,purchase() 直接成功,便于测试解锁流程。
// - 其它情况(如还没接 Play Billing 的 Android 包):购买返回 "error",不会白送。
class IapService {
    // 角色 -> 商店商品ID(在 App Store Connect 里配置成同名的"非消耗型"商品)。
    // priceUsd 只用于浏览器 mock 显示;真机显示商店返回的本地化价格。护士是免费默认角色,不在此表。
    static products: { [occ: string]: { id: string, priceUsd: number } } = {
        "Rogue":          { id: "unlock_rogue",          priceUsd: 0.99 },
        "Horticulturist": { id: "unlock_horticulturist", priceUsd: 0.99 },
    };

    // 商品ID -> 商店返回的本地化价格文本(如 "$0.99"、"¥6.00"),init() 时填充
    static storePrices: { [productId: string]: string } = {};

    // 有角色被(重新)永久解锁时回调,界面据此刷新(如"询问购买"被家长批准时选角界面正开着)
    static onGranted: (occ: string) => void;

    // 原生内购插件;浏览器或未注册插件的平台为 undefined
    static native(): any {
        var cap = (<any>window).Capacitor;
        return cap && cap.Plugins ? cap.Plugins.RdsIap : undefined;
    }

    static get mockMode(): boolean {
        return !IapService.native() && DEBUG;
    }

    static productId(occ: string): string {
        var p = IapService.products[occ];
        return p ? p.id : "";
    }
    static occOfProduct(pid: string): string {
        for (var occ in IapService.products)
            if (IapService.products[occ].id == pid) return occ;
        return undefined;
    }
    static priceText(occ: string): string {
        var p = IapService.products[occ];
        if (!p) return "";
        if (IapService.storePrices[p.id]) return IapService.storePrices[p.id];
        // 真机没拿到商店价格时不显示(付款弹窗里商店会显示真实价格),绝不显示写死的美元价
        return IapService.mockMode ? "$" + p.priceUsd.toFixed(2) : "";
    }
    static isPaidOccupation(occ: string): boolean {
        return !!IapService.products[occ];
    }

    // 启动时(本地存档加载之后)调用:监听商店推送的交易、拉取本地化价格,
    // 并按 App Store 当前权益静默补发已购角色(重装/换机/中断后才完成的购买)。不会弹 Apple ID 登录。
    static async init() {
        var n = IapService.native();
        if (!n) return;
        try {
            n.addListener("transactionUpdated", (t) => IapService.grant(t && t.productId));
        } catch (ex) { Utils.log("iap: addListener failed: " + ex); }

        var ids = Object.keys(IapService.products).map((occ) => IapService.products[occ].id);
        try {
            var r = await n.getProducts({ productIds: ids });
            for (var p of (r && r.products) || [])
                IapService.storePrices[p.id] = p.displayPrice;
        } catch (ex) { Utils.log("iap: getProducts failed: " + ex); }

        try {
            var owned = await n.getEntitlements();
            for (var pid of (owned && owned.productIds) || [])
                IapService.grant(pid);
        } catch (ex) { Utils.log("iap: getEntitlements failed: " + ex); }
    }

    // 发放商品对应角色的永久解锁,返回是否为新解锁
    static grant(pid: string): boolean {
        var occ = IapService.occOfProduct(pid);
        if (!occ || Utils.isUnlockedOccupationForever(occ)) return false;
        Utils.unlockOccupationForever(occ);
        if (IapService.onGranted) IapService.onGranted(occ);
        return true;
    }

    // 发起购买。返回 "ok" | "cancel" | "pending" | "error"。
    // "pending" 是"询问购买"等待家长批准,批准后经 transactionUpdated 到账。
    // 调用方拿到 "ok" 后才执行永久解锁。
    static async purchase(occ: string): Promise<string> {
        var pid = IapService.productId(occ);
        if (!pid) return "error";
        var n = IapService.native();
        if (n) {
            try {
                var r = await n.purchase({ productId: pid });
                return r && r.result ? r.result : "error";
            } catch (ex) {
                Utils.log("iap: purchase failed: " + ex);
                return "error";
            }
        }
        if (IapService.mockMode) {
            await Utils.delay(400);
            return "ok";
        }
        return "error";
    }

    // 恢复购买(用户主动点击;iOS 会与 App Store 同步,可能弹出 Apple ID 登录)。
    // 返回该账号已拥有的角色名列表。
    static async restore(): Promise<string[]> {
        var n = IapService.native();
        if (!n) return [];
        try {
            var r = await n.restore();
            var occs = [];
            for (var pid of (r && r.productIds) || []) {
                var occ = IapService.occOfProduct(pid);
                if (occ) occs.push(occ);
            }
            return occs;
        } catch (ex) {
            Utils.log("iap: restore failed: " + ex);
            return [];
        }
    }
}

if (!window.platform) {
    window.platform = new DefaultPaltform();
}

declare let platform: Platform;
declare interface Window {
    platform: Platform
}
