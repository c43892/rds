#import "ViewController.h"
#import "ZipArchive.h"

@import GoogleMobileAds;

@interface ViewController ()

@end

@implementation ViewController {
    NSString* _zipName;
    NSString* _host;
    NSString* _gameUrl;
}

bool notified;

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
    
    _zipName = @"game.zip";
    _host = @"http://localhost/game/";
    _gameUrl = [_host stringByAppendingString:@"index.html"];
    NSString* zipFilePath = [[NSBundle mainBundle] pathForResource:_zipName ofType:nil];
    
    [EgretWebViewLib initialize:@"/egretGame/preload/"];
    
    [self setExternalInterfaces];
    
    if ([EgretWebViewLib checkLoaded:zipFilePath Host:_host]) {
        [EgretWebViewLib startLocalServer];
        [EgretWebViewLib startGame:_gameUrl SuperView:self.view];
    } else {
        ZipFileLoader* loader = [EgretWebViewLib createZipFileLoader:zipFilePath Host:_host Delegate:self];
        [loader start];
    }
    
    [GADMobileAds configureWithApplicationID:@"ca-app-pub-3940256099942544~3347511713"];
    [GADRewardBasedVideoAd sharedInstance].delegate = self;
    [self loadAds];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)setExternalInterfaces {
    [EgretWebViewLib setExternalInterface:@"callNative" Callback:^(NSString* msg) {
        NSLog(@"message: %@", msg);
        [EgretWebViewLib callExternalInterface:@"callJS" Value:@"message from native"];
    }];
	
	[EgretWebViewLib setExternalInterface:@"rdsLoadLocalStorageData" Callback:^(NSString* msg) {
        NSString* docPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
        NSString* strPath = [docPath stringByAppendingPathComponent:@"localStorageFile"];
        NSString* str = [NSString stringWithContentsOfFile:strPath encoding:NSUTF8StringEncoding error:nil];
        [EgretWebViewLib callExternalInterface:@"rdsLoadLocalStorageDataCallback" Value:str];
    }];

    [EgretWebViewLib setExternalInterface:@"rdsSaveLocalStorageData" Callback:^(NSString* data) {
        NSString* docPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
        NSString* strPath = [docPath stringByAppendingPathComponent:@"localStorageFile"];
        [data writeToFile:strPath atomically:YES encoding:NSUTF8StringEncoding error:nil];
    }];
    
    [EgretWebViewLib setExternalInterface:@"rdsPlayRewardAds" Callback:^(NSString *s) {
        [self playRewardAd];
    }];
}

- (void)playRewardAd {
    if ([[GADRewardBasedVideoAd sharedInstance] isReady]) {
        NSLog(@"play ad");
        [[GADRewardBasedVideoAd sharedInstance] presentFromRootViewController:self];
    }
}

- (void)loadAds {
    notified = false;
    [[GADRewardBasedVideoAd sharedInstance] loadRequest:[GADRequest request]
                                           withAdUnitID:@"ca-app-pub-3940256099942544/5224354917"];
}

- (void)onStart:(long)fileCount Size:(long)totalSize {
    NSLog(@"onStart %ld %ld", fileCount, totalSize);
}

- (void)onProgress:(NSString*)filePath Loaded:(long)loaded Error:(long)error Total:(long)total {
    NSLog(@"onProgress %@ %ld %ld %ld", @"", loaded, error, total);
}

- (void)onError:(NSString*)urlStr Msg:(NSString*)errMsg {
    NSLog(@"onError %@ %@", urlStr, errMsg);
}

- (void)onStop {
    NSLog(@"onStop");
    
    __block NSString* gameUrl = _gameUrl;
    dispatch_async(dispatch_get_main_queue(), ^{
        [EgretWebViewLib startLocalServer];
        [EgretWebViewLib startGame:gameUrl SuperView:self.view];
    });
}

- (bool)onUnZip:(NSString*)zipFilePath DstDir:(NSString*)dstDir {
    ZipArchive* zip = [[ZipArchive alloc] init];
    if (![zip UnzipOpenFile:zipFilePath]) {
        NSLog(@"failed to open zip file");
        return false;
    }
    
    bool result = [zip UnzipFileTo:dstDir overWrite:YES];
    if (!result) {
        NSLog(@"failed to unzip files");
        return false;
    }
    [zip UnzipCloseFile];
    return true;
}

- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd
   didRewardUserWithReward:(nonnull GADAdReward *)reward {
    NSString *rewardMessage = [NSString stringWithFormat:@"reward received with currency %@, amount %lf",
        reward.type,
     [reward.amount doubleValue]];
    NSLog(rewardMessage);
}

- (void)rewardBasedVideoAdDidReceiveAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
    [EgretWebViewLib callExternalInterface:@"notifyAdMobLoaded" Value:@""];
    NSLog(@"ad loaded");
    // [self playRewardAd];
}
- (void)rewardBasedVideoAdDidOpen:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
    
}

- (void)rewardBasedVideoAdDidStartPlaying:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
    
}

- (void)rewardBasedVideoAdDidCompletePlaying:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
    notified = true;
    [EgretWebViewLib callExternalInterface:@"notifyRewardAdCompleted" Value:@""];
    
}

- (void)rewardBasedVideoAdDidClose:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
    if (!notified) {
        notified = true;
        [EgretWebViewLib callExternalInterface:@"notifyRewardAdCompleted" Value:@"canceled"];
    }
    
    [self loadAds];
}

- (void)rewardBasedVideoAdWillLeaveApplication:(GADRewardBasedVideoAd *)rewardBasedVideoAd {
    
}

- (void)rewardBasedVideoAd:(GADRewardBasedVideoAd *)rewardBasedVideoAd
    didFailToLoadWithError:(nonnull NSError *)error {
    NSLog(@"Reward based video ad failed to load. %@", error);
	[self loadAds];
}

@end
