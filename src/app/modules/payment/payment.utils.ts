import axios from "axios";
import config from "../../config";
import { TPayment } from "./payment.interface";

const PAYMENT_GATEWAY_HOST = "https://sandbox.aamarpay.com";

const buildPaymentUrl = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${PAYMENT_GATEWAY_HOST}${raw}`;
  return null;
};

export const initiatePayment = async (paymentData: TPayment) => {
  const params = new URLSearchParams({
    signature_key: String(config.signature_key ?? ""),
    store_id: String(config.store_id ?? ""),
    tran_id: paymentData.transactionId,
    success_url: `${config?.server_base_url}/api/v1/payment/success?transactionId=${paymentData.transactionId}&status=success`,
    fail_url: `${config.server_base_url}/api/v1/payment/success?status=failed`,
    cancel_url: String(config.client_base_url ?? ""),
    amount: String(paymentData.amount),
    currency: "BDT",
    desc: "Dokan Express Order",
    cus_name: paymentData.customerName ?? "Customer",
    cus_email: paymentData.customerEmail ?? "noreply@dokanxpress.dev",
    cus_add1: paymentData.customerAddress ?? "N/A",
    cus_add2: "N/A",
    cus_city: "N/A",
    cus_state: "N/A",
    cus_postcode: "N/A",
    cus_country: "N/A",
    cus_phone: paymentData.customerPhone ?? "01700000000",
    type: "json",
  });

  const res = await axios.post(config.payment_url as string, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const payment_url = buildPaymentUrl(res?.data);
  if (!payment_url) {
    return { payment_url: null, gateway_response: res?.data };
  }
  return { payment_url };
};

export const verifyPayment = async (transactionId: string) => {
  const res = await axios.get(config.payment_verify_url as string, {
    params: {
      store_id: config.store_id,
      signature_key: config.signature_key,
      type: "json",
      request_id: transactionId,
    },
  });
  return res.data;
};
