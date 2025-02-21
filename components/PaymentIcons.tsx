import { FaCcVisa, FaCcMastercard, FaCcAmex } from "react-icons/fa";

const PaymentIcons = () => {
  return (
    <div className="flex items-center space-x-2">
      <FaCcVisa className="h-6 w-auto text-[#1A1F71] dark:text-[#1434CB]" />
      <FaCcMastercard className="h-6 w-auto text-[#EB001B] dark:text-[#FF5F00]" />
      <FaCcAmex className="h-6 w-auto text-[#2E77BB] dark:text-[#60C7E6]" />
    </div>
  );
};

export default PaymentIcons;
