import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const TAX_TYPES = ["House Tax", "Land Tax", "Business Tax", "Water Bill"];
const PAYMENT_METHODS = ["Cash", "eSewa", "Khalti", "Bank"];

export default function TaxPayment() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [taxType, setTaxType] = useState(TAX_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadPayments() {
    try {
      const res = await api.get("/citizen/tax-payments");
      setPayments(res.data.payments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPayments(); }, []);

  async function handlePay(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post("/tax/pay", { tax_type: taxType, amount, payment_method: paymentMethod });
      const { payment_id, requires_payment_confirmation } = res.data;

      if (requires_payment_confirmation) {
        // eSewa selected — go through the dummy gateway (login + pay) before
        // this payment is actually marked Paid.
        navigate(`/citizen/tax/esewa/${payment_id}`, { state: { amount } });
      } else {
        setMessage({ type: "success", text: "Payment recorded successfully." });
        setAmount("");
        loadPayments();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Payment failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.taxPayment")}>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Make a Payment</h3>
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Tax Type</label>
              <select
                value={taxType} onChange={(e) => setTaxType(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              >
                {TAX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Amount (Rs.)</label>
              <input
                type="number" required min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Payment Method</label>
              <select
                value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              >
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {message && (
              <p className={`text-sm rounded-lg px-3 py-2 border ${
                message.type === "success"
                  ? "text-portal-success bg-portal-success/10 border-portal-success/30"
                  : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
              }`}>
                {message.text}
              </p>
            )}
            <button className="w-full bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg py-2.5">
              Pay Now
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Payment History</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-portal-muted text-sm">No payments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {payments.map((p) => (
                <li key={p.payment_id} className="flex justify-between border-b border-portal-panel-border/50 pb-2">
                  <span className="text-portal-text">{p.tax_type}</span>
                  <span className="text-portal-muted">Rs. {p.amount} · {p.payment_method}</span>
                  <span className={p.payment_status === "Paid" ? "text-portal-success" : "text-portal-accent"}>
                    {p.payment_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
