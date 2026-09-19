import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Processing: "bg-portal-primary/15 text-portal-primary",
  Shipped: "bg-portal-primary/15 text-portal-primary",
  Delivered: "bg-portal-success/15 text-portal-success",
  Cancelled: "bg-portal-danger/15 text-portal-danger",
};

const NEXT_STATUS = {
  Pending: "Processing",
  Processing: "Shipped",
  Shipped: "Delivered",
};

const ALL_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function BusinessOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);

  async function loadOrders() {
    try {
      const res = await api.get("/orders/business");
      setOrders(res.data.orders);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateStatus(orderId, newStatus) {
    setMessage(null);
    try {
      await api.patch(`/orders/business/${orderId}/status`, { order_status: newStatus });
      setMessage({ type: "success", text: `Order #${orderId} marked ${newStatus}` });
      loadOrders();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  async function togglePaymentStatus(orderId, currentStatus) {
    const nextStatus = currentStatus === "Paid" ? "Pending" : "Paid";
    setMessage(null);
    try {
      await api.patch(`/orders/business/${orderId}/payment-status`, { payment_status: nextStatus });
      setMessage({ type: "success", text: `Order #${orderId} payment marked ${nextStatus}` });
      loadOrders();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.incomingOrders")}>
      {error && <p className="text-portal-danger mb-4">{error}</p>}
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-portal-muted text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Order ID</th>
                <th className="pb-2 font-normal">Product</th>
                <th className="pb-2 font-normal">Buyer</th>
                <th className="pb-2 font-normal">Qty</th>
                <th className="pb-2 font-normal">Payment</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">#{o.order_id}</td>
                  <td className="py-3 text-portal-text">{o.product_name}</td>
                  <td className="py-3 text-portal-muted">{o.buyer_name}</td>
                  <td className="py-3 text-portal-muted">{o.quantity}</td>
                  <td className="py-3 text-portal-muted">{o.payment_method} · {o.payment_status}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[o.order_status] || ""}`}>
                      {o.order_status}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    {NEXT_STATUS[o.order_status] && (
                      <button
                        onClick={() => updateStatus(o.order_id, NEXT_STATUS[o.order_status])}
                        className="text-xs bg-portal-primary/15 text-portal-primary px-2.5 py-1 rounded-lg hover:bg-portal-primary/25"
                      >
                        Mark {NEXT_STATUS[o.order_status]}
                      </button>
                    )}
                    {!["Delivered", "Cancelled"].includes(o.order_status) && (
                      <button
                        onClick={() => updateStatus(o.order_id, "Cancelled")}
                        className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                      >
                        Cancel
                      </button>
                    )}
                    {o.payment_method === "COD" && (
                      <button
                        onClick={() => togglePaymentStatus(o.order_id, o.payment_status)}
                        className={`text-xs px-2.5 py-1 rounded-lg ${
                          o.payment_status === "Paid"
                            ? "bg-portal-muted/15 text-portal-muted hover:bg-portal-muted/25"
                            : "bg-portal-success/15 text-portal-success hover:bg-portal-success/25"
                        }`}
                      >
                        {o.payment_status === "Paid" ? "Mark Unpaid" : "Mark Paid"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
