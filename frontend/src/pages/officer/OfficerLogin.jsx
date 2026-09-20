import StaffLoginForm from "../../components/StaffLoginForm";

export default function OfficerLogin() {
  return (
    <StaffLoginForm
      heading="Officer Sign In"
      subheading="Officer Portal"
      expectedRole="Officer"
      redirectPath="/officer/dashboard"
      wrongPortalHint="This isn't an Officer account. Choose the correct staff portal below."
    />
  );
}
