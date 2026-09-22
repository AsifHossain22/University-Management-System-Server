export interface ICreatePaymentPayload {
  feeId: string;
  amount: number;
}

export interface IPaymentCallbackPayload {
  paymentID: string;
  status: 'success' | 'failure' | 'cancel';
  signature?: string | undefined;
  apiVersion?: string | undefined;
}
