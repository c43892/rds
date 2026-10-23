/** 
 * 平台数据接口。
 * 由于每款游戏通常需要发布到多个平台上，所以提取出一个统一的接口用于开发者获取平台数据信息
 * 推荐开发者通过这种方式封装平台逻辑，以保证整体结构的稳定
 * 由于不同平台的接口形式各有不同，白鹭推荐开发者将所有接口封装为基于 Promise 的异步形式
 */
declare interface Platform {

    init();
    setUserCloudStorage(key, value);
    getUserLocalStorage();    
    setUserLocalStorage(data);
    getRankInfo();
    getUserID():string;

    // canPlayAdsReborn();
    // playRewardAds(callback);
    canShare(): boolean;
    shareGame();

    platformType;
    openDataContext;
    onBuyResult;
}

class DefaultPaltform implements Platform {
    wc:WebClient;
    private offlineIOS = (<any>window).Capacitor?.getPlatform?.() === "ios";
    
    // adMobReady:boolean = false;
    // adMobAppID:string = "ca-app-pub-3940256099942544~3347511713"; // google test
    // adMobAdID:string = "ca-app-pub-3940256099942544/5224354917"; // google test
    // adMobAppID:string = "ca-app-pub-1800218346925652~6940599097";
    // adMobAdID:string = "ca-app-pub-1800218346925652/3739720681";

    iOSLoadLocalStorageDataCallback;
    onBuyResult;
    // rewardAdsCompletedCallback;
    async init() {
        if (egret.Capabilities.os == "iOS") {
            egret.ExternalInterface.addCallback("rdsLoadLocalStorageDataCallback", (str) => {
                this.iOSLoadLocalStorageDataCallback(str);
            });

            egret.ExternalInterface.addCallback("notifyBuyResult", (str) => {
                if(this.onBuyResult)
                    this.onBuyResult(str);
            })
        }

        if (this.offlineIOS) {
            // iOS gameplay and saves are local. Never initialize the retired
            // telemetry / leaderboard server for an App Store build.
        } else if (DEBUG && egret.Capabilities.os == "Windows PC") // 开发环境
            this.wc = new WebClient("http://127.0.0.1:81/");
        else {
            this.wc = new WebClient("http://119.23.110.78:81/");

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
        }

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

    async getRankInfo() {
        if (this.offlineIOS) return undefined;
        var r = await this.wc.request({
            type: "getRank",
        });

        return r;
    }

    setUserCloudStorage(key:string, value) {
        if (this.offlineIOS) return;
        var uid = this.getUserID();
        this.wc.send({
            type: "setUserCloudData",
            uid: uid,
            key: key,
            value: value
        });
    }

    async getUserLocalStorage() {
        if (egret.Capabilities.os == "iOS") {
            return new Promise((r, _) => {
                this.iOSLoadLocalStorageDataCallback = (str) => {
                    try {
                        var byteArray = new egret.ByteArray(egret.Base64Util.decode(str));
                        str = byteArray.readUTF();
                        var data = str ? JSON.parse(str) : {};
                        r(data);
                    } catch (ex) {
                        r({});
                    }
                };

                egret.ExternalInterface.call("rdsLoadLocalStorageData", "");
            });
        } else {            
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
    }

    setUserLocalStorage(data) {
        var str = JSON.stringify(data);
        var byteArray = new egret.ByteArray();
        byteArray.writeUTF(str);
        str = egret.Base64Util.encode(byteArray.buffer);
        if (egret.Capabilities.os == "iOS") {
            egret.ExternalInterface.call("rdsSaveLocalStorageData", str);
        } else 
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
// iOS 原生版本使用 StoreKit 2；浏览器预览保留模拟购买。
// 其他原生平台未接商店时拒绝购买，不使用模拟解锁。
class IapService {
    // 角色 -> 商店商品ID(在 App Store Connect / Google Play Console 里配置成
    // 同名的"非消耗型"商品)。护士是免费默认角色,不在此表。
    static products: { [occ: string]: { id: string, priceUsd: number } } = {
        "Rogue":          { id: "unlock_rogue",          priceUsd: 0.99 },
        "Horticulturist": { id: "Horticulturist", priceUsd: 0.99 },
    };

    // mock 模式:浏览器预览/未接真实商店时为 true —— purchase() 直接模拟成功,
    // 便于测试。真机上架构建时改为 false 走真实下单+回执校验。
    // Native apps must never grant paid unlocks through simulated purchases.
    static mockMode = !(<any>window).Capacitor?.isNativePlatform?.();

    static productId(occ: string): string {
        var p = IapService.products[occ];
        return p ? p.id : "";
    }
    private static nativeStore(): any {
        var cap = (<any>window).Capacitor;
        if (cap?.getPlatform?.() !== "ios") return undefined;
        return cap.Plugins.RDSStore || cap.registerPlugin("RDSStore");
    }
    static async priceText(occ: string): Promise<string> {
        var p = IapService.products[occ];
        if (!IapService.mockMode) {
            var store = IapService.nativeStore();
            if (!store || !p) throw new Error("Store unavailable");
            var catalog = await store.products();
            var product = catalog.products.find((item) => item.id === p.id);
            if (!product) throw new Error("Product unavailable");
            return product.price;
        }
        return p ? "$" + p.priceUsd.toFixed(2) : "";
    }
    static isPaidOccupation(occ: string): boolean {
        return !!IapService.products[occ];
    }

    // 发起购买。返回 "ok" | "cancel" | "pending" | "error"。
    // 调用方在拿到 "ok"/"restored" 后才执行永久解锁。
    static async purchase(occ: string): Promise<string> {
        var pid = IapService.productId(occ);
        if (!pid) return "error";
        if (IapService.mockMode) {
            // —— mock:模拟商店处理耗时后成功。真实接入时替换本分支。——
            await Utils.delay(400);
            return "ok";
        }
        try {
            var store = IapService.nativeStore();
            if (store) return (await store.purchase({ productId: pid })).status;
        } catch (e) { console.error("App Store purchase failed", e); }
        return "error";
    }

    // 恢复购买(重装/换机后找回已购角色)。返回已拥有的角色名列表。
    // mock 返回空;真实接入查询商店已购项目并映射回角色名。
    static async restore(): Promise<string[]> {
        if (IapService.mockMode) return [];
        var store = IapService.nativeStore();
        if (!store) throw new Error("Store unavailable");
        var owned = (await store.restore({ sync: true })).productIds;
        return Object.keys(IapService.products).filter((occ) =>
            owned.indexOf(IapService.products[occ].id) >= 0);
    }

    static async finish(occ: string): Promise<void> {
        if (IapService.mockMode) return;
        var store = IapService.nativeStore();
        if (store) {
            try { await store.finish({ productId: IapService.productId(occ) }); }
            catch (e) { console.error("Transaction finish will be retried on restore", e); }
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
