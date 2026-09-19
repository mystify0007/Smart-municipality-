import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EsewaGateway from "../../components/EsewaGateway";

export default function EsewaPayment() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const totalAmount = location.state?.total_amount;

  async function handleConfirm() {
    const res = await api.patch(`/orders/${orderId}/confirm-payment`);
    return res.data;
  }

  return (
    <EsewaGateway
      referenceLabel={`Order #${orderId}`}
      amount={totalAmount}
      onConfirm={handleConfirm}
      onSuccessRedirect={() => navigate("/orders/mine", { state: { justPlacedOrderId: orderId } })}
    />
  );
}
