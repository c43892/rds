/** 
 * 平台数据接口。
 * 由于每款游戏通常需要发布到多个平台上，所以提取出一个统一的接口用于开发者获取平台数据信息
 * 推荐开发者通过这种方式封装平台逻辑，以保证整体结构的稳定
 * 由于不同平台的接口形式各有不同，白鹭推荐开发者将所有接口封装为基于 Promise 的异步形式
 */
declare interface Platform {

    login(): Promise<any>;

    setUserCloudStorage(data): Promise<boolean>;
    removeUserCloudStorage(data): Promise<boolean>;

    platformType;
    openDataContext;
}

class DebugPlatform implements Platform {
    public wc:WebClient;
    
    async login() {
        var uid = Utils.$$loadItem("UserID");
        var r = await this.wc.request({
            type: "GetRank",
            uid: uid ? uid : ""
        });

        if (r.ok) {
            uid = r.usr.uid;
            Utils.$$saveItem("UserID", uid);
            return {ok:true, usr:r.usr, rank:r.rank.usrs};
        }
        else
            return {ok:false};
    }

    async setUserCloudStorage(data): Promise<boolean>
    {
        var uid = Utils.$$loadItem("UserID");
        var score = data.Score;
        var r = await this.wc.request({
            type: "SetUserInfo",
            uid: uid ? uid : "",
            nickName: uid ? uid + "_name" : "",
            score: score ? score : 0
        });

        if (r.ok) {
            uid = r.usr.uid;
            Utils.$$saveItem("UserID", uid);
            return true;
        }
        else
            return false;
    }

    async removeUserCloudStorage(data): Promise<boolean> { return false; }

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





