import Capacitor
import StoreKit
import UIKit

@objc(RDSViewController)
class RDSViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(RDSStorePlugin())
    }
}

@objc(RDSStorePlugin)
class RDSStorePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "RDSStorePlugin"
    let jsName = "RDSStore"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "legacySave", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openPage", returnType: CAPPluginReturnPromise)
    ]
    private let allowedIDs: Set<String> = ["unlock_rogue", "Horticulturist"]

    @objc func openPage(_ call: CAPPluginCall) {
        let pages = ["privacy": "https://c43892.github.io/rds/privacy.html",
                     "support": "https://c43892.github.io/rds/support.html"]
        guard let page = call.getString("page"), let address = pages[page],
              let url = URL(string: address) else { call.reject("Unknown page"); return }
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { success in
                if success { call.resolve() } else { call.reject("Cannot open page") }
            }
        }
    }

    @objc func legacySave(_ call: CAPPluginCall) {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let file = documents.appendingPathComponent("localStorageFile")
        let save = (try? String(contentsOf: file, encoding: .utf8)) ?? ""
        call.resolve(["save": save])
    }

    @objc func products(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                let products = try await Product.products(for: allowedIDs)
                call.resolve(["products": products.filter { $0.type == .nonConsumable }.map {
                    ["id": $0.id, "price": $0.displayPrice]
                }])
            } catch { call.reject("Could not load App Store products", nil, error) }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("productId"), allowedIDs.contains(id) else {
            call.reject("Unknown product"); return
        }
        Task { @MainActor in
            do {
                guard AppStore.canMakePayments,
                      let product = try await Product.products(for: [id]).first,
                      product.type == .nonConsumable else {
                    call.reject("Product unavailable or payments disabled"); return
                }
                switch try await product.purchase() {
                case .success(let result):
                    guard case .verified(let transaction) = result,
                          transaction.productID == id,
                          transaction.revocationDate == nil else {
                        call.reject("Transaction verification failed"); return
                    }
                    // Keep delivery recoverable: finish only after the JS side
                    // has persisted the entitlement, through restore().
                    call.resolve(["status": "ok", "productId": transaction.productID])
                case .userCancelled: call.resolve(["status": "cancel"])
                case .pending: call.resolve(["status": "pending"])
                @unknown default: call.resolve(["status": "error"])
                }
            } catch { call.reject("Purchase failed", nil, error) }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                if call.getBool("sync") ?? true { try await AppStore.sync() }
                var owned: [String] = []
                for await result in Transaction.currentEntitlements {
                    guard case .verified(let transaction) = result,
                          allowedIDs.contains(transaction.productID),
                          transaction.productType == .nonConsumable,
                          transaction.revocationDate == nil else { continue }
                    owned.append(transaction.productID)
                }
                call.resolve(["productIds": owned])
            } catch { call.reject("Restore failed", nil, error) }
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let id = call.getString("productId"), allowedIDs.contains(id) else {
            call.reject("Unknown product"); return
        }
        Task { @MainActor in
            for await result in Transaction.unfinished {
                if case .verified(let transaction) = result,
                   transaction.productID == id, transaction.revocationDate == nil {
                    await transaction.finish()
                }
            }
            call.resolve()
        }
    }
}
