/** 
 * 平台数据接口。
 * 由于每款游戏通常需要发布到多个平台上，所以提取出一个统一的接口用于开发者获取平台数据信息
 * 推荐开发者通过这种方式封装平台逻辑，以保证整体结构的稳定
 * 由于不同平台的接口形式各有不同，白鹭推荐开发者将所有接口封装为基于 Promise 的异步形式
 */
declare interface Platform {

    init();
    login(): Promise<any>;
    setUserCloudStorage(data);

    canShare(): boolean;
    shareGame();

    platformType;
    openDataContext;
}

class DebugPlatform implements Platform {
    public wc:WebClient;
    
    init() {}

    async login() {
        var uid = Utils.$$loadItem("UserID");
        var r = await this.wc.request({
            type: "GetRank",
            uid: uid ? uid : ""
        });

        if (r.ok) {
            uid = r.usr.uid;
            var nickName = r.usr.nickName;
            Utils.$$saveItem("UserID", uid);
            Utils.$$saveItem("UserNickName", nickName);
            return {ok:true, usr:r.usr, rank:r.rank.usrs};
        }
        else
            return {ok:false};
    }

    setUserCloudStorage(data) {
        var uid = Utils.$$loadItem("UserID");
        var score = data.score;
        var nickName = data.nickName;
        this.wc.request({
            type: "SetUserInfo",
            uid: uid ? uid : "",
            nickName: nickName ? nickName : "",
            score: score ? score : 0
        }).then((r) => {
            if (!r.ok) return;
            uid = r.usr.uid;
            var nickName = r.usr.nickName;
            Utils.$$saveItem("UserID", uid);
            Utils.$$saveItem("UserNickName", nickName);
        });
    }

    canShare(): boolean { return false; }
    shareGame() {}

    platformType = "debug";
    openDataContext = {
        createDisplayObject: () => {}
    }
}

if (!window.platform) {
    window.platform = new DebugPlatform();
}

declare let platform: Platform;
declare interface Window {
    platform: Platform
}





