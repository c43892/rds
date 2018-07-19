// 排行榜视图
class RankingView extends egret.DisplayObjectContainer {    

    rankingImg;    
    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
    }

    doClose;
    public open(bmp:egret.Bitmap):Promise<void> {
        if (this.rankingImg) this.removeChild(this.rankingImg);
        this.rankingImg = bmp;
        this.addChild(this.rankingImg);
        this.rankingImg.width = this.width;
        this.rankingImg.height = this.height;
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }
    
    public onTouch(evt:egret.TouchEvent) {
        this.doClose();
    }
}
