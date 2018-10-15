/**
 * 请在白鹭引擎的Main.ts中调用 platform.login() 方法调用至此处。
 */

class WxgamePlatform {

    name = 'wxgame'
	
	init() {
		wx.showShareMenu();
		wx.onShareAppMessage(() => {
			return {
				title: '魔塔扫雷', // 分享标题
				desc: '和我一起感受扫雷爬塔的乐趣', // 分享描述
				link: 'https://rds.wudouwxg.xyz/', // 分享链接，该链接域名或路径必须与当前页面对应的公众号js安全域名一致
				imageUrl: 'https://rds.wudouwxg.xyz/shareIcon.png', // 分享图标
				type: 'link', // 分享类型,music、video或link，不填默认为link
				success: () => {
					console.log("shared");
					resolve(true);
				},
				fail: () =>  {
					console.log("not shared");
					resolve(false);
				}
			};
		});
	}

    wxLogin() {		
		return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => {
					if (res.errMsg === "login:ok")
						resolve({ok:true});
                },
				fail: (res) => {
					resolve({ok:false});
				}
            });
        });
	}
	
    login() {
		return new Promise((resolve, reject) => {
			this.wxLogin().then((r) => {
				resolve(r);
			});
		});
    }
	
	setUserCloudStorage(data) {
		data.type = "setUserData";
		this.openDataContext.postMessage(data);
    }
	
	removeUserCloudStorage(data) {
        return new Promise((resolve, reject) => {
            wx.removeUserCloudStorage({
				keyList: data, 
                success: () => {
					console.log("remove ok");
                    resolve(true)
                },
				fail: () => {
					console.log("remove failed");
					resolve(false);
				}
            });
        });
    }
	
	canShare() { return true; }
	
	shareGame() {
		wx.shareAppMessage({
			title: '魔塔扫雷', // 分享标题
			desc: '和我一起感受扫雷爬塔的乐趣', // 分享描述
			imageUrl: 'https://rds.wudouwxg.xyz/shareIcon.png', // 分享图标
		});
	}
	
	platformType = "wx";

    openDataContext = new WxgameOpenDataContext();
}

class WxgameOpenDataContext {

    createDisplayObject(type, width, height) {
		this.postMessage({type:"setSize", width:width, height:height});
        const bitmapdata = new egret.BitmapData(sharedCanvas);
        bitmapdata.$deleteSource = false;
        const texture = new egret.Texture();
        texture._setBitmapData(bitmapdata);
        const bitmap = new egret.Bitmap(texture);
        bitmap.width = width; // sharedCanvas.width;
        bitmap.height = height; // sharedCanvas.height;
		bitmap.fillMode = egret.BitmapFillMode.CLIP;

        if (egret.Capabilities.renderMode == "webgl") {
            const renderContext = egret.wxgame.WebGLRenderContext.getInstance();
            const context = renderContext.context;
            ////需要用到最新的微信版本
            ////调用其接口WebGLRenderingContext.wxBindCanvasTexture(number texture, Canvas canvas)
            ////如果没有该接口，会进行如下处理，保证画面渲染正确，但会占用内存。
            if (!context.wxBindCanvasTexture) {
                egret.startTick((timeStarmp) => {
                    egret.WebGLUtils.deleteWebGLTexture(bitmapdata.webGLTexture);
                    bitmapdata.webGLTexture = null;
                    return false;
                }, this);
            }
			
        }
        return bitmap;
    }

    postMessage(data) {
        const openDataContext = wx.getOpenDataContext();
        openDataContext.postMessage(data);
    }
}


window.platform = new WxgamePlatform();
