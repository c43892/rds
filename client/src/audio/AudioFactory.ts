
// 操作音频
class AudioFactory {

    static soundsCache = {};
    public static clearCache() {
        for (var r in AudioFactory.soundsCache)
            AudioFactory.soundsCache[r].stop();

        AudioFactory.soundsCache = {};
        AudioFactory.bgs = {};
        AudioFactory.curBgs = undefined;
    }

    public static AudioOn = 1;

    static bgs = {};
    static curBgs = undefined;
    public static playBg(bg:string) {
        if (AudioFactory.curBgs) {
            if (AudioFactory.curBgs.name == bg)
                return;
            else
                AudioFactory.curBgs.ch.stop();
        }

        if (!AudioFactory.bgs[bg]) {
            var s:egret.Sound = ResMgr.getRes(bg + "_mp3");
            if (!s)
                return;

            AudioFactory.bgs[bg] = s;
        }

        AudioFactory.curBgs = {name:bg, ch:AudioFactory.bgs[bg].play(0, -1)};
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