import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function BusinessDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          api.get("/products/mine"),
          api.get("/orders/business"),
        ]);
        setProducts(productsRes.data.products);
        setOrders(ordersRes.data.orders);
      } catch {
        // likely means no business profile row exists yet — handled in UI below
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout title={t("title.businessDashboard")}>
      <div className="bg-gradient-to-r from-portal-primary/20 to-transparent border border-portal-panel-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-portal-text">Welcome back, {user?.full_name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
          <p className="text-xs text-portal-muted uppercase tracking-wide">My Listings</p>
          <p className="text-2xl font-semibold text-portal-text mt-1">{products.length}</p>
        </div>
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
          <p className="text-xs text-portal-muted uppercase tracking-wide">Incoming Orders</p>
          <p className="text-2xl font-semibold text-portal-text mt-1">{orders.length}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : (
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Recent Orders</h3>
          {orders.length === 0 ? (
            <p className="text-portal-muted text-sm">
              No orders yet. Note: if this business account was just registered, a matching
              row in the <code>businesses</code> table needs to exist for orders/products to work.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {orders.slice(0, 5).map((o, i) => (
                <li key={i} className="flex justify-between border-b border-portal-panel-border/50 pb-2">
                  <span className="text-portal-text">{o.product_name} × {o.quantity}</span>
                  <span className="text-portal-muted">{o.buyer_name}</span>
                  <span className="text-portal-accent">{o.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
