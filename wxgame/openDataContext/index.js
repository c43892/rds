/**
 * 微信开放数据域
 * 使用 Canvas2DAPI 在 SharedCanvas 渲染一个排行榜，
 * 并在主域中渲染此 SharedCanvas
 */







/**
 * 资源加载组，将所需资源地址以及引用名进行注册
 * 之后可通过assets.引用名方式进行获取
 */
var assets = {
  box: "openDataContext/assets/box.png",
  box2: "openDataContext/assets/box2.png",
  ceng: "openDataContext/assets/characterCeng.png",
  crown1: "openDataContext/assets/crown1.png",
  crown2: "openDataContext/assets/crown2.png",
  crown3: "openDataContext/assets/crown3.png",
  numUnderLine: "openDataContext/assets/numUnderLine.png"
};
/**
 * canvas 大小
 * 这里暂时写死
 * 需要从主域传入
 */
let canvasWidth;
let canvasHeight;

/**
 * 加载资源函数
 * 理论上只需要加载一次，且在点击时才开始加载
 * 最好与canvasWidht和canvasHeight数据的传入之后进行
 */
preloadAssets();

//获取canvas渲染上下文
var context = sharedCanvas.getContext("2d");
context.globalCompositeOperation = "source-over";


/**
 * 所有头像数据
 * 包括姓名，头像图片，得分
 * 排位序号i会根据parge*perPageNum+i+1进行计算
 */
let totalGroup = [];

/**
 * 创建排行榜
 */
function drawRankPanel() {
  //绘制背景
  // context.drawImage(assets.panel, offsetX_rankToBorder, offsetY_rankToBorder, RankWidth, RankHeight);
  //绘制标题
  // let title = assets.title;
  //根据title的宽高计算一下位置;
  // let titleX = offsetX_rankToBorder + (RankWidth - title.width) / 2;
  // let titleY = offsetY_rankToBorder + title.height + 50;
  // context.drawImage(title, titleX, titleY);
  //获取当前要渲染的数据组
  let start = perPageMaxNum * page;
  
  currentGroup = totalGroup.slice(start, start + perPageMaxNum);
  
  //创建头像Bar
  drawRankByGroup(currentGroup);
  //创建按钮
  // drawButton()
}
/**
 * 根据屏幕大小初始化所有绘制数据
 */
let inited = false;
function init() {
  inited = true;
  //排行榜绘制数据初始化
  RankWidth = canvasWidth - 20; // * 4 / 5;
  RankHeight = canvasHeight; // * 4 / 5;
  barWidth = RankWidth; // * 4 / 5;
  barHeight = RankHeight / perPageMaxNum;
  offsetX_rankToBorder = (canvasWidth - RankWidth) / 2;
  offsetY_rankToBorder = 0; // canvasHeight - RankHeight;
  preOffsetY = barHeight; // (RankHeight - barHeight) / (perPageMaxNum + 1);

  startX = offsetX_rankToBorder; // + offsetX_rankToBorder;
  startY = offsetY_rankToBorder + 10; //  + preOffsetY;
  avatarSize = barHeight - 15;
  intervalX = barWidth / 20;
  textOffsetY = (barHeight + fontSize) / 2;
  textMaxSize = 250;
  
  context.font = fontSize + "px Arial";
  indexWidth = context.measureText("99").width;

  //按钮绘制数据初始化
  // buttonWidth = barWidth / 3;
  // buttonHeight = barHeight / 2;
  // buttonOffset = RankWidth / 3;
  // lastButtonX = offsetX_rankToBorder + buttonOffset - buttonWidth;
  // nextButtonX = offsetX_rankToBorder + 2 * buttonOffset;
  // nextButtonY = lastButtonY = offsetY_rankToBorder + RankHeight - 50 - buttonHeight;
  // let data = wx.getSystemInfoSync();
  // canvasWidth = data.windowWidth;
  // canvasHeight = data.windowHeight;
}

/**
 * 创建两个点击按钮
 */
// function drawButton() {
//   context.drawImage(assets.button, nextButtonX, nextButtonY, buttonWidth, buttonHeight);
//   context.drawImage(assets.button, lastButtonX, lastButtonY, buttonWidth, buttonHeight);
// }


/**
 * 根据当前绘制组绘制排行榜
 */
function drawRankByGroup(currentGroup) {
  if (!inited)
	return;

  var len = currentGroup.length + 3;
  len = len < 8 ? 8 : len;
  for (let i = 0; i < len; i++) {
	let data = currentGroup[i];
    drawByData(data, i);
  }
  
  context.drawImage(assets.box2, startX, len * barHeight - 25, barWidth, 52);
}

/**
 * 根据绘制信息以及当前i绘制元素
 */
function drawByData(data, i) {
  let x = startX;
  //绘制底框
  context.drawImage(assets.box, startX, startY + i * preOffsetY - 9, barWidth, barHeight);
  
  if (!data)
	return;
  
  x += 60;
  // 文字颜色
  context.fillStyle = "#75dbd0";
  
  //绘制序号
  context.fillText(data.key + "", x, startY + i * preOffsetY + textOffsetY + 5, textMaxSize);
  
  // 下划线
  context.drawImage(assets.numUnderLine, x-25, startY + i * preOffsetY + textOffsetY + 7, 83, 21);
  
  // 皇冠
  if (i < 3)
	  context.drawImage(assets["crown" + (i+1).toString()], x-14, startY + i * preOffsetY+12, 38, 35);

  x += indexWidth + intervalX - 20;
  
  //绘制头像
  // context.drawImage(data.url, x, startY + i * preOffsetY + (barHeight - avatarSize) / 2, avatarSize, avatarSize);
  var imgX = x + 10;
  
  var imgY = startY + i * preOffsetY + (barHeight - avatarSize) / 2 + 5;
  let image = wx.createImage();
  image.src = data.url;
  image.onload = function (event) {
      var img = event.target;
	  context.drawImage(img, imgX, imgY, avatarSize, avatarSize);
  };
   
  x += avatarSize + intervalX;
  //绘制名称
  context.fillStyle = "white";
  context.fillText(data.name + "", x, startY + i * preOffsetY + textOffsetY, textMaxSize);
  x += textMaxSize + intervalX;
  //绘制分数
  context.fillStyle = "#3e3633";
  var y = startY + i * preOffsetY + textOffsetY;
  context.fillText(data.scroes + "", x, y, textMaxSize);  
  
  
  // 汉字：层
  context.drawImage(assets.ceng, x + 60, y - 38, 38, 47);
}

/**
 * 点击处理
 */
// function onTouchEnd(event) {
  // let x = event.clientX * sharedCanvas.width / canvasWidth;
  // let y = event.clientY * sharedCanvas.height / canvasHeight;
  // if (x > lastButtonX && x < lastButtonX + buttonWidth
    // && y > lastButtonY && y < lastButtonY + buttonHeight) {
    // //在last按钮的范围内
    // if (page > 0) {
      // buttonClick(0);
    // }
  // }
  // if (x > nextButtonX && x < nextButtonX + buttonWidth
    // && y > nextButtonY && y < nextButtonY + buttonHeight) {
    // //在next按钮的范围内
    // if ((page + 1) * perPageMaxNum < totalGroup.length) {
      // buttonClick(1);
    // }
  // }

// }
/**
 * 根据传入的buttonKey 执行点击处理
 * 0 为上一页按钮
 * 1 为下一页按钮
 */
// function buttonClick(buttonKey) {
  // let old_buttonY;
  // if (buttonKey == 0) {
    // //上一页按钮
    // old_buttonY = lastButtonY;
    // lastButtonY += 10;
    // page--;
    // renderDirty = true;
    // console.log('上一页');
    // setTimeout(() => {
      // lastButtonY = old_buttonY;
      // //重新渲染必须标脏
      // renderDirty = true;
    // }, 100);
  // } else if (buttonKey == 1) {
    // //下一页按钮
    // old_buttonY = nextButtonY;
    // nextButtonY += 10;
    // page++;
    // renderDirty = true;
    // console.log('下一页');
    // setTimeout(() => {
      // nextButtonY = old_buttonY;
      // //重新渲染必须标脏
      // renderDirty = true;
    // }, 100);
  // }
// }

function getUserCloudStorage() {
  wx.getUserCloudStorage({
	  keyList: ["score"],
	  success: (res) => {
		console.log(getByKey(res.KVDataList, "score"));
	  },
	  fail: () => {
		console.log("get failed");
	  }
  });
}

function getFriendCloudStorage() {
  wx.getFriendCloudStorage({
	  keyList: ["score", "scoreDay"],
	  success: (res) => {
		totalGroup = [];
		var data = res.data;
		var len = data.length;
		for (var i = 0; i < len; i++) {
			var kvs = data[i].KVDataList;
			var score = getByKey(kvs, "score");
			var scoreDay = getByKey(kvs, "scoreDay");
			var nowDay = (new Date()).getDay();
			if (!scoreDay || nowDay - scoreDay >= 7 || nowDay < scoreDay)
				continue;

			totalGroup.push({				
				name: data[i].nickname,
				url: data[i].avatarUrl,
				scroes: score,
				openid: data[i].openid
			});
		}
		
		totalGroup.sort(function (a, b) { return b.scroes - a.scroes; });
		var len = totalGroup.length;
		for (var i = 0; i < len; i++)
			totalGroup[i].key = i + 1;
		
		renderDirty = true;
		return len;
	  },
	  fail: () => {
		console.log("get failed");
	  }
  });
}

function getByKey(kvs, key) {
	for (var i = 0; i < kvs.length; i++) {
		var kv = kvs[i];
		if (kv.key == key)
			return kv.value;
	}
	
	return undefined;
}

wx.onMessage(data => {
	if (data.type === 'setSize') {
		canvasWidth = data.width;
		canvasHeight = data.height;
		init();
	}
    else if (data.type === 'refresh') {
		page = data.pageIndex;
		getFriendCloudStorage();
    } else if (data.type === 'setUserData') {
		wx.getUserCloudStorage({
			keyList: ["score", "scoreDay"],
			success: (r) => {
				var kvs = r.KVDataList;
				var oldScore = getByKey(kvs, "score");
				var oldScoreDay = getByKey(kvs, "scoreDay");
				var newScore = data.score;
				var newScoreDay = (new Date()).getDay();
				
				// 每周一旧分数过期
				if (!oldScoreDay || newScoreDay - oldScoreDay >= 7 || newScoreDay < oldScoreDay)
					oldScore = undefined;

				if (!oldScore || oldScore < data.score) {
					var newScore = data.score;
					var day = 
					wx.setUserCloudStorage({
						KVDataList: [{key:"score", value:newScore.toString()}, {key:"scoreDay", value:newScoreDay.toString()}],
						success: () => {
							console.log("set score ok: " + oldScore + " => " + newScore);
						},
						fail: () => {
							console.log("set score failed: " + oldScore + " => " + newScore);
						}
					});
				}
			},
			fail: () => {
				console.log("get score failed");
			}
		});
	}
});

/////////////////////////////////////////////////////////////////// 相关缓存数据

/**********************数据相关***************************/

/**
 * 渲染标脏量
 * 会在被标脏（true）后重新渲染
 */
let renderDirty = false;

/**
 * 当前绘制组
 */
let currentGroup = [];
/**
 * 每页最多显示个数
 * 建议大于等于4个
 */
let perPageMaxNum = 100;
/**
 * 当前页数,默认0为第一页
 */
let page = 0;
/***********************绘制相关*************************/
/**
 * 舞台大小
 */
// let stageWidth;
// let stageHeight;
/**
 * 排行榜大小
 */
let RankWidth;
let RankHeight;

/**
 * 每个头像条目的大小
 */
let barWidth;
let barHeight;
/**
 * 条目与排行榜边界的水平距离
 */
let offsetX_barToRank
/**
 * 绘制排行榜起始点X
 */
let startX;
/**
 * 绘制排行榜起始点Y
 */
let startY;
/**
 * 每行Y轴间隔offsetY
 */
let preOffsetY;
/**
 * 按钮大小
 */
let buttonWidth;
let buttonHeight;
/**
 * 上一页按钮X坐标
 */
let lastButtonX;
/**
 * 下一页按钮x坐标
 */
let nextButtonX;
/**
 * 上一页按钮y坐标
 */
let lastButtonY;
/**
 * 下一页按钮y坐标
 */
let nextButtonY;
/**
 * 两个按钮的间距
 */
let buttonOffset;

/**
 * 字体大小
 */
let fontSize = 40;
/**
 * 文本文字Y轴偏移量
 * 可以使文本相对于图片大小居中
 */
let textOffsetY;
/**
 * 头像大小
 */
let avatarSize;
/**
 * 名字文本最大宽度，名称会根据
 */
let textMaxSize;
/**
 * 绘制元素之间的间隔量
 */
let intervalX;
/**
 * 排行榜与舞台边界的水平距离
 */
let offsetX_rankToBorder;
/**
 * 排行榜与舞台边界的竖直距离
 */
let offsetY_rankToBorder;
/**
 * 绘制排名的最大宽度
 */
let indexWidth;

//////////////////////////////////////////////////////////
/**
 * 监听点击
 */
// wx.onTouchEnd((event) => {
  // var l = event.changedTouches.length;
  // for (var i = 0; i < l; i++) {
    // onTouchEnd(event.changedTouches[i]);
  // }
// });


/**
 * 资源加载
 */
function preloadAssets() {
  var preloaded = 0;
  var count = 0;
  for (var asset in assets) {
    count++;
    var img = wx.createImage();
    img.onload = function () {
      preloaded++;
      if (preloaded == count) {
        setTimeout(function () {
          createScene();
        }, 500);
      }
    }
    img.src = assets[asset];
    assets[asset] = img;
  }
}
/**
 * 绘制屏幕
 * 这个函数会在加载完所有资源之后被调用
 */
function createScene() {
  if (sharedCanvas.width && sharedCanvas.height) {
    console.log('初始化完成')
    // stageWidth = sharedCanvas.width;
    // stageHeight = sharedCanvas.height;
  } else {
    console.log(`width :${sharedCanvas.width}   height:${sharedCanvas.height}`)
  }
  // init();
  requestAnimationFrame(loop);
}
/**
 * 循环函数
 * 每帧判断一下是否需要渲染
 * 如果被标脏，则重新渲染
 */
function loop() {
  if (renderDirty) {
    console.log(`width :${sharedCanvas.width}   height:${sharedCanvas.height}`)
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
    drawRankPanel();
    renderDirty = false;
  }
  requestAnimationFrame(loop);
}
