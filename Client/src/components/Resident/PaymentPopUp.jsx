import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import "../../assets/css/Resident/PaymentPopUp.css";
import { ConfirmBooking, optimisticAddBooking } from "../../Slices/CommonSpaceSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

const PAYMENT_POLICY_CONTENT = `
1. All payments are processed through a secure third-party gateway.
3. By submitting payment, you authorize the charge to your selected method.
4. Payment status update may take up to 30 minutes to reflect in the app.
`;

const CANCELLATION_POLICY_CONTENT = `
1. Slot-Based Amenities: Refunds are based on cancellation time and credited to your Flat Advance Account, not your bank.
   - 48+ Hours before Start: 100% Refund.
   - 24–48 Hours before Start: 75% Refund (25% Penalty).
   - 4–24 Hours before Start: 50% Refund (50% Penalty).
   - Less than 4 Hours before Start: 0% Refund (100% Penalty).
2. Subscription-Based Amenities (Gym/Pool): Subscriptions are non-refundable after activation. Cancellation only stops auto-renewal.
3. Security deposits are 100% refundable upon cancellation/completion, provided no damage is incurred.
`;

const PaymentPopUp = ({ setonClose, paymentDetails, newBooking, clearBookingFormState }) => {
  const dispatch = useDispatch();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      bill: paymentDetails?.belongTo || "",
      amount: paymentDetails?.amount || "",
      paymentMethod: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      agree: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [next, setNext] = useState(false);
  const paymentMethod = watch("paymentMethod");

  useEffect(() => {
    if (paymentDetails && Object.keys(paymentDetails).length > 0) {
      reset({
        bill: paymentDetails.belongTo || "",
        amount: paymentDetails.amount || "",
        paymentMethod: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        agree: false,
      });
    }
  }, [paymentDetails, reset]);

  const closepopUp = () => {
    if (window.confirm("Do you want to abort your booking?")) {
      setonClose(false);
      reset();
      clearBookingFormState();
    }
  };

  const onSubmit = async (data) => {
    if (!data.agree) {
      toast.error("Please agree to the payment and cancellation policy.");
      return;
    }

    try {
      setIsSubmitting(true);

      const requestId = new Date().getTime();
      dispatch(optimisticAddBooking({ bookingData: newBooking, requestId }));
      toast.success("Booking approved");
      dispatch(ConfirmBooking({ data, newBooking, requestId }));

      setonClose(false);
      clearBookingFormState();
    } catch (error) {
      toast.error(error.message || "Payment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="paymentFormPopup" className="popup">
      <div className="popup-content">
        <span className="close-btn" style={{ zIndex: "20" }} onClick={closepopUp}>
          &times;
        </span>
        <h3 className="form-title">Make Payment</h3>

        <form id="paymentForm" onSubmit={handleSubmit(onSubmit)}>
          {next ? (
            <div className="px-3 py-2">
              <div className="fw-4">
                <i onClick={() => setNext(false)} className="bi bi-arrow-left" style={{ cursor: "pointer" }}></i>
              </div>

              <div className="policy-box px-4 mt-2">

                <div className="policy-content">
                  <h3 className="m-0">Payment Policy</h3>
                  <pre className="policy-text">{PAYMENT_POLICY_CONTENT}</pre>

                  <h3 className="m-0">Cancellation Policy</h3>
                  <pre className="policy-text">{CANCELLATION_POLICY_CONTENT}</pre>
                </div>
              </div>

              <div className="form-group-checkbox mt-3">
                <input
                  className="m-0"
                  type="checkbox"
                  id="termsAccepted"
                  {...register("agree", { required: true })}
                />
                <label htmlFor="termsAccepted">
                  I have read and agree to the Payment & Cancellation Policy.
                </label>
                {errors.agree && (
                  <p className="error">You must agree before making payment.</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* BILL INFO */}
              <div className="form-group">
                <label htmlFor="bill">Bill:</label>
                <input type="text" id="bill" {...register("bill")} readOnly />
              </div>

              {/* PAYMENT METHOD */}
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method:</label>
                <select id="paymentMethod" {...register("paymentMethod", { required: true })}>
                  <option value="">Select payment method</option>
                  <option value="Credit">Credit Card (+2%)</option>
                  <option value="Debit">Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Netbanking">Net Banking</option>
                </select>
                {errors.paymentMethod && <p className="error">Select a payment method</p>}
              </div>

              {/* CARD DETAILS */}
              {(paymentMethod === "Credit" || paymentMethod === "Debit") && (
                <div id="cardFields">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number:</label>
                    <input
                      type="text"
                      id="cardNumber"
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength="19"
                      {...register("cardNumber", {
                        required: true,
                        pattern: /^[0-9\s]{16,19}$/,
                      })}
                    />
                    {errors.cardNumber && <p className="error">Enter a valid card number</p>}
                  </div>

                  <div className="row">
                    <div className="col form-group">
                      <label htmlFor="expiryDate">Expiry Date:</label>
                      <input
                        type="text"
                        id="expiryDate"
                        placeholder="MM/YY"
                        maxLength="5"
                        {...register("expiryDate", {
                          required: true,
                          pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
                        })}
                      />
                      {errors.expiryDate && <p className="error">Enter valid expiry (MM/YY)</p>}
                    </div>
                    <div className="col form-group">
                      <label htmlFor="cvv">CVV:</label>
                      <input
                        type="password"
                        id="cvv"
                        placeholder="XXX"
                        maxLength="3"
                        {...register("cvv", { required: true, pattern: /^[0-9]{3}$/ })}
                      />
                      {errors.cvv && <p className="error">Enter valid CVV</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* AMOUNT */}
              <div className="form-group">
                <label htmlFor="amount">Amount:</label>
                <input type="text" id="amount" {...register("amount")} readOnly />
              </div>

              <div className="form-group-checkbox mb-2">
                <input
                  className="m-0"
                  type="checkbox"
                  id="termsAccepted"
                  onClick={() => setNext(true)}
                />
                <label htmlFor="termsAccepted">
                  I have read and agree to the Payment & Cancellation Policy.
                </label>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-success" disabled={isSubmitting}>
            <i className="bi bi-credit-card me-2"></i>{" "}
            {isSubmitting ? "Processing..." : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentPopUp;
