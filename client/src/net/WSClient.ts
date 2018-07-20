// 封装 websocket 客户端功能

class WSClient {
    private seqno:number;
    private ws:egret.WebSocket;
    private msgHandlers = {};
    private responseHandler = {};

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

        this.seqno = 1;
    }

    // 异步连接到指定服务器
    public connect2srv(addr:string, port:number):WSClient {
        this.ws.connect(addr, port);
        return this;
    }

    public onConnected(handler):WSClient {
        this.handleConnected = handler;
        return this;
    }

    public onClosed(handler):WSClient {
        this.handleClosed = handler;
        return this;
    }

    public onError(handler):WSClient {
        this.handleError = handler;
        return this;
    }

    // 指定消息响应函数
    public onMessage(msg:string, handler):WSClient {
        this.msgHandlers[msg] = handler;
        return this;
    }

    // 发送数据，无回执，msg 是消息代码，ps 包含所有消息参数
    public send(msg) {
        var msgStr = JSON.stringify(msg);
        this.ws.writeUTF(msgStr); 
    }

    // 发送数据，并等待回执
    public request(msg, onResponse) {
        var no = (String)(this.seqno++);
        msg.$$seqno = no;
        this.responseHandler[no] = onResponse;
        var msgStr = JSON.stringify(msg);
        this.ws.writeUTF(msgStr); 
    }

    // 分发应用消息
    private dispatchMessage(e:egret.Event) {
        var msgStr = this.ws.readUTF();
        var msg = JSON.parse(msgStr);

        if (msg.$$seqno != undefined) { // 这是个应答消息
            var h = this.responseHandler[msg.$$seqno];
            if (h)
                h(msg);
            else
                console.log("unhandled response: " + msg.$$seqno);
        } else { // 简单消息
            var h = this.msgHandlers[msg.msg];
            if (h)
                h(msg);
            else
                console.log("unhandled net message: " + msg.msg);
        }
    }
}
