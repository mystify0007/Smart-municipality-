import StaffLoginForm from "../../components/StaffLoginForm";

export default function ProvinceAdminLogin() {
  return (
    <StaffLoginForm
      heading="Province Admin Sign In"
      subheading="Province Admin Portal"
      expectedRole="Admin"
      expectedAdminScope="Province"
      redirectPath="/admin/province/dashboard"
      wrongPortalHint="This isn't a Province Admin account. Choose the correct staff portal below."
    />
  );
}
