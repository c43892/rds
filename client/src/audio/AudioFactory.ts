
// 操作音频
class AudioFactory {

    static soundsCache = {};
    public static clearCache() {
        for (var r in AudioFactory.soundsCache)
            AudioFactory.soundsCache[r].stop();

        AudioFactory.soundsCache = {};
    }

    public static AudioOn = 1;

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