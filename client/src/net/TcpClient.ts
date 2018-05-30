// 网络消息格式(JSON)
interface IMsg {
    msg:string; // 消息代码
}

// 封装 websocket 客户端功能

class TcpClient {
    private ws:egret.WebSocket;
    private msgHandlers = {};

    private handleConnected;
    private handleClosed;
    private handleError;
    private handleMessge;
    
    constructor() {
        this.ws = new egret.WebSocket();
        this.ws.addEventListener(egret.Event.CONNECT, () => {
            if (this.handleConnected)
                this.handleConnected();
        }, this);
        this.ws.addEventListener(egret.Event.CLOSE, () => {
            if (this.handleClosed)
                this.handleClosed();
        }, this);
        this.ws.addEventListener(egret.IOErrorEvent.IO_ERROR, () => {
            if (this.handleError)
                this.handleError();
        }, this);
        this.ws.addEventListener(egret.ProgressEvent.SOCKET_DATA, this.dispatchMessage, this);
    }

    // 异步连接到指定服务器
    public connect2srv(addr:string, port:number):TcpClient {
        this.ws.connect(addr, port);
        return this;
    }

    public onConnected(handler):TcpClient {
        this.handleConnected = handler;
        return this;
    }

    public onClosed(handler):TcpClient {
        this.handleClosed = handler;
        return this;
    }

    public onError(handler):TcpClient {
        this.handleError = handler;
        return this;
    }

    // 指定消息响应函数
    public onMessage(msg:string, handler):TcpClient {
        this.msgHandlers[msg] = handler;
        return this;
    }

    // 发送数据，无回执，msg 是消息代码，ps 包含所有消息参数
    public send(msg:IMsg) {
        var msgStr = JSON.stringify(msg);
        this.ws.writeUTF(msgStr); 
    }

    // 发送数据，并等待回执
    public request(IMsg, onResponse) {
    }

    // 分发应用消息
    private dispatchMessage(e:egret.Event) {
        var msgStr = this.ws.readUTF();
        console.log(msgStr);
        var msg = <IMsg>JSON.parse(msgStr);
        var h = this.msgHandlers[msg.msg];
        if (h)
            h();
        else
            console.log("unhandled net message: " + msg.msg);
    }
}