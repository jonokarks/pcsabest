import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - Pool Compliance SA",
  description: "Complete your pool compliance inspection booking",
};

// Force dynamic rendering at the page level
export const dynamic = "force-dynamic";

// Client component is separated to allow for dynamic imports
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return <CheckoutClient />;
}
