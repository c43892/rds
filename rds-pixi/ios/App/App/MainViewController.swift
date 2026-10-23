import UIKit
import Capacitor

/// App 的根视图控制器(Main.storyboard 指向本类)。
/// App 内置的本地插件不是 npm 包,`cap sync` 不会自动发现,需在这里注册。
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(RdsIapPlugin())
    }
}
