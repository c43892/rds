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
    private final String APP_ID = "ca-app-pub-3940256099942544~3347511713"; //  test if
    private final String AD_UNIT_ID = "ca-app-pub-3940256099942544/5224354917"; // test id
    // private final String APP_ID = "ca-app-pub-1800218346925652~6940599097";
    // private final String AD_UNIT_ID = "ca-app-pub-1800218346925652/3739720681";

    /*
    * 设置是否显示FPS面板
    *   true: 显示面板
    *   false: 隐藏面板
    * Set whether to show FPS panel
    *   true: show FPS panel
    *   false: hide FPS panel
    * */
    private final boolean showFPS = true;

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

        MobileAds.initialize(this, APP_ID);
        mAds = MobileAds.getRewardedVideoAdInstance(this);
        mAds.setRewardedVideoAdListener(this);
        loadAds();
    }

    /*private void setExternalInterfaces() {
        launcher.setExternalInterface("callNative", new INativePlayer.INativeInterface() {
            @Override
            public void callback(String s) {
                Log.d("Egret Launcher", s);
                launcher.callExternalInterface("callJS", "message from native");
            }
        });
    }*/

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

    boolean notified;
    private void loadAds() {
        notified = false;
        if (!mAds.isLoaded()) {
            AdRequest.Builder bd = new AdRequest.Builder();
            // bd.addTestDevice("D27B095B86C70BF9C00B72DE5AC77015");
            mAds.loadAd(AD_UNIT_ID, bd.build());
        }
    }

    @Override
    public void onRewardedVideoAdClosed() {
        if (!notified) {
            notified = true;
            launcher.callExternalInterface("notifyRewardAdCompleted", "canceled");
        }

        loadAds();
    }

    @Override
    public void onRewarded(RewardItem rewardItem) {
        notified = true;
        launcher.callExternalInterface("notifyRewardAdCompleted", "");
    }

    @Override
    public void onRewardedVideoAdLeftApplication() {

    }

    @Override
    public void onRewardedVideoAdFailedToLoad(int i) {
        Log.println(Log.DEBUG, "ads", "failed to load ads");
        loadAds();
    }

    @Override
    public void onRewardedVideoCompleted() {
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
}
