/** 
 * 平台数据接口。
 * 由于每款游戏通常需要发布到多个平台上，所以提取出一个统一的接口用于开发者获取平台数据信息
 * 推荐开发者通过这种方式封装平台逻辑，以保证整体结构的稳定
 * 由于不同平台的接口形式各有不同，白鹭推荐开发者将所有接口封装为基于 Promise 的异步形式
 */
declare interface Platform {

    login(): Promise<any>;
    getUserInfo(): Promise<any>;

    setUserCloudStorage(data): Promise<boolean>;
    removeUserCloudStorage(data): Promise<boolean>;

    platformType;
    openDataContext;
}

class DebugPlatform implements Platform {
    wc:WebClient;
    
    constructor() {
        this.wc = new WebClient("http://127.0.0.1:81");
    }
    
    async login() {
        await this.wc.request({}, (r) => {
            Utils.log(JSON.parse(r));
        });
    }

    async getUserInfo() {
        return { nickName: "username" }
    }

    async setUserCloudStorage(data): Promise<boolean> { return false; }
    async removeUserCloudStorage(data): Promise<boolean> { return false; }

    platformType = "debug";
    openDataContext = {
        createDisplayObject: () => {},
        setUserCloudStorage: () => {}
    }
}

if (!window.platform) {
    window.platform = new DebugPlatform();
}

declare let platform: Platform;
declare interface Window {
    platform: Platform
}





