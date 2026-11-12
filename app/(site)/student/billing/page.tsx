import { redirect } from "next/navigation";

/** Receipts live with payments. */
export default function BillingPage() {
  redirect("/student/payments");
}
