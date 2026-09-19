import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import EsewaGateway from "../../components/EsewaGateway";

export default function EsewaTaxPayment() {
  const { paymentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const amount = location.state?.amount;

  async function handleConfirm() {
    const res = await api.patch(`/tax/${paymentId}/confirm-payment`);
    return res.data;
  }

  return (
    <EsewaGateway
      referenceLabel={`Tax Payment #${paymentId}`}
      amount={amount}
      onConfirm={handleConfirm}
      onSuccessRedirect={() => navigate("/citizen/tax")}
    />
  );
}
