
// 操作音频
class AudioFactory {

    soundsCache = {};
    public clearCache() {
        for (var r in this.soundsCache)
            this.soundsCache[r].stop();

        this.soundsCache = {};
    }

    // 播放声音
    public play(name, playTimes = 1) {
        if (!this.soundsCache[name])
            this.soundsCache[name] = ResMgr.getRes(name + "_mp3");

        var s = this.soundsCache[name];
        Utils.assert(s, "audio " + name + " has not been loaded");

        var ch = s.play(0, playTimes);
        var wrap = new Promise((r, _) => {
            ch.addEventListener(egret.Event.SOUND_COMPLETE, () => r(), this);
        });

        wrap["stop"] = () => {
            ch.stop();
        };

        return wrap;
    }
}