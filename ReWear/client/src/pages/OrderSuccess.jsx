import { useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f5f0]">

      <div className="bg-white p-10 rounded-xl shadow text-center space-y-4">
        <h1>Hey AbdulQadir 👋</h1>

        <h1 className="text-3xl font-semibold text-green-600">
          Payment Successful 🎉
        </h1>

        <p className="text-gray-600">
          Your order has been placed successfully.
        </p>

        <button
          onClick={() => navigate("/orders")}
          className="bg-[#f46c63] text-white px-6 py-3 rounded-lg"
        >
          View Your Orders
        </button>

      </div>

    </div>
  );
};

export default OrderSuccess;