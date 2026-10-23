import Foundation
import Capacitor
import StoreKit

/// 角色永久解锁的 StoreKit 2 内购桥(非消耗型商品),JS 侧见 client/src/Platform.ts 的 IapService。
/// JS 名 "RdsIap",在 MainViewController 里注册。
///
/// 方法(都返回 Promise):
///   getProducts({ productIds })  -> { products: [{ id, displayName, displayPrice }] }
///   purchase({ productId })      -> { result: "ok" | "cancel" | "pending" | "error", productId?, message? }
///   restore()                    -> { productIds }  先与 App Store 同步(可能弹 Apple ID 登录),只在用户点"恢复购买"时调用
///   getEntitlements()            -> { productIds }  只读本机已知权益,不弹窗,启动时用
/// 事件:
///   transactionUpdated { productId }  商店推送的新交易(中断后完成、"询问购买"被批准、其它设备购买)
@objc(RdsIapPlugin)
public class RdsIapPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RdsIapPlugin"
    public let jsName = "RdsIap"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getEntitlements", returnType: CAPPluginReturnPromise)
    ]

    private var updatesTask: Task<Void, Never>?

    override public func load() {
        // 尽早开始监听,否则 App 不在前台时完成的交易会被漏掉(Apple 要求)
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                await self?.handleUpdate(result)
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    private func handleUpdate(_ result: VerificationResult<Transaction>) async {
        // 校验不通过的交易不发货也不 finish
        guard case .verified(let transaction) = result else { return }
        if transaction.revocationDate == nil {
            // JS 可能还没注册监听(启动早期),保留到被消费
            notifyListeners("transactionUpdated", data: ["productId": transaction.productID], retainUntilConsumed: true)
        }
        await transaction.finish()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds")?.compactMap { $0 as? String } ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                call.resolve([
                    "products": products.map { product -> [String: Any] in
                        ["id": product.id, "displayName": product.displayName, "displayPrice": product.displayPrice]
                    }
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId is required")
            return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.resolve(["result": "error", "message": "product not found: \(productId)"])
                    return
                }
                switch try await product.purchase() {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        call.resolve(["result": "error", "message": "transaction failed verification"])
                        return
                    }
                    await transaction.finish()
                    call.resolve(["result": "ok", "productId": transaction.productID])
                case .userCancelled:
                    call.resolve(["result": "cancel"])
                case .pending:
                    // "询问购买"等待批准:批准后由 Transaction.updates 推送 transactionUpdated
                    call.resolve(["result": "pending"])
                @unknown default:
                    call.resolve(["result": "error", "message": "unknown purchase result"])
                }
            } catch {
                call.resolve(["result": "error", "message": error.localizedDescription])
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
            } catch {
                // 用户取消登录等:仍返回本机已知的权益
            }
            let productIds = await RdsIapPlugin.entitledProductIds()
            call.resolve(["productIds": productIds])
        }
    }

    @objc func getEntitlements(_ call: CAPPluginCall) {
        Task {
            let productIds = await RdsIapPlugin.entitledProductIds()
            call.resolve(["productIds": productIds])
        }
    }

    /// 当前有效(已购且未退款)的非消耗型商品
    private static func entitledProductIds() async -> [String] {
        var ids: [String] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result, transaction.revocationDate == nil {
                ids.append(transaction.productID)
            }
        }
        return ids
    }
}
