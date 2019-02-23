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

    canPlayAdsReborn();

    playRewardAds(callback);
    canShare(): boolean;
    shareGame();

    platformType;
    openDataContext;
}

class DefaultPaltform implements Platform {
    wc:WebClient;
    
    adMobReady:boolean = false;
    adMobAppID:string = "ca-app-pub-3940256099942544~3347511713";
    adMobAdID:string = "ca-app-pub-3940256099942544/5224354917";

    iOSLoadLocalStorageDataCallback;
    rewardAdsCompletedCallback;
    async init() {
        if (egret.Capabilities.os == "iOS") {
            egret.ExternalInterface.addCallback("rdsLoadLocalStorageDataCallback", (str) => {
                this.iOSLoadLocalStorageDataCallback(str);
            });
        }

        if (DEBUG && egret.Capabilities.os == "Windows PC") // 开发环境
            this.wc = new WebClient("http://127.0.0.1:81/");
        else {
            this.wc = new WebClient("http://119.23.110.78:81/");

            Utils.log("ads registed callback");

            egret.ExternalInterface.addCallback("notifyAdMobLoaded", (msg) => {
                Utils.log("ads notifyAdMobLoaded");
                this.adMobReady = true;
            });

            egret.ExternalInterface.addCallback("notifyRewardAdCompleted", (msg) => {
                if (this.rewardAdsCompletedCallback)
                    this.rewardAdsCompletedCallback(msg);

                this.rewardAdsCompletedCallback = undefined;
            });

            // 不初始化广告模块
            // egret.ExternalInterface.call("rdsInitAdMob", this.adMobAppID + ";" + this.adMobAdID);
        }

        egret.lifecycle.onPause = () => {
            AudioFactory.Paused = 1;
        };

        egret.lifecycle.onResume = () => {
            AudioFactory.Paused = 0;
        };
    }

    public canPlayAdsReborn() {
        return this.adMobReady && (egret.Capabilities.os == "iOS" || egret.Capabilities.os == "Android");
    }

    public async playRewardAds(callback) {
    // public playRewardAds(callback) {
        if (this.canPlayAdsReborn()) { // egret.Capabilities.os == "iOS" || egret.Capabilities.os == "Android") {
            var promise = new Promise((r, _) => {
                this.rewardAdsCompletedCallback = (msg) => {
                    Utils.log("ads reward callback: " + msg);
                    callback(msg == undefined || msg == "");
                    r();
                };
            });
            this.adMobReady = false;
            egret.ExternalInterface.call("rdsPlayRewardAds", "");
            callback(true);
            return promise;
        } else {
            Utils.log("ads: play reward ads: adMobReady = " + this.adMobReady);
        }
    }

    public getUserID():string {
        var uid = Utils.loadLocalItem("UserID");
        if (!uid) {
            var now = new Date();
            var r = new SRandom(now.getMilliseconds());
            uid = this.platformType + ".uid." + r.nextInt(100000, 1000000) + "_"  + now.toUTCString();
            uid = uid.replace(",", "");
            Utils.saveLocalItem("UserID", uid);
        }

        return uid;
    }

    async getRankInfo() {
        var r = await this.wc.request({
            type: "getRank",
        });

        return r;
    }

    setUserCloudStorage(key:string, value) {
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
                // Utils.pt((new Date()).toLocaleString('en-GB', { timeZone: 'UTC' }) + ":" + str + ":ex:loadstorage:", exMsg);
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

if (!window.platform) {
    window.platform = new DefaultPaltform();
}

declare let platform: Platform;
declare interface Window {
    platform: Platform
}
