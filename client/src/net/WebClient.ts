// 封装 web 客户端功能

class WebClient {
    srv;
    constructor(serverUrl) {
        this.srv = serverUrl;
    }

    // 发送数据，无回执，msg 是消息代码，ps 包含所有消息参数
    public send(msg) {
        var r = new egret.HttpRequest();
        r.responseType = egret.HttpResponseType.TEXT;
        r.open(this.srv, egret.HttpMethod.POST);
        r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        r.send("msg=" + JSON.stringify(msg));
    }

    // 发送数据，并等待回执
    public request(msg):Promise<any> {
        var r = new egret.HttpRequest();
        r.responseType = egret.HttpResponseType.TEXT;

        var doResolve;

        r.addEventListener(egret.Event.COMPLETE, (event:egret.Event) => {
            var request = <egret.HttpRequest>event.currentTarget;
            doResolve(request.response ? JSON.parse(request.response) : undefined);
        }, this);

        r.addEventListener(egret.IOErrorEvent.IO_ERROR, (event:egret.Event) => {
            doResolve(event);
        },this);

        r.open(this.srv, egret.HttpMethod.POST);
        r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        r.send("msg=" + JSON.stringify(msg));
        return new Promise<any>((resolve, reject) => {
            doResolve = resolve;
        });
    }
}
