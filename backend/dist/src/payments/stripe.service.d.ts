import Stripe from 'stripe';
export declare class StripeService {
    private stripe;
    constructor();
    createPaymentIntent(amount: number, caseId: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    constructEvent(payload: Buffer, signature: string): Stripe.Event;
}
