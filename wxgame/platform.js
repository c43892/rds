/**
 * 请在白鹭引擎的Main.ts中调用 platform.login() 方法调用至此处。
 */

class WxgamePlatform {

    name = 'wxgame'

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
	
	wxGetUserInfo() {
		return new Promise((resolve, reject) => {
			wx.getUserInfo({
				success: function (res) {
					resolve({ok:true, usr:res.userInfo});
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
				if (!r.ok)
					resolve(r);
					
				this.wxGetUserInfo().then((r) => {
					resolve(r);
				})
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
            })
        })
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
