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

    canShare(): boolean;
    shareGame();

    platformType;
    openDataContext;
}

class DefaultPaltform implements Platform {
    wc:WebClient;
    
    iOSLoadLocalStorageDataCallback;
    async init() {
        if (egret.Capabilities.os == "iOS") {
            window["ExternalInterface"].addCallback("rdsLoadLocalStorageDataCallback", (str) => {
                this.iOSLoadLocalStorageDataCallback(str);
            });
        }

        if (DEBUG && egret.Capabilities.os == "Windows PC") // 开发环境
            this.wc = new WebClient("http://127.0.0.1:81/");
        else
            this.wc = new WebClient("http://119.23.110.78:81/");
    }

    get UserID():string {
        var uid = Utils.loadLocalItem("UserID");
        if (!uid) {
            var now = new Date();
            var r = new SRandom(now.getMilliseconds());
            uid = "uid_" + r.nextInt(100000, 1000000) + "_"  + now.toUTCString();
            Utils.saveLocalItem("UserID", uid);
        }

        return uid;
    }

    setUserCloudStorage(key:string, value) {
        var uid = this.UserID;
        this.wc.request({
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

                window["ExternalInterface"].call("rdsLoadLocalStorageData");
            });
        } else {
            var str = egret.localStorage.getItem("localStorageData");
            if (str) {
                var byteArray = new egret.ByteArray(egret.Base64Util.decode(str));
                str = byteArray.readUTF();
            }
            await Utils.delay(1);
            try {
                var data = str ? JSON.parse(str) : {};
                return data;
            } catch (ex) {
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
            window["ExternalInterface"].call("rdsSaveLocalStorageData", str);
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
