import StaffLoginForm from "../../components/StaffLoginForm";

export default function StateAdminLogin() {
  return (
    <StaffLoginForm
      heading="State Admin Sign In"
      subheading="State Admin Portal"
      expectedRole="Admin"
      expectedAdminScope="State"
      redirectPath="/admin/state/dashboard"
      wrongPortalHint="This isn't a State Admin account. Choose the correct staff portal below."
    />
  );
}
