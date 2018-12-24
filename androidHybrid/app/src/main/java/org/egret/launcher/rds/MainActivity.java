package org.egret.launcher.rds;

import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.widget.FrameLayout;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.reward.RewardItem;
import com.google.android.gms.ads.reward.RewardedVideoAd;
import com.google.android.gms.ads.reward.RewardedVideoAdListener;

import org.egret.launcher.egret_android_launcher.NativeActivity;
import org.egret.launcher.egret_android_launcher.NativeCallback;
import org.egret.launcher.egret_android_launcher.NativeLauncher;
import org.egret.runtime.launcherInterface.INativePlayer;

public class MainActivity extends NativeActivity implements RewardedVideoAdListener {
    private final String token = "5e76eea7bdab035f68e75cf6792287bef4ab0d8eaa0a04f904024cb3f821989c";

    /*
    * 设置是否显示FPS面板
    *   true: 显示面板
    *   false: 隐藏面板
    * Set whether to show FPS panel
    *   true: show FPS panel
    *   false: hide FPS panel
    * */
    private final boolean showFPS = false;

    private FrameLayout rootLayout = null;
    
    private Handler handler = new Handler();

    private RewardedVideoAd mAds;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        rootLayout = (FrameLayout)findViewById(R.id.rootLayout);

        launcher.initViews(rootLayout);

        setExternalInterfaces();

        /*
        * 设置是否自动关闭启动页
        *   1: 自动关闭启动页
        *   0: 手动关闭启动页
        * Set whether to close the startup page automatically
        *   1. close the startup page automatically
        *   0. close the startup page manually
        * */
        launcher.closeLoadingViewAutomatically = 1;

        /*
        * 设置是否每次启动都重新下载游戏资源
        *   0: 版本更新才重新下载
        *   1: 每次启动都重新下载
        * Set whether to re-download game resources each time the application starts
        *   0: re-download game resources if version updated
        *   1: re-download game resources each time the application starts
        * */
        launcher.clearGameCache = 0;

        /*
        * 设置runtime代码log的等级
        *   0: Debug
        *   1: Info
        *   2: Warning
        *   3: Error
        * Set log level for runtime code
        *   0: Debug
        *   1: Info
        *   2: Warning
        *   3: Error
        * */
        launcher.logLevel = 2;

        progressCallback = new NativeCallback() {
            @Override
            public void onCallback(String msg, int val) {
                switch (msg) {
                    case NativeLauncher.RequestingRuntime:
                        /*
                        * 向服务器请求runtime和游戏信息
                        * Request the server for runtime and game information
                        * */
                        break;
                    case NativeLauncher.LoadingRuntime:
                        /*
                        * 下载和加载runtime
                        * Download and load runtime
                        * */
                        break;
                    case NativeLauncher.RetryRequestingRuntime:
                        handler.postDelayed(new Runnable() {
                            @Override
                            public void run() {
                                launcher.loadRuntime(token);
                            }
                        }, 1000);
                        break;
                    case NativeLauncher.LoadingGame:
                        /*
                        * 下载和加载游戏资源
                        * Download and load game resources
                        * */
                        launcher.startRuntime(showFPS);
                        break;
                    case NativeLauncher.GameStarted:
                        /*
                        * 游戏启动
                        * Game started
                        * */
                        break;
                    case NativeLauncher.LoadRuntimeFailed:
                        /*
                        * 加载runtime和游戏信息失败
                        * Loading runtime and game resources failed
                        * */
                        break;
                    default:

                        break;
                }
            }
        };
        launcher.loadRuntime(token);

        MobileAds.initialize(this, "ca-app-pub-3940256099942544~3347511713");
        mAds = MobileAds.getRewardedVideoAdInstance(this);
        mAds.setRewardedVideoAdListener(this);
        mAds.loadAd("ca-app-pub-3940256099942544/5224354917", new AdRequest.Builder().build());
    }

    private void setExternalInterfaces() {
        launcher.setExternalInterface("rdsPlayRewardAds", new INativePlayer.INativeInterface() {
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
        launcher.callExternalInterface("notifyAdMobLoaded", "");
    }

    @Override
    public void onRewardedVideoAdOpened() {

    }

    @Override
    public void onRewardedVideoStarted() {

    }

    @Override
    public void onRewardedVideoAdClosed() {
        launcher.callExternalInterface("notifyRewardAdCompleted", "canceled");
        mAds.loadAd("ca-app-pub-3940256099942544/5224354917", new AdRequest.Builder().build());
    }

    @Override
    public void onRewarded(RewardItem rewardItem) {
        launcher.callExternalInterface("notifyRewardAdCompleted", "");
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
}
