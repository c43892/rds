# iOS 打包与上架

iOS 包 = `public/` 网页版游戏 + Capacitor 7 壳(`ios/`,Swift Package Manager,不需要 CocoaPods)。
内购是自写的 StoreKit 2 插件 `ios/App/App/RdsIapPlugin.swift`,JS 侧在 `client/src/Platform.ts` 的 `IapService`。

## 在 Mac 上编译运行

需要 Node 18+、Xcode 16+。

```bash
cd rds-pixi
npm install
npx cap sync ios          # 把 public/ 拷进 ios/App/App/public,生成 capacitor.config.json
npx cap open ios          # 或直接打开 ios/App/App.xcodeproj
```

首次打开 Xcode 会自动拉取 `capacitor-swift-pm` 包。然后:

1. App target → Signing & Capabilities:选 Team;`+ Capability` → In-App Purchase。
2. 本地测内购(不需要 App Store Connect):Product → Scheme → Edit Scheme → Run → Options →
   StoreKit Configuration 选 `Products.storekit`。模拟器里即可测购买、恢复购买;
   "询问购买"/退款在 Debug → StoreKit → Manage Transactions 里模拟。
3. 改了游戏代码:`npm run build && npx cap sync ios`。

## App Store Connect

- 新建 App,Bundle ID `com.c43892.rds`(要改就同时改 `capacitor.config.json` 的 `appId` 和 Xcode 里的 Bundle Identifier)。
- 签"付费 App"协议并填好税务/银行信息,否则内购商品取不到。
- 新建两个**非消耗型**内购,商品 ID 必须与代码一致:
  - `unlock_rogue`(黑帮混混)
  - `unlock_horticulturist`(园艺师)
  
  每个都要填价格、本地化名称/描述、审核截图(选角界面点被锁角色弹出购买确认的截图即可)。
- 首个版本送审时,在版本页"App 内购买项目"里勾上这两个商品一起提交。
- 真机测试用沙盒测试员账号;真机/TestFlight 测试前把 scheme 里的 StoreKit Configuration 改回 None。
- App 隐私:选"不收集数据"。排行榜和打点上报已移除,游戏不联网。
- 隐私政策 URL 必填。
- 出口合规:`Info.plist` 已声明 `ITSAppUsesNonExemptEncryption = NO`。

## 内购流程

| 时机 | 行为 |
| --- | --- |
| 启动 | 拉商店本地化价格;按 App Store 当前权益静默补发已购角色(不弹登录) |
| 点被锁角色 | 确认框显示商店价格 → StoreKit 付款 → 成功后永久解锁 |
| 询问购买 | 提示等待批准;批准后经 `Transaction.updates` 自动到账 |
| 恢复购买 | `AppStore.sync()`(可能弹 Apple ID 登录)后按权益解锁 |

浏览器开发预览(`npm start`,无原生插件)走 mock:购买直接成功。原生包里 `DEBUG` 为 false,不会走 mock。

## 已知事项

- Android 包还没接 Play Billing:点购买会提示失败(以前是白送)。
- 存档在 WebView 的 localStorage。已购角色不受影响(启动时会从 App Store 补发)。
- 显示名 `CFBundleDisplayName` 目前是 "RDS",上架前改成正式名称。
- 启动图是纯黑;图标取自仓库 `icon/1024.png`(已去掉透明通道)。
- 仅支持竖屏,iPad 以全屏运行(`UIRequiresFullScreen`)。
