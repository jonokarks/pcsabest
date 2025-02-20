import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  const sig = event.headers['stripe-signature'];

  if (!sig || !endpointSecret) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing signature or endpoint secret' }),
    };
  }

  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      endpointSecret
    );

    switch (stripeEvent.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;
        const customerEmail = metadata.email || paymentIntent.receipt_email;

        if (!customerEmail) {
          console.error('No customer email found in payment intent');
          break;
        }

        // Send confirmation email to customer
        await stripe.customers.create({
          email: customerEmail,
          metadata: {
            paymentIntentId: paymentIntent.id,
            firstName: metadata.firstName || '',
            lastName: metadata.lastName || '',
            phone: metadata.phone || '',
            address: metadata.address || '',
            suburb: metadata.suburb || '',
            postcode: metadata.postcode || '',
            preferredDate: metadata.preferredDate || '',
            notes: metadata.notes || '',
            includeCprSign: metadata.includeCprSign || 'false',
          },
        });

        // Send email receipt via Stripe
        await stripe.paymentIntents.update(paymentIntent.id, {
          receipt_email: customerEmail,
          description: `Pool Safety Inspection${metadata.includeCprSign === 'true' ? ' with CPR Sign' : ''}`,
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error('Webhook Error:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }),
    };
  }
};
