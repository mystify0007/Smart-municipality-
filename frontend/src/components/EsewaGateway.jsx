import { useState } from "react";

// Simulates the real eSewa experience: the user is redirected to eSewa's own
// branded page, logs in with their eSewa ID + password/PIN there, THEN
// confirms the payment amount. Only after both steps does the payment
// actually get marked Paid — this component owns that two-step flow and
// calls `onConfirm` (an async function) only once the "login" has passed.
//
// Since there's no real eSewa account system here, the "login" step accepts
// any non-empty ID and a 4+ digit PIN — it's a UX gate, not real auth, and
// no credentials are sent anywhere or stored.
export default function EsewaGateway({ referenceLabel, amount, onConfirm, onSuccessRedirect }) {
  const [step, setStep] = useState("login"); // login | pay | processing | success | error
  const [esewaId, setEsewaId] = useState("");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [payError, setPayError] = useState("");
  const [transactionId, setTransactionId] = useState(null);

  function handleLogin(e) {
    e.preventDefault();
    setLoginError("");

    if (!esewaId.trim()) {
      setLoginError("Please enter your eSewa ID.");
      return;
    }
    if (!/^\d{4,}$/.test(pin)) {
      setLoginError("PIN must be at least 4 digits.");
      return;
    }

    // Dummy "authentication" — no real verification happens, this is a
    // demo gateway. A short delay makes it feel like a real login attempt.
    setStep("verifying");
    setTimeout(() => setStep("pay"), 800);
  }

  async function handlePay() {
    setStep("processing");
    setPayError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = await onConfirm();
      setTransactionId(result?.transaction_id || null);
      setStep("success");
      setTimeout(onSuccessRedirect, 1500);
    } catch (err) {
      setPayError(err.response?.data?.error || "Payment failed. Please try again.");
      setStep("pay");
    }
  }

  return (
    <div className="min-h-screen bg-[#e9f7ef] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-[#60bb46] px-6 py-5 text-center">
          <p className="text-white text-2xl font-bold tracking-tight">eSewa</p>
          <p className="text-white/80 text-xs mt-0.5">Simulated Payment Gateway (Dummy)</p>
        </div>

        <div className="p-6">
          {step === "login" || step === "verifying" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-gray-500 text-sm text-center mb-2">
                Log in to your eSewa account to continue
              </p>

              <div>
                <label className="block text-xs text-gray-500 mb-1">eSewa ID (mobile number)</label>
                <input
                  type="text" value={esewaId} onChange={(e) => setEsewaId(e.target.value)}
                  placeholder="98XXXXXXXX"
                  disabled={step === "verifying"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#60bb46]"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Password / PIN</label>
                <input
                  type="password" value={pin} onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  disabled={step === "verifying"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#60bb46]"
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={step === "verifying"}
                className="w-full bg-[#60bb46] hover:bg-[#4fa438] disabled:opacity-60 text-white font-semibold rounded-lg py-3 transition-colors"
              >
                {step === "verifying" ? "Verifying..." : "Log In"}
              </button>

              <p className="text-xs text-gray-400 text-center mt-2">
                Demo only — any ID and a 4+ digit PIN will work. No real eSewa account is contacted.
              </p>
            </form>
          ) : step === "pay" || step === "processing" ? (
            <>
              <p className="text-gray-500 text-sm mb-1">{referenceLabel}</p>
              <p className="text-gray-900 text-3xl font-bold mb-6">
                Rs. {amount ? Number(amount).toFixed(2) : "—"}
              </p>

              {payError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                  {payError}
                </p>
              )}

              <button
                onClick={handlePay}
                disabled={step === "processing"}
                className="w-full bg-[#60bb46] hover:bg-[#4fa438] disabled:opacity-60 text-white font-semibold rounded-lg py-3 transition-colors"
              >
                {step === "processing" ? "Processing payment..." : "Pay Now"}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                This is a demo screen only. No real payment is processed.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#60bb46]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-gray-900 font-semibold text-lg">Payment Successful</p>
              {transactionId && (
                <p className="text-gray-400 text-xs mt-1">Ref: {transactionId}</p>
              )}
              <p className="text-gray-500 text-sm mt-2">Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
