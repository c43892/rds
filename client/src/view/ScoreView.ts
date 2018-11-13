class ScoreView extends egret.DisplayObjectContainer{
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private avatarBg:egret.Bitmap;
    private avatar:egret.Bitmap;
    private finalScore:egret.TextField;
    private playerName:egret.TextField;
    private exp:egret.TextField;
    private level:egret.TextField;

    private scrollContent:egret.DisplayObjectContainer;
    private scrollArea:egret.ScrollView;
    
    private scoreInfo;
    private scoreNum;
    public player:Player;

    constructor(w, h){
        super();
        this.width = w;
        this.height = h;
        this.name = "scoreView";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.bg.name = "bg";

        this.bg1 = ViewUtils.createBitmapByName("scoreViewBg_png");
        this.bg1.name ="bg1";

        this.avatarBg = ViewUtils.createBitmapByName("scoreViewAvatarBg_png");
        this.avatarBg.name = "avatarBg";

        this.avatar = new egret.Bitmap();
        this.avatar.name = "avatar";

        this.playerName = new egret.TextField();
        this.playerName.name ="playerName";

        this.finalScore = new egret.TextField();
        this.finalScore.name = "finalScore";

        this.scrollContent = new egret.DisplayObjectContainer();
        this.scrollContent.name = "scrollContent";
        this.scrollArea = new egret.ScrollView();
        this.scrollArea.name = "scrollArea";
        this.scrollArea.setContent(this.scrollContent);
        this.scrollArea.verticalScrollPolicy = "auto";
        this.scrollArea.horizontalScrollPolicy = "off";
        this.scrollArea.bounces = true;

        var objs = [this.bg1, this.avatarBg, this.avatar, this.playerName, this.finalScore, this.scrollArea]
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

        this.scrollContent.width = this.scrollArea.width;
    }

    open (scoreInfo = []){
        this.scoreInfo = scoreInfo;
        this.scoreNum = scoreInfo.length;

    }
}