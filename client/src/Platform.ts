/** 
 * 平台数据接口。
 * 由于每款游戏通常需要发布到多个平台上，所以提取出一个统一的接口用于开发者获取平台数据信息
 * 推荐开发者通过这种方式封装平台逻辑，以保证整体结构的稳定
 * 由于不同平台的接口形式各有不同，白鹭推荐开发者将所有接口封装为基于 Promise 的异步形式
 */
declare interface Platform {

    init();
    setUserCloudStorage(data);
    getUserLocalStorage();    
    setUserLocalStorage(data);

    canShare(): boolean;
    shareGame();

    platformType;
    openDataContext;
}

class DefaultPaltform implements Platform {
    public wc:WebClient;
    
    async init() {
    }

    setUserCloudStorage(data) {
        // var uid = Utils.loadLocalItem("UserID");
        // var score = data.score;
        // var nickName = data.nickName;
        // this.wc.request({
        //     type: "SetUserInfo",
        //     uid: uid ? uid : "",
        //     nickName: nickName ? nickName : "",
        //     score: score ? score : 0
        // }).then((r) => {
        //     if (!r.ok) return;
        //     uid = r.usr.uid;
        //     var nickName = r.usr.nickName;
        //     Utils.saveLocalItem("UserID", uid);
        //     Utils.saveLocalItem("UserNickName", nickName);
        // });
    }

    async getUserLocalStorage() {
        if (egret.Capabilities.os == "iOS") {
            return new Promise((r, _) => {
                window["ExternalInterface"].addCallback("rdsLoadLocalStorageCallback", (str) => {
                    var data = str ? JSON.parse(str) : {};
                    r(data);
                });

                window["ExternalInterface"].call("rdsLoadLocalStorageFile");
            });
        } else {
            var str = egret.localStorage.getItem("localStorageData");
            await Utils.delay(1);
            return str ? JSON.parse(str) : {};
        }
    }

    setUserLocalStorage(data) {
        var str = JSON.stringify(data);
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





