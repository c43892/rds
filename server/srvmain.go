package main

import (
	"encoding/json"
	"log"
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("rds server started.")
	initMsgHandlers();
	http.HandleFunc("/",  handleMsgfunc)
    http.ListenAndServe(":81", nil)
}

// 处理客户端网络消息
func handleMsgfunc(w http.ResponseWriter, r *http.Request) {
	r.Header.Del("Origin") ////----
	// conn, err := upgrader.Upgrade(w, r, nil)
	// if err != nil {
	// 	log.Println(err)
	// 	return
	// }

	clientService(w, r);
}

// 消息映射表
var msgHandles = make(map[string]func(ps map[string]string)map[string]string)
func initMsgHandlers() {

	// 简单回应
	msgHandles["echo"] = func(ps map[string]string)map[string]string { return map[string]string {"content": ps["content"]}; }
}

type UserInfo struct {
	Uid string;
}

type HttpLoginResp struct {
	Ok bool;
	Usr UserInfo;
}

// 单独一个 go 程服务一个客户端
func clientService(w http.ResponseWriter, r *http.Request) {
	r.ParseForm();
	log.Println(r.PostFormValue("msg"));
	w.Header().Set("Access-Control-Allow-Origin", "*");
	
	usrInfo := &UserInfo{};
	usrInfo.Uid = "test";
	res := &HttpLoginResp{};
	res.Ok = true;
	res.Usr = *usrInfo;
	log.Println(res);
	resData, _ := json.Marshal(res);
	resStr := string(resData);
	log.Println(resStr);
	w.Write([]byte(resStr));

	// for {
	// 	var msg = make(map[string]string)
	// 	err := conn.ReadJSON(&msg)
	// 	if err != nil {
	// 		log.Println("connection error: " + err.Error())
	// 		conn.Close();
	// 		return;
	// 	}

	// 	var msgCode = msg["msg"];
	// 	log.Println("got msg: " + msgCode);

	// 	var h = msgHandles[msgCode]
	// 	if (h != nil) {
	// 		var r = h(msg)
	// 		if (r != nil) {
	// 			r["$$seqno"] = msg["$$seqno"];
	// 			conn.WriteJSON(r);
	// 		}
	// 	} else {
	// 		log.Println("unhandled client message: ", msgCode);
	// 	}
	// }
}
