
// 操作音频
class AudioFactory {

    static soundsCache = {};
    public static clearCache() {
        AudioFactory.stopAll();
        AudioFactory.soundsCache = {};
        AudioFactory.bgs = {};
        AudioFactory.curBgs = undefined;
    }

    static stopAll() {
        if (AudioFactory.curBgs)
            AudioFactory.curBgs.ch.stop();
    }

    static auidoOn = 1;
    public static set AudioOn(on:number) {
        AudioFactory.auidoOn = on;
        if (on) {
            if (AudioFactory.curBgs)
                AudioFactory.curBgs.ch = AudioFactory.curBgs.s.play(0, -1);
        }
        else
            AudioFactory.stopAll();
    }

    public static get AudioOn() {
        return AudioFactory.auidoOn;
    }

    static bgs = {};
    static curBgs = undefined;
    public static playBg(bg:string) {
        if (AudioFactory.curBgs) {
            if (AudioFactory.curBgs.name == bg && AudioFactory.AudioOn)
                return;
            else
                AudioFactory.curBgs.ch.stop();
        }

        var s:egret.Sound;
        if (!AudioFactory.bgs[bg]) {
            s = ResMgr.getRes(bg + "_mp3");
            if (!s)
                return;

            AudioFactory.bgs[bg] = s;
        } else
            s = AudioFactory.bgs[bg];

        AudioFactory.curBgs = {name:bg, s:s, ch:s.play(0, -1)};
        if (AudioFactory.AudioOn == 0)
            AudioFactory.curBgs.ch.stop();
    }

    // 播放声音
    public static play(name, playTimes = 1) {
        if (AudioFactory.AudioOn == 0)
            return;

        if (!AudioFactory.soundsCache[name])
            AudioFactory.soundsCache[name] = ResMgr.getRes(name + "_mp3");

        var s = AudioFactory.soundsCache[name];
        Utils.assert(s, "audio " + name + " has not been loaded");

        var ch = s.play(0, playTimes);
        var wrap = new Promise((r, _) => {
            ch.addEventListener(egret.Event.SOUND_COMPLETE, () => r());
        });

        wrap["stop"] = () => {
            ch.stop();
        };

        return wrap;
    }
}