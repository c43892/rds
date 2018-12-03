package main

import (
	"os"
	"io"
	"encoding/json"
	"log"
	"fmt"
	"strconv"
	"net/http"
	"github.com/go-redis/redis"
	"sort"
	"time"
	"strings"
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
	Score int `json:"store"`
	Info map[string]string `json:"info"`
}

type RankInfo struct {
	Usrs [100]*UserInfo `json:"usrs"`
}

// sort interface
func (r *RankInfo) Len() int { return len(r.Usrs); }
func (r *RankInfo) Less(i, j int) bool {
	if (r.Usrs[i] == nil) {
		return false;
	} else if (r.Usrs[j] == nil) {
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

func runServer() {
	loadRankInfo();
	fmt.Println("rds server started.")
	http.HandleFunc("/",  handleMsgfunc)
    http.ListenAndServe(":81", nil)
}

func stServer(ps string) {
	
	var keys, _ = dbc.Keys("uid_*").Result()
	for i := 0; i < len(keys); i++ {
		var uid = keys[i]
		usrInfo := loadOrCreateUser(uid)
		uidStr := strings.Replace(uid, ",", " ", -1);
		if (ps == "score") {
			rookiePlayFinished, _ := dbc.HGet(uid, "st.rookiePlayFinished").Result()
			fmt.Println(uid + "," + strconv.Itoa(usrInfo.Score) + "," + rookiePlayFinished)
		} else if (ps == "st.t") {
			stKeys, _ := dbc.HKeys(uid).Result()
			var firstStartDate = -1;
			var firstStartMonth = -1;
			for j := 0; j < len(stKeys); j++ {
				stKey := stKeys[j];
				if (len(stKey) > 8 && stKey[:8] == "st.2018/") {
					startTimeStr := stKey[3:];
					startDateStr := startTimeStr[8:10];
					startDate, _ := strconv.Atoi(startDateStr);
					startMonth, _ := strconv.Atoi(startTimeStr[5:7]);
					if (firstStartDate == -1) {
						firstStartDate = startDate;
						firstStartMonth = startMonth;
					} else if (startMonth != firstStartMonth || startDate != firstStartDate) {
						fmt.Println(uidStr + ", " + strconv.Itoa(firstStartMonth) + "-" + strconv.Itoa(firstStartDate) + "," + strconv.Itoa(startMonth) + "-" + strconv.Itoa(startDate));
						break;
					}
				}
			}
		} else if (ps[:3] == "st.") {
			v, err := dbc.HGet(uid, ps).Result()
			if (err == nil && v != "") {
				fmt.Println(uidStr + "," + v);
			}
		} else {
			v := usrInfo.Info[ps]
			fmt.Println(uidStr + "," + v);
		}
	}
}

func main() {
	initDB()

	if (len(os.Args) > 1) {
		var launchType = os.Args[1]
		if (launchType == "st") {
			stServer(os.Args[2]);
			return;
		} else if (launchType != "default") {
			log.Fatal("unknown launch type: " + launchType);
			return
		}
	}

	runServer()
}

type HttpResp struct {
	Ok bool `json:"ok"`
	Usr UserInfo `json:"usr"` 
	Rank RankInfo `json:"rank"`
}

type RequestMsg struct {
	Type string `json:"type"`
	Uid string `json:"uid"`
	Key string `json:"key"`
	Value string `json:"value"`
}

// process the client http request
func handleMsgfunc(w http.ResponseWriter, r *http.Request) {

	// parse the request message
	r.ParseForm();
	msg := &RequestMsg{};
	json.Unmarshal([]byte(r.PostFormValue("msg")), msg);

	var res *HttpResp; // response

	// handle the request message
	if (msg.Type == "GetRank") {
		usr := onGetRank(msg);
		res = &HttpResp{};
		res.Ok = true;
		res.Usr = *usr;
		res.Rank = *rankInfo;
	} else if (msg.Type == "setUserCloudData") {
		usr := onSetUserInfo(msg);
		res = &HttpResp{};
		res.Ok = true;
		res.Usr = *usr;
	} else {
		log.Println("unsupported message type: " + msg.Type);
	}

	// send the response
	w.Header().Set("Access-Control-Allow-Origin", "*");
	resData, _ := json.Marshal(res);
	resStr := string(resData);
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
				sortRank();
			}

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

// msg: GetRank
func onGetRank(msg *RequestMsg) (*UserInfo) {
	// get user info
	usrInfo := loadOrCreateUser(msg.Uid);

	// weekly refresh
	_, nowWeeks := time.Now().ISOWeek();
	data, _ := dbc.Get("weeklyRank_timestamp").Result();
	weeklyRankTimestamp, _ := strconv.Atoi(data);
	if (nowWeeks > weeklyRankTimestamp) {
		rankInfo = &RankInfo{};
		dbc.Set("weeklyRank_timestamp", strconv.Itoa(nowWeeks), 0);
	}

	// get rank info
	return usrInfo;
}

// msg: SetUserInfo
func onSetUserInfo(msg *RequestMsg) (*UserInfo) {
	// get user info
	usrInfo := loadOrCreateUser(msg.Uid);
	if (msg.Key == "score") {
		// set user score and rebuild the rank
		score, _ := strconv.Atoi(msg.Value);
		if (usrInfo.Score < score) {
			usrInfo.Score = score
			dbc.HSet(usrInfo.Uid, "score", score)
		}

		setUserScore(usrInfo);
	} else if (msg.Key[:3] == "st.") {
		// statistics
		dbc.HSet(msg.Uid, msg.Key, msg.Value);
	} else {
		usrInfo.Info[msg.Key] = msg.Value;
		info, _ := json.Marshal(usrInfo.Info);
		dbc.HSet(msg.Uid, "info", string(info));
	}

	// get rank info
	return usrInfo;
}

// load or create user
func loadOrCreateUser(uid string) *UserInfo {
	var usrInfo *UserInfo;
	r, err := dbc.HGetAll(uid).Result();
	if (err != nil || r["info"] == "") {
		usrInfo = createUser(uid);
		dbc.HSet(uid, "score", usrInfo.Score);
		info, _ := json.Marshal(usrInfo.Info);
		dbc.HSet(uid, "info", string(info));
	} else {
		usrInfo = &UserInfo{};
		usrInfo.Uid = uid;
		score, _ := strconv.Atoi(r["score"]);
		usrInfo.Score = score;
		usrInfo.Info = map[string]string{};
		json.Unmarshal([]byte(r["info"]), &usrInfo.Info);
	}

	return usrInfo;
}

// create new user
func createUser(uid string) *UserInfo {
	usrInfo := &UserInfo{};

	usrInfo.Uid = uid;
	usrInfo.Info = map[string]string{};
	usrInfo.Score = 0;

	return usrInfo;
}
