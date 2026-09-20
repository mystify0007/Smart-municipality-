import StaffLoginForm from "../../components/StaffLoginForm";

export default function MunicipalityAdminLogin() {
  return (
    <StaffLoginForm
      heading="Municipality Admin Sign In"
      subheading="Municipality Admin Portal"
      expectedRole="Admin"
      expectedAdminScope="Municipality"
      redirectPath="/admin/dashboard"
      wrongPortalHint="This isn't a Municipality Admin account. Choose the correct staff portal below."
    />
  );
}
