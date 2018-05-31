package main

import (
	"log"
	"fmt"
	"net/http"
	"github.com/gorilla/websocket"
)

func main() {
	fmt.Println("rds server started.")
	initMsgHandlers();
	http.HandleFunc("/",  handleMsgfunc)
    http.ListenAndServe(":80", nil)
}

var upgrader = websocket.Upgrader{
    ReadBufferSize:  10*1024,
    WriteBufferSize: 10*1024,
}

// 处理客户端网络消息
func handleMsgfunc(w http.ResponseWriter, r *http.Request) {
	r.Header.Del("Origin") ////----
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	go clientService(conn);
}

// 消息映射表
var msgHandles = make(map[string]func(ps map[string]string)map[string]string)
func initMsgHandlers() {

	// 简单回应
	msgHandles["echo"] = func(ps map[string]string)map[string]string { return map[string]string {"content": ps["content"]}; }
}

// 单独一个 go 程服务一个客户端
func clientService(conn *websocket.Conn) {
	for {
		var msg = make(map[string]string)
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("connection error: " + err.Error())
			conn.Close();
			return;
		}

		var msgCode = msg["msg"];
		log.Println("got msg: " + msgCode);

		var h = msgHandles[msgCode]
		if (h != nil) {
			var r = h(msg)
			if (r != nil) {
				r["$$seqno"] = msg["$$seqno"];
				conn.WriteJSON(r);
			}
		} else {
			log.Println("unhandled client message: ", msgCode);
		}
	}
}
