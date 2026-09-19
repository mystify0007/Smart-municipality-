import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function Marketplace() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data.products))
      .finally(() => setLoading(false));
  }, []);

  async function addToCart(productId) {
    setMessage(null);
    try {
      await api.post("/cart/items", { product_id: productId, quantity: 1 });
      setMessage({ type: "success", text: "Added to cart!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to add to cart" });
    }
  }

  return (
    <DashboardLayout title={t("title.marketplace")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
          {message.type === "success" && (
            <> · <Link to="/cart" className="underline">View Cart</Link></>
          )}
        </p>
      )}

      {loading ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-portal-muted text-sm">No products listed yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {products.map((p) => (
            <div key={p.product_id} className="bg-portal-panel border border-portal-panel-border rounded-xl overflow-hidden">
              {p.image && (
                <img src={p.image} alt={p.product_name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <p className="text-portal-text font-medium">{p.product_name}</p>
                <p className="text-portal-muted text-sm mb-2">{p.business_name}</p>
                <p className="text-portal-success font-semibold mb-3">Rs. {p.price}</p>
                <button
                  onClick={() => addToCart(p.product_id)}
                  className="w-full bg-portal-primary hover:bg-portal-primary-hover text-white text-sm font-medium rounded-lg py-2"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
