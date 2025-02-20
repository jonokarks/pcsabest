import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Confirmed - Pool Compliance SA",
  description: "Your pool compliance inspection booking has been confirmed",
};

// Force dynamic rendering at the page level
export const dynamic = "force-dynamic";

// Client component is separated to allow for dynamic imports
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return <SuccessClient />;
}
