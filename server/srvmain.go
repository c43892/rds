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

	// if len(os.Args) > 1 && os.Args[1] == "st" {
	// 	doSt()
	// } else {
	// 	runServer()
	// }

	runServer()
	// doSt()
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
			dbc.HSet(usrInfo.UID, "name", msg.Value)

			for _, rankUsr := range rank.Usrs {
				if rankUsr.UID == usrInfo.UID {
					rankUsr.Name = usrInfo.Name
					break
				}
			}

			stID := "st." + msg.UID
			sInfo := loadOrCreateStInfo(stID)
			sInfo.PlayerName = msg.Value
			dbc.HSet(stID, "PlayerName", sInfo.PlayerName)
		}
	}
}

type stInfo struct {
	PlayerName    string         `json:"PlayerName"`    // 角色名称
	DailyGameTime map[string]int `json:"DailyGameTime"` // 每日登录时常统计
	DailyLoginCnt map[string]int `json:"DailyLoginCnt"` // 每日登录次数
	Clearance     []string       `json:"Clearance"`     // 通关记录
	NewGameStatus []string       `json:"NewGameStatus"` // 开始新游戏前的状态
	EndGameStatus []string       `json:"EndGameStatus"` // 结束游戏状态
	Prograss      string         `json:"Prograss"`      // 当前游戏状态
	RookieDone    bool           `json:"RookieDone"`    // 完成新手
	Reborn        []string       `json:"Reborn"`        // 复活
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

	if err != nil || r["PlayerName"] == "" {
		info.PlayerName = ""
	} else {
		info.PlayerName = r["PlayerName"]
	}

	if err != nil || r["RookieDone"] == "" {
		info.RookieDone = false
	} else {
		info.RookieDone, _ = strconv.ParseBool(r["RookieDone"])
	}

	if err != nil || r["Reborn"] == "" {
		info.Reborn = make([]string, 0)
	} else {
		json.Unmarshal([]byte(r["Reborn"]), &info.Reborn)
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
		dbc.HSet(stID, "RookieDone", true)

		info.EndGameStatus = append(info.EndGameStatus, "0,false,"+infoStr)
		endGameInfo, _ := json.Marshal(info.EndGameStatus)
		dbc.HSet(stID, "EndGameStatus", string(endGameInfo))

	case "NewGameStatus": // 新游戏起始状态
		info.NewGameStatus = append(info.NewGameStatus, infoStr)
		newGameStatusInfo, _ := json.Marshal(info.NewGameStatus)
		dbc.HSet(stID, "NewGameStatus", string(newGameStatusInfo))
	case "Prograss": // 当前进度
		info.Prograss = infoStr
		dbc.HSet(stID, "Prograss", info.Prograss)

		if infoStr[0:4] == "out," {
			if infoStr[4:5] == "1" { // 角色死亡
				info.EndGameStatus = append(info.EndGameStatus, infoStr[4:])
				endGameInfo, _ := json.Marshal(info.EndGameStatus)
				dbc.HSet(stID, "EndGameStatus", string(endGameInfo))
			} else { // 角色未死亡，通过该层
				if infoStr[len(infoStr)-1:len(infoStr)] == "0" { // 已经不是新手
					dbc.HSet(stID, "RookieDone", true)
				}
			}
		}
	case "Reborn": // 复活
		info.Reborn = append(info.Reborn, infoStr)
		dbc.HSet(stID, "Reborn", info.Reborn)
	}
}

func containsDay(days []time.Time, day time.Time) bool {
	for _, d := range days {
		if day.Equal(d) {
			return true
		}
	}

	return false
}

type dateArr []time.Time

func (arr dateArr) Len() int           { return len(arr) }
func (arr dateArr) Swap(i, j int)      { arr[i], arr[j] = arr[j], arr[i] }
func (arr dateArr) Less(i, j int) bool { return arr[i].Before(arr[j]) }

type stKeyArr []string

func (arr stKeyArr) Len() int      { return len(arr) }
func (arr stKeyArr) Swap(i, j int) { arr[i], arr[j] = arr[j], arr[i] }
func (arr stKeyArr) Less(i, j int) bool {
	d1, _ := time.Parse("02/01/2006", arr[i][6:16])
	d2, _ := time.Parse("02/01/2006", arr[j][6:16])
	return d1.Before(d2)
}

// find the index of the substr encountered N times in str
func indexOfStrNth(str string, substr string, n int) int {
	cnt := 0
	for i := 0; i <= len(str)-len(substr); i++ {
		if str[i:i+len(substr)] == substr {
			cnt++
			if cnt == n {
				return i
			}
		}
	}

	return -1
}

func doSt() {
	// collect all days

	allDays := make([]time.Time, 0)
	var keys, _ = dbc.Keys("st.uid.*").Result()

	for i := 0; i < len(keys); i++ {
		var stID = keys[i]
		stInfo := loadOrCreateStInfo(stID)

		for k := range stInfo.DailyLoginCnt {
			d, _ := time.Parse("02/01/2006", k)
			if !containsDay(allDays, d) {
				allDays = append(allDays, d)
			}
		}

		for k := range stInfo.DailyGameTime {
			d, _ := time.Parse("02/01/2006", k)
			if !containsDay(allDays, d) {
				allDays = append(allDays, d)
			}
		}
	}

	// sort date
	sort.Sort(dateArr(allDays))

	// sort the keys
	sort.Sort(stKeyArr(keys))

	// daily login count

	fmt.Print("daily login count")
	for _, d := range allDays {
		fmt.Print("," + d.Format("02/01/2006"))
	}
	fmt.Println("")

	for i := 0; i < len(keys); i++ {
		var stID = keys[i]
		stInfo := loadOrCreateStInfo(stID)
		fmt.Print(stInfo.PlayerName)

		for _, d := range allDays {
			dStr := d.Format("02/01/2006")
			for k, v := range stInfo.DailyLoginCnt {
				fmt.Print(",")
				if k == dStr {
					fmt.Print(strconv.Itoa(v))
				}
			}
		}

		fmt.Println("")
	}

	fmt.Print("daily game time")
	for _, d := range allDays {
		fmt.Print("," + d.Format("02/01/2006"))
	}
	fmt.Println("")

	// daily game time

	for i := 0; i < len(keys); i++ {
		var stID = keys[i]
		stInfo := loadOrCreateStInfo(stID)
		fmt.Print(stInfo.PlayerName)

		for _, d := range allDays {
			dStr := d.Format("02/01/2006")
			for k, v := range stInfo.DailyGameTime {
				fmt.Print(",")
				if k == dStr {
					fmt.Print(strconv.Itoa(v))
				}
			}
		}

		fmt.Println("")
	}

	fmt.Println("total = " + strconv.Itoa(len(keys)))

	// clearance count

	nonClearUserArr := make([]string, 0)
	clearanceUserCnt := 0
	for i := 0; i < len(keys); i++ {
		var stID = keys[i]
		stInfo := loadOrCreateStInfo(stID)
		cnt := len(stInfo.Clearance)
		if cnt > 0 {
			clearanceUserCnt++
		} else {
			nonClearUserArr = append(nonClearUserArr, stID)
		}
	}
	fmt.Println("clearance = " + strconv.Itoa(clearanceUserCnt))

	// reborn countd, ay1/3/7 retation
	rebornCnt := 0
	rookieDone := 0
	rt1 := 0
	rt3 := 0
	rt7 := 0
	for _, key := range keys {
		stInfo := loadOrCreateStInfo(key)
		if stInfo.RookieDone {
			rookieDone++
		}

		rebornCnt += len(stInfo.Reborn)

		createDate, _ := time.Parse("02/01/2006", key[6:16])
		d1 := createDate.AddDate(0, 0, 1)
		d3 := createDate.AddDate(0, 0, 3)
		d7 := createDate.AddDate(0, 0, 7)

		if stInfo.DailyLoginCnt[d1.Format("02/01/2006")] > 0 {
			rt1++
		}

		if stInfo.DailyLoginCnt[d3.Format("02/01/2006")] > 0 {
			rt3++
		}

		if stInfo.DailyLoginCnt[d7.Format("02/01/2006")] > 0 {
			rt7++
		}
	}

	fmt.Println("rebornTotal, rookieDone, rt1, rt3, rt7 = " + strconv.Itoa(rebornCnt) + "," + strconv.Itoa(rookieDone) + "," + strconv.Itoa(rt1) + "," + strconv.Itoa(rt3) + "," + strconv.Itoa(rt7))

	// the last level info for these non-clearance user
	fmt.Println("lost on level without clearance: ")
	lostLvCnt := make(map[int]int)
	for _, key := range nonClearUserArr {
		stInfo := loadOrCreateStInfo(key)
		n1 := indexOfStrNth(stInfo.Prograss, ",", 2)
		n2 := indexOfStrNth(stInfo.Prograss, ",", 3)
		lv, _ := strconv.Atoi(stInfo.Prograss[n1+1 : n2])
		lostLvCnt[lv]++
	}

	for lv, cnt := range lostLvCnt {
		fmt.Println(strconv.Itoa(lv) + "," + strconv.Itoa(cnt))
	}
}

// load or create user
func loadOrCreateUser(uid string) *userInfo {
	var usrInfo *userInfo
	r, err := dbc.HGetAll(uid).Result()
	if err != nil || r["info"] == "" {
		usrInfo = createUser(uid)
		dbc.HSet(uid, "score", usrInfo.Score)
		dbc.HSet(uid, "name", usrInfo.Name)
		info, _ := json.Marshal(usrInfo.Info)
		dbc.HSet(uid, "info", string(info))
	} else {
		usrInfo = &userInfo{}
		usrInfo.UID = uid
		score, _ := strconv.Atoi(r["score"])
		usrInfo.Score = score
		usrInfo.Name = r["name"]
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
