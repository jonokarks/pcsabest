import { FaCcVisa, FaCcMastercard, FaCcAmex } from "react-icons/fa";

const PaymentIcons = () => {
  return (
    <div className="flex items-center space-x-2">
      <FaCcVisa className="h-6 w-auto text-[#1A1F71]" />
      <FaCcMastercard className="h-6 w-auto" style={{ color: '#FF5F00' }} />
      <FaCcAmex className="h-6 w-auto text-[#006FCF]" />
    </div>
  );
};

export default PaymentIcons;
