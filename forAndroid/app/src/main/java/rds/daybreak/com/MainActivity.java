package rds.daybreak.com;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.Toast;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.reward.RewardItem;
import com.google.android.gms.ads.reward.RewardedVideoAd;
import com.google.android.gms.ads.reward.RewardedVideoAdListener;

import org.egret.runtime.launcherInterface.INativePlayer;
import org.egret.egretnativeandroid.EgretNativeAndroid;

//Android项目发布设置详见doc目录下的README_ANDROID.md

public class MainActivity extends Activity implements RewardedVideoAdListener {
    private final String TAG = "MainActivity";
    private EgretNativeAndroid nativeAndroid;
    private RewardedVideoAd mAds;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        nativeAndroid = new EgretNativeAndroid(this);
        if (!nativeAndroid.checkGlEsVersion()) {
            Toast.makeText(this, "This device does not support OpenGL ES 2.0.",
                    Toast.LENGTH_LONG).show();
            return;
        }

        nativeAndroid.config.showFPS = false;
        nativeAndroid.config.fpsLogTime = 30;
        nativeAndroid.config.disableNativeRender = false;
        nativeAndroid.config.clearCache = false;
        nativeAndroid.config.loadingTimeout = 0;

        setExternalInterfaces();
        
        if (!nativeAndroid.initialize("http://tool.egret-labs.org/Weiduan/game/index.html")) {
            Toast.makeText(this, "Initialize native failed.",
                    Toast.LENGTH_LONG).show();
            return;
        }

        setContentView(nativeAndroid.getRootFrameLayout());

        MobileAds.initialize(this, "ca-app-pub-3940256099942544~3347511713");
        mAds = MobileAds.getRewardedVideoAdInstance(this);
        mAds.setRewardedVideoAdListener(this);
        loadAds();
    }

    @Override
    protected void onPause() {
        super.onPause();
        nativeAndroid.pause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        nativeAndroid.resume();
    }

    @Override
    public boolean onKeyDown(final int keyCode, final KeyEvent keyEvent) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            nativeAndroid.exitGame();
        }

        return super.onKeyDown(keyCode, keyEvent);
    }

    private void setExternalInterfaces() {
        nativeAndroid.setExternalInterface("rdsPlayRewardAds", new INativePlayer.INativeInterface() {
            @Override
            public void callback(String s) {
                playRewardAds();
            }
        });
    }

    private void playRewardAds() {
        this.runOnUiThread(new Runnable() {
            @Override public void run() {
                Log.println(Log.DEBUG, "ads", "play ads");
                if (mAds.isLoaded())
                    mAds.show();
            }
        });
    }

    @Override
    public void onRewardedVideoAdLoaded() {
        Log.println(Log.DEBUG, "ads", "ads loaded");
        nativeAndroid.callExternalInterface("notifyAdMobLoaded", "");
    }

    @Override
    public void onRewardedVideoAdOpened() {

    }

    @Override
    public void onRewardedVideoStarted() {

    }

    boolean notified;
    private void loadAds() {
        notified = false;
        mAds.loadAd("ca-app-pub-3940256099942544/5224354917", new AdRequest.Builder().build());
    }

    @Override
    public void onRewardedVideoAdClosed() {
        if (!notified) {
            nativeAndroid.callExternalInterface("notifyRewardAdCompleted", "canceled");
            notified = true;
        }

        loadAds();
    }

    @Override
    public void onRewarded(RewardItem rewardItem) {
        notified = true;
        nativeAndroid.callExternalInterface("notifyRewardAdCompleted", "");
    }

    @Override
    public void onRewardedVideoAdLeftApplication() {

    }

    @Override
    public void onRewardedVideoAdFailedToLoad(int i) {
        Log.println(Log.DEBUG, "ads", "failed to load ads");
    }

    @Override
    public void onRewardedVideoCompleted() {
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
}
