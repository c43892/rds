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
        r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        r.setRequestHeader("Access-Control-Allow-Origin", "*"); 
        r.setRequestHeader("Access-Control-Allow-Headers", "Content-Type");
        r.send("msg=" + JSON.stringify(msg));
    }

    // 发送数据，并等待回执
    public request(msg, onResponse):Promise<any> {
        var r = new egret.HttpRequest();
        r.responseType = egret.HttpResponseType.TEXT;
        r.open(this.srv, egret.HttpMethod.POST);
        r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        r.setRequestHeader("Access-Control-Allow-Origin", "*");
        r.setRequestHeader("Access-Control-Allow-Headers", "Content-Type");

        var doResolve;

        r.addEventListener(egret.Event.COMPLETE, (event:egret.Event) => {
            var request = <egret.HttpRequest>event.currentTarget;
            doResolve(JSON.parse(request.response));
        }, this);

        r.addEventListener(egret.IOErrorEvent.IO_ERROR, (event:egret.Event) => {
            doResolve(event);
        },this);

        r.send("msg=" + JSON.stringify(msg));
        return new Promise<any>((resolve, reject) => {
            doResolve = resolve;
        });
    }
}
