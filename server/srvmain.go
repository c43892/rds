package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/go-redis/redis"
)

func assert(condition bool, msg string) {
	if !condition {
		log.Fatal(msg)
	}
}

var dbc *redis.Client

func initDB() {
	dbAddr := "localhost:6379"
	dbc = redis.NewClient(&redis.Options{
		Addr:     dbAddr,
		Password: "", // no password set
		DB:       0,  // use default DB
	})

	_, err := dbc.Ping().Result()
	assert(err == nil, "failed to connect database")
	log.Println("database connected: " + dbAddr)
}

type userInfo struct {
	UID   string            `json:"uid"`
	Score int               `json:"score"`
	Name  string            `json:"name"`
	Info  map[string]string `json:"info"`
}

type rankInfo struct {
	Usrs        [100]*userInfo `json:"usrs"`
	Occupations [100]string    `json:"occupations"`
}

// sort interface
func (r *rankInfo) Len() int { return len(r.Usrs) }
func (r *rankInfo) Less(i, j int) bool {
	if r.Usrs[i] == nil {
		return false
	} else if r.Usrs[j] == nil {
		return true
	} else {
		return r.Usrs[i].Score > r.Usrs[j].Score
	}
}
func (r *rankInfo) Swap(i, j int) {
	usr := r.Usrs[i]
	r.Usrs[i] = r.Usrs[j]
	r.Usrs[j] = usr
	occ := r.Occupations[i]
	r.Occupations[i] = r.Occupations[j]
	r.Occupations[j] = occ
}

var rank *rankInfo

func loadRankInfo() {
	rank = &rankInfo{}

	for i := 0; i < len(rank.Usrs); i++ {
		data, err := dbc.Get("rank_" + strconv.Itoa(i)).Result()
		if err != nil || data == "" {
			rank.Usrs[i] = nil
		} else {
			rank.Usrs[i] = &userInfo{}
			json.Unmarshal([]byte(data), rank.Usrs[i])
			occ, _ := dbc.Get("rank_occ_" + strconv.Itoa(i)).Result()
			rank.Occupations[i] = occ
		}
	}

	sortRank()
	log.Println("rank info loaded: " + strconv.Itoa(len(rank.Usrs)))
}

func runServer() {
	loadRankInfo()
	fmt.Println("rds server started.")
	http.HandleFunc("/", handleMsgfunc)
	http.ListenAndServe(":81", nil)
}

// func stServer(ps string) {

// 	var keys, _ = dbc.Keys("uid_*").Result()
// 	for i := 0; i < len(keys); i++ {
// 		var uid = keys[i]
// 		usrInfo := loadOrCreateUser(uid)
// 		uidStr := strings.Replace(uid, ",", " ", -1)
// 		if ps == "score" {
// 			rookiePlayFinished, _ := dbc.HGet(uid, "st.rookiePlayFinished").Result()
// 			fmt.Println(uid + "," + strconv.Itoa(usrInfo.Score) + "," + rookiePlayFinished)
// 		} else if ps == "st.t" {
// 			stKeys, _ := dbc.HKeys(uid).Result()
// 			var firstStartDate = -1
// 			var firstStartMonth = -1
// 			for j := 0; j < len(stKeys); j++ {
// 				stKey := stKeys[j]
// 				if len(stKey) > 8 && stKey[:8] == "st.2018/" {
// 					startTimeStr := stKey[3:]
// 					startDateStr := startTimeStr[8:10]
// 					startDate, _ := strconv.Atoi(startDateStr)
// 					startMonth, _ := strconv.Atoi(startTimeStr[5:7])
// 					if firstStartDate == -1 {
// 						firstStartDate = startDate
// 						firstStartMonth = startMonth
// 					} else if startMonth != firstStartMonth || startDate != firstStartDate {
// 						fmt.Println(uidStr + ", " + strconv.Itoa(firstStartMonth) + "-" + strconv.Itoa(firstStartDate) + "," + strconv.Itoa(startMonth) + "-" + strconv.Itoa(startDate))
// 						break
// 					}
// 				}
// 			}
// 		} else if ps[:3] == "st." {
// 			v, err := dbc.HGet(uid, ps).Result()
// 			if err == nil && v != "" {
// 				fmt.Println(uidStr + "," + v)
// 			}
// 		} else {
// 			v := usrInfo.Info[ps]
// 			fmt.Println(uidStr + "," + v)
// 		}
// 	}
// }

func main() {
	initDB()

	// if len(os.Args) > 1 {
	// 	var launchType = os.Args[1]
	// 	if launchType == "st" {
	// 		stServer(os.Args[2])
	// 		return
	// 	} else if launchType != "default" {
	// 		log.Fatal("unknown launch type: " + launchType)
	// 		return
	// 	}
	// }

	runServer()
}

type httpResp struct {
	Ok   bool      `json:"ok"`
	Usr  userInfo  `json:"usr"`
	Rank *rankInfo `json:"rank"`
}

type requestMsg struct {
	Type  string `json:"type"`
	UID   string `json:"uid"`
	Key   string `json:"key"`
	Value string `json:"value"`
}

// process the client http request
func handleMsgfunc(w http.ResponseWriter, r *http.Request) {

	// parse the request message
	r.ParseForm()
	msg := &requestMsg{}
	msgStr := r.PostFormValue("msg")
	json.Unmarshal([]byte(msgStr), msg)

	var res *httpResp // response

	// handle the request message
	if msg.Type == "getRank" {
		refreshRank(msg)
		res = &httpResp{}
		res.Ok = true
		res.Usr = *loadOrCreateUser(msg.UID)
		res.Rank = rank
	} else if msg.Type == "setUserCloudData" {
		onSetUserInfo(msg)
		res = &httpResp{}
		res.Ok = true
	} else {
		log.Println("unsupported message type: " + msg.Type)
		return
	}

	// send the response
	w.Header().Set("Access-Control-Allow-Origin", "*")
	resData, _ := json.Marshal(res)
	resStr := string(resData)
	io.WriteString(w, resStr)
}

// refresh the rank
func setUserScore(usrInfo *userInfo, occupation string) {
	var len = len(rank.Usrs)
	for i := 0; i < len; i++ {
		var usr = rank.Usrs[i]
		if usr != nil && usr.UID == usrInfo.UID {
			if usr.Score < usrInfo.Score { // new high score
				usr.Score = usrInfo.Score
				rank.Occupations[i] = occupation
				sortRank()
			}

			return
		}
	}

	// compare with the last one
	var usr = rank.Usrs[len-1]
	if usr != nil && usr.Score >= usrInfo.Score {
		return
	}

	rank.Usrs[len-1] = usrInfo
	rank.Occupations[len-1] = occupation
	sortRank()
}

// resort the rank
func sortRank() {
	sort.Sort(rank)

	// save the rank
	for i := 0; i < len(rank.Usrs); i++ {
		data, _ := json.Marshal(rank.Usrs[i])
		dbc.Set("rank_"+strconv.Itoa(i), string(data), 0)
		dbc.Set("rank_occ_"+strconv.Itoa(i), rank.Occupations[i], 0)
	}
}

// msg: GetRank
func refreshRank(msg *requestMsg) {
	// weekly refresh
	_, nowWeeks := time.Now().ISOWeek()
	data, _ := dbc.Get("weeklyRank_timestamp").Result()
	weeklyRankTimestamp, _ := strconv.Atoi(data)
	if nowWeeks > weeklyRankTimestamp {
		rank = &rankInfo{}
		dbc.Set("weeklyRank_timestamp", strconv.Itoa(nowWeeks), 0)
	}
}

// msg: SetUserInfo
func onSetUserInfo(msg *requestMsg) {
	if msg.Key[:3] == "st." {
		// statistics
		stKey := msg.Key[3:]
		addStInfo(msg.UID, stKey, msg.Value)
	} else {
		// get user info
		usrInfo := loadOrCreateUser(msg.UID)
		if msg.Key == "score" {
			// set user score and rebuild the rank
			splitePos := strings.Index(msg.Value, ",")
			scoreStr := msg.Value[1:splitePos]
			occupation := msg.Value[splitePos+1 : len(msg.Value)-1]
			score, _ := strconv.Atoi(scoreStr)
			if usrInfo.Score < score {
				usrInfo.Score = score
				dbc.HSet(usrInfo.UID, "score", score)
			}

			setUserScore(usrInfo, occupation)
		} else if msg.Key == "playerName" {
			usrInfo.Name = msg.Value
			dbc.HSet(usrInfo.UID, "playerName", msg.Value)
		}
	}

	// } else if msg.Key[:3] == "st." {
	// 	// statistics
	// 	dbc.HSet(msg.UID, msg.Key, msg.Value)
	// } else {
	// 	usrInfo.Info[msg.Key] = msg.Value
	// 	info, _ := json.Marshal(usrInfo.Info)
	// 	dbc.HSet(msg.UID, "info", string(info))
	// }

	// get rank info
	// return usrInfo
}

type stInfo struct {
	DailyGameTime map[string]int `json:"DailyGameTime"` // 每日登录时常统计
	DailyLoginCnt map[string]int `json:"DailyLoginCnt"` // 每日登录次数
	Clearance     []string       `json:"Clearance"`     // 通关记录
	NewGameStatus []string       `json:"NewGameStatus"` // 开始新游戏前的状态
	EndGameStatus []string       `json:"EndGameStatus"` // 结束游戏状态
	Prograss      string         `json:"Prograss"`      // 当前游戏状态
}

// load or create statistic info
func loadOrCreateStInfo(stID string) *stInfo {
	info := &stInfo{}
	r, err := dbc.HGetAll(stID).Result()
	if err != nil || r["DailyGameTime"] == "" {
		info.DailyGameTime = make(map[string]int)
	} else {
		json.Unmarshal([]byte(r["DailyGameTime"]), &info.DailyGameTime)
	}

	if err != nil || r["DailyLoginCnt"] == "" {
		info.DailyLoginCnt = make(map[string]int)
	} else {
		json.Unmarshal([]byte(r["DailyLoginCnt"]), &info.DailyLoginCnt)
	}

	if err != nil || r["Clearance"] == "" {
		info.Clearance = make([]string, 0)
	} else {
		json.Unmarshal([]byte(r["Clearance"]), &info.Clearance)
	}

	if err != nil || r["NewGameStatus"] == "" {
		info.NewGameStatus = make([]string, 0)
	} else {
		json.Unmarshal([]byte(r["NewGameStatus"]), &info.NewGameStatus)
	}

	if err != nil || r["EndGameStatus"] == "" {
		info.EndGameStatus = make([]string, 0)
	} else {
		json.Unmarshal([]byte(r["EndGameStatus"]), &info.EndGameStatus)
	}

	if err != nil || r["Prograss"] == "" {
		info.Prograss = ""
	} else {
		info.Prograss = r["Prograss"]
	}

	return info
}

// set the statistic info
func addStInfo(uid string, stKey string, infoStr string) {
	stID := "st." + uid
	info := loadOrCreateStInfo(stID)

	switch stKey {
	case "LaunchDate": // 游戏启动, infoStr 是启动时间
		info.DailyLoginCnt[infoStr]++
		dailyLoginInfo, _ := json.Marshal(info.DailyLoginCnt)
		dbc.HSet(stID, "DailyLoginCnt", dailyLoginInfo)
	case "Heartbeat": // 心跳，infoStr 是启动时间
		info.DailyGameTime[infoStr]++
		gameTimeInfo, _ := json.Marshal(info.DailyGameTime)
		dbc.HSet(stID, "DailyGameTime", string(gameTimeInfo))
	case "Clearance": // 通关次数统计
		info.Clearance = append(info.Clearance, infoStr)
		clearanceInfo, _ := json.Marshal(info.Clearance)
		dbc.HSet(stID, "Clearance", string(clearanceInfo))

		info.EndGameStatus = append(info.EndGameStatus, "0,"+infoStr)
		endGameInfo, _ := json.Marshal(info.EndGameStatus)
		dbc.HSet(stID, "EndGameStatus", string(endGameInfo))

	case "NewGameStatus": // 新游戏起始状态
		info.NewGameStatus = append(info.NewGameStatus, infoStr)
		newGameStatusInfo, _ := json.Marshal(info.NewGameStatus)
		dbc.HSet(stID, "NewGameStatus", string(newGameStatusInfo))
	case "Prograss": // 当前进度
		info.Prograss = infoStr
		dbc.HSet(stID, "Prograss", info.Prograss)

		if infoStr[0:4] == "out," && infoStr[4:5] == "1" { // 角色死亡
			info.EndGameStatus = append(info.EndGameStatus, infoStr[4:])
			endGameInfo, _ := json.Marshal(info.EndGameStatus)
			dbc.HSet(stID, "EndGameStatus", string(endGameInfo))
		}
	}
}

// load or create user
func loadOrCreateUser(uid string) *userInfo {
	var usrInfo *userInfo
	r, err := dbc.HGetAll(uid).Result()
	if err != nil || r["info"] == "" {
		usrInfo = createUser(uid)
		dbc.HSet(uid, "score", usrInfo.Score)
		dbc.HSet(uid, "playerName", usrInfo.Name)
		info, _ := json.Marshal(usrInfo.Info)
		dbc.HSet(uid, "info", string(info))
	} else {
		usrInfo = &userInfo{}
		usrInfo.UID = uid
		score, _ := strconv.Atoi(r["score"])
		usrInfo.Score = score
		usrInfo.Name = r["playerName"]
		usrInfo.Info = map[string]string{}
		json.Unmarshal([]byte(r["info"]), &usrInfo.Info)
	}

	return usrInfo
}

// create new user
func createUser(uid string) *userInfo {
	usrInfo := &userInfo{}

	usrInfo.UID = uid
	usrInfo.Info = map[string]string{}
	usrInfo.Score = 0

	return usrInfo
}
