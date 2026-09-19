import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const TRACKING_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

function OrderTracker({ order }) {
  if (order.order_status === "Cancelled") {
    return (
      <div className="flex items-center gap-2 text-portal-danger text-sm">
        <span className="w-2 h-2 rounded-full bg-portal-danger" /> Order Cancelled
      </div>
    );
  }

  const currentIndex = TRACKING_STEPS.indexOf(order.order_status);

  return (
    <div className="flex items-center">
      {TRACKING_STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  reached ? "bg-portal-primary text-white" : "bg-portal-panel-border text-portal-muted"
                }`}
              >
                {reached ? "✓" : i + 1}
              </div>
              <span className={`text-xs mt-1 ${reached ? "text-portal-text" : "text-portal-muted"}`}>
                {step}
              </span>
            </div>
            {i < TRACKING_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${i < currentIndex ? "bg-portal-primary" : "bg-portal-panel-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const justPlacedOrderId = location.state?.justPlacedOrderId;

  useEffect(() => {
    api.get("/orders/mine")
      .then((res) => setOrders(res.data.orders))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title={t("title.myOrders")}>
      {justPlacedOrderId && (
        <p className="mb-6 text-sm text-portal-success bg-portal-success/10 border border-portal-success/30 rounded-lg px-4 py-3 inline-block">
          Order #{justPlacedOrderId} placed successfully! Track its progress below.
        </p>
      )}

      {loading ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-portal-muted text-sm">No orders yet. Visit the Marketplace to place one.</p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-portal-text font-medium">Order #{order.order_id}</p>
                  <p className="text-portal-muted text-sm">
                    {new Date(order.order_date).toLocaleDateString()} · Rs. {order.total_amount}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${
                    order.payment_status === "Paid"
                      ? "bg-portal-success/15 text-portal-success"
                      : "bg-portal-accent/15 text-portal-accent"
                  }`}>
                    {order.payment_status} · {order.payment_method}
                  </span>
                  {order.transaction_id && (
                    <p className="text-xs text-portal-muted mt-1">Ref: {order.transaction_id}</p>
                  )}
                </div>
              </div>

              <OrderTracker order={order} />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
