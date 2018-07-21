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
	"sort"
	"time"
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
		DB: 0,  // use default DB
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

// sort interface
func (r *RankInfo) Len() int { return len(r.Usrs); }
func (r *RankInfo) Less(i, j int) bool {
	if (r.Usrs[i] == nil) {
		return false;
	} else if (r.Usrs[i] == nil) {
		return true;
	} else {
		return r.Usrs[i].Score > r.Usrs[j].Score;
	}
}
func (r *RankInfo) Swap(i, j int) { tmp := r.Usrs[i]; r.Usrs[i] = r.Usrs[j]; r.Usrs[j] = tmp; }

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

	sortRank();
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
func setUserScore(usrInfo *UserInfo) {
	var len = len(rankInfo.Usrs);
	for i := 0; i < len; i++ {
		var usr = rankInfo.Usrs[i];
		if usr != nil && usr.Uid == usrInfo.Uid {
			if usr.Score < usrInfo.Score { // new high score
				usr.Score = usrInfo.Score;
			}

			sortRank();
			return;
		}
	}

	// compare with the last one
	var usr = rankInfo.Usrs[len - 1];
	if usr != nil && usr.Score >= usrInfo.Score {
		return;
	}

	rankInfo.Usrs[len - 1] = usrInfo;
	sortRank();
}

// resort the rank
func sortRank() {
	sort.Sort(rankInfo);

	// save the rank
	for i := 0; i < len(rankInfo.Usrs); i++ {
		data, _ := json.Marshal(rankInfo.Usrs[i]);
		dbc.Set("rank_" + strconv.Itoa(i), string(data), 0);
	}
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
		dbc.Set("uid_" + usrInfo.Uid, string(data), 0);
	} else {
		usrInfo = &UserInfo{};
		json.Unmarshal([]byte(r), usrInfo);
	}

	// refresh user information
	usrInfo.NickName = msg.NickName;
	usrInfo.Score = msg.Score;

	// weekly refresh
	_, nowWeeks := time.Now().ISOWeek();
	data, _ := dbc.Get("weeklyRank_timestamp").Result();
	weeklyRankTimestamp, _ := strconv.Atoi(data);
	if (nowWeeks > weeklyRankTimestamp) {
		rankInfo = &RankInfo{};
		dbc.Set("weeklyRank_timestamp", strconv.Itoa(nowWeeks), 0);
	}

	// set user score and rebuild the rank
	setUserScore(usrInfo);

	// get rank info
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
