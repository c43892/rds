package main

import (
	"io"
	"encoding/json"
	"log"
	"fmt"
	"strconv"
	"net/http"
	"math/rand"
	"github.com/go-redis/redis"
)

func assert(condition bool, msg string) {
	if (!condition) {
		log.Fatal(msg);
	}
}

var dbc *redis.Client;

func initDB() {
	dbAddr := "localhost:6379";
	dbc = redis.NewClient(&redis.Options{
		Addr: dbAddr,
		Password: "", // no password set
		DB:       0,  // use default DB
	});
	
	_, err := dbc.Ping().Result()
	assert(err == nil, "failed to connect database");
	log.Println("database connected: " + dbAddr);
}

type UserInfo struct {
	Uid string `json:"uid"`
	NickName string `json:"nickName"`
	Score int `json:"score"`
}

type RankInfo struct {
	Usrs [100]*UserInfo `json:"usrs"`
}

var rankInfo *RankInfo;
func loadRankInfo() {

	rankInfo = &RankInfo{};
	for i := 0; i < len(rankInfo.Usrs); i++ {
		data, err := dbc.Get("rank_" + strconv.Itoa(i)).Result();
		if (err != nil || data == "") {
			rankInfo.Usrs[i] = nil;
		} else {
			rankInfo.Usrs[i] = &UserInfo{};
			json.Unmarshal([]byte(data), rankInfo.Usrs[i]);
		}
	}

	log.Println("rank info loaded: " + strconv.Itoa(len(rankInfo.Usrs)));
}

func main() {
	initDB();
	loadRankInfo();
	fmt.Println("rds server started.")
	http.HandleFunc("/",  handleMsgfunc)
    http.ListenAndServe(":81", nil)
}

type HttpLoginResp struct {
	Ok bool `json:"ok"`
	Usr UserInfo `json:"usr"`
	Rank RankInfo `json:"rank"`
}

type RequestMsg struct {
	Type string `json:"type"`
	Uid string `json:"uid"`
	NickName string `json:"nickName"`
	Score int `json:"score"`
}

// process the client http request
func handleMsgfunc(w http.ResponseWriter, r *http.Request) {

	// parse the request message
	r.ParseForm();
	msg := &RequestMsg{};
	json.Unmarshal([]byte(r.PostFormValue("msg")), msg);

	// only one request type is supported now
	assert(msg.Type == "LoginAndGetRank", "only LoginAndGetRank message type supported");

	// handle the request message
	usr := onLoginAndGetRank(msg);

	// send the response
	res := &HttpLoginResp{};
	res.Ok = true;
	res.Usr = *usr;
	res.Rank = *rankInfo;
	resData, _ := json.Marshal(res);
	resStr := string(resData);

	w.Header().Set("Access-Control-Allow-Origin", "*");
	io.WriteString(w, resStr);
}

// refresh the rank
func setUserScore(uid string, nickName string, score int) {
}

// msg: LoginAndGetRank
func onLoginAndGetRank(msg *RequestMsg) (*UserInfo) {
	uid := msg.Uid;

	// get user info
	var usrInfo *UserInfo;

	// load or create userinfo
	r, err := dbc.Get("uid_" + uid).Result();
	if (err != nil || r == "") {
		usrInfo = createUser();
		data, _ := json.Marshal(usrInfo);
		dbc.Set("uid_" + uid, string(data), 0);
	} else {
		usrInfo = &UserInfo{};
		json.Unmarshal([]byte(r), usrInfo);
	}

	// set user score and rebuild the rank
	setUserScore(usrInfo.Uid, usrInfo.NickName, usrInfo.Score);

	// get rank info

	// put the new record in and refresh the rank
	setUserScore(msg.Uid, msg.NickName, msg.Score);

	return usrInfo;
}

// create new user
func createUser() *UserInfo {
	usrInfo := &UserInfo{};

	usrInfo.Uid = strconv.Itoa(rand.Int() % 10000);
	usrInfo.NickName = "name of " + usrInfo.Uid;
	usrInfo.Score = 0;

	return usrInfo;
}
