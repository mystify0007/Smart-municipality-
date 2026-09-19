import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function Cart() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  async function loadCart() {
    try {
      const res = await api.get("/cart");
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCart(); }, []);

  async function changeQuantity(cartItemId, newQuantity) {
    setItems((prev) =>
      newQuantity <= 0
        ? prev.filter((i) => i.cart_item_id !== cartItemId)
        : prev.map((i) => (i.cart_item_id === cartItemId ? { ...i, quantity: newQuantity } : i))
    );
    try {
      await api.patch(`/cart/items/${cartItemId}`, { quantity: newQuantity });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update quantity" });
      loadCart();
    }
  }

  async function removeItem(cartItemId) {
    setItems((prev) => prev.filter((i) => i.cart_item_id !== cartItemId));
    try {
      await api.delete(`/cart/items/${cartItemId}`);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to remove item" });
      loadCart();
    }
  }

  async function handleCheckout() {
    setMessage(null);
    setCheckingOut(true);
    try {
      const res = await api.post("/orders/checkout", { payment_method: paymentMethod });
      const { order_id, total_amount, requires_payment_confirmation } = res.data;

      if (requires_payment_confirmation) {
        // eSewa selected — go simulate the gateway redirect before we call this "paid"
        navigate(`/payment/esewa/${order_id}`, { state: { total_amount } });
      } else {
        // COD — order is placed immediately, no payment step needed yet
        navigate("/orders/mine", { state: { justPlacedOrderId: order_id } });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Checkout failed" });
      setCheckingOut(false);
    }
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <DashboardLayout title={t("title.myCart")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 max-w-2xl">
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-portal-muted text-sm">Your cart is empty.</p>
        ) : (
          <>
            <ul className="space-y-3 mb-4">
              {items.map((item) => (
                <li key={item.cart_item_id} className="flex justify-between items-center border-b border-portal-panel-border/50 pb-3">
                  <div>
                    <p className="text-portal-text">{item.name}</p>
                    <p className="text-portal-muted text-sm">Rs. {item.price} each</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-portal-panel-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => changeQuantity(item.cart_item_id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-portal-text hover:bg-white/5"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm text-portal-text">{item.quantity}</span>
                      <button
                        onClick={() => changeQuantity(item.cart_item_id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-portal-text hover:bg-white/5"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-portal-text text-sm w-20 text-right">
                      Rs. {(item.price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => removeItem(item.cart_item_id)}
                      className="text-portal-danger text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center mb-4">
              <span className="text-portal-text font-medium">Total</span>
              <span className="text-portal-success font-semibold">Rs. {total.toFixed(2)}</span>
            </div>

            {/* Payment method selection */}
            <div className="mb-4">
              <p className="text-sm text-portal-muted mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`border rounded-lg py-3 text-sm font-medium transition-colors ${
                    paymentMethod === "COD"
                      ? "border-portal-primary bg-portal-primary/10 text-portal-text"
                      : "border-portal-panel-border text-portal-muted hover:border-portal-muted"
                  }`}
                >
                  💵 Cash on Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("eSewa")}
                  className={`border rounded-lg py-3 text-sm font-medium transition-colors ${
                    paymentMethod === "eSewa"
                      ? "border-portal-primary bg-portal-primary/10 text-portal-text"
                      : "border-portal-panel-border text-portal-muted hover:border-portal-muted"
                  }`}
                >
                  🟢 Pay with eSewa
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5"
            >
              {checkingOut ? "Placing order..." : "Place Order"}
            </button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
