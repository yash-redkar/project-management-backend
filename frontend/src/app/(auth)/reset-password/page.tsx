import { redirect } from "next/navigation";

export default function ResetPasswordIndexPage() {
  redirect("/forgot-password");
}
