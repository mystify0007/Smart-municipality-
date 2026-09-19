import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function MarketplaceManagement() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, ordersRes] = await Promise.all([
        api.get("/admin/marketplace/products"),
        api.get("/admin/marketplace/orders"),
      ]);
      setProducts(productsRes.data.products);
      setOrders(ordersRes.data.orders);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleRemove(id) {
    setMessage(null);
    try {
      await api.patch(`/admin/marketplace/products/${id}/remove`);
      setMessage({ type: "success", text: "Product removed from marketplace." });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Action failed" });
    }
  }

  async function handleRestore(id) {
    setMessage(null);
    try {
      await api.patch(`/admin/marketplace/products/${id}/restore`);
      setMessage({ type: "success", text: "Product restored." });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Action failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.marketplaceManagement")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="flex gap-2 mb-4">
        {["products", "orders"].map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${
              tab === tabName
                ? "bg-portal-primary text-white border-portal-primary"
                : "bg-portal-panel text-portal-muted border-portal-panel-border hover:text-portal-text"
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : tab === "products" ? (
          products.length === 0 ? (
            <p className="text-portal-muted text-sm">No products listed.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                  <th className="pb-2 font-normal">Product</th>
                  <th className="pb-2 font-normal">Business</th>
                  <th className="pb-2 font-normal">Category</th>
                  <th className="pb-2 font-normal">Price</th>
                  <th className="pb-2 font-normal">Status</th>
                  <th className="pb-2 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.product_id} className="border-b border-portal-panel-border/50">
                    <td className="py-3 text-portal-text">{p.product_name}</td>
                    <td className="py-3 text-portal-muted">{p.business_name || "—"}</td>
                    <td className="py-3 text-portal-muted">{p.category_name || "—"}</td>
                    <td className="py-3 text-portal-text">Rs. {p.price}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${
                        p.is_removed ? "bg-portal-danger/15 text-portal-danger" : "bg-portal-success/15 text-portal-success"
                      }`}>
                        {p.is_removed ? "Removed" : p.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {p.is_removed ? (
                        <button
                          onClick={() => handleRestore(p.product_id)}
                          className="text-xs bg-portal-success/15 text-portal-success px-2.5 py-1 rounded-lg hover:bg-portal-success/25"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemove(p.product_id)}
                          className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : orders.length === 0 ? (
          <p className="text-portal-muted text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Order</th>
                <th className="pb-2 font-normal">Buyer</th>
                <th className="pb-2 font-normal">Amount</th>
                <th className="pb-2 font-normal">Payment</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.order_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">#{o.order_id}</td>
                  <td className="py-3 text-portal-muted">{o.buyer_name}</td>
                  <td className="py-3 text-portal-text">Rs. {o.total_amount}</td>
                  <td className="py-3 text-portal-muted">{o.payment_method} — {o.payment_status}</td>
                  <td className="py-3 text-portal-muted">{o.order_status}</td>
                  <td className="py-3 text-portal-muted">{new Date(o.order_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
