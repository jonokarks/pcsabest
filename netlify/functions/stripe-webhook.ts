import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import sgMail from '@sendgrid/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const sendAdminNotification = async (paymentIntent: Stripe.PaymentIntent) => {
  const metadata = paymentIntent.metadata;
  const amount = (paymentIntent.amount / 100).toFixed(2);
  const hasCprSign = metadata.includeCprSign === 'true';

  if (!process.env.VERIFIED_SENDER) {
    throw new Error('VERIFIED_SENDER environment variable is required');
  }

  const emailData = {
    from: {
      email: process.env.VERIFIED_SENDER,
      name: 'Pool Compliance SA'
    },
    to: process.env.VERIFIED_SENDER,
    subject: 'New Pool Safety Inspection Booking',
    html: `
      <h2>New Booking Details</h2>
      <p><strong>Customer:</strong> ${metadata.firstName} ${metadata.lastName}</p>
      <p><strong>Email:</strong> ${metadata.email}</p>
      <p><strong>Phone:</strong> ${metadata.phone}</p>
      <p><strong>Address:</strong> ${metadata.address}</p>
      <p><strong>Suburb:</strong> ${metadata.suburb}</p>
      <p><strong>Postcode:</strong> ${metadata.postcode}</p>
      <p><strong>Preferred Date:</strong> ${metadata.preferredDate}</p>
      <p><strong>Notes:</strong> ${metadata.notes || 'None'}</p>
      <p><strong>CPR Sign Required:</strong> ${hasCprSign ? 'Yes' : 'No'}</p>
      <p><strong>Amount Paid:</strong> $${amount}</p>
      <p><strong>Payment ID:</strong> ${paymentIntent.id}</p>
    `,
  };

  await sgMail.send(emailData);
};

const sendCustomerConfirmation = async (paymentIntent: Stripe.PaymentIntent) => {
  const metadata = paymentIntent.metadata;
  const recipientEmail = metadata.email || paymentIntent.receipt_email;
  
  if (!recipientEmail) {
    throw new Error('No customer email found');
  }

  const amount = (paymentIntent.amount / 100).toFixed(2);
  const hasCprSign = metadata.includeCprSign === 'true';

  const emailData = {
    from: {
      email: process.env.VERIFIED_SENDER!,
      name: 'Pool Compliance SA'
    },
    to: recipientEmail,
    subject: 'Pool Safety Inspection Booking Confirmation',
    html: `
      <h2>Booking Confirmation</h2>
      <p>Thank you for booking your pool safety inspection with us.</p>
      
      <h3>Booking Details:</h3>
      <p><strong>Service:</strong> Pool Safety Inspection${hasCprSign ? ' with CPR Sign' : ''}</p>
      <p><strong>Amount Paid:</strong> $${amount}</p>
      <p><strong>Preferred Date:</strong> ${metadata.preferredDate}</p>
      <p><strong>Address:</strong> ${metadata.address}</p>
      <p><strong>Suburb:</strong> ${metadata.suburb}</p>
      <p><strong>Postcode:</strong> ${metadata.postcode}</p>
      
      <p>We will contact you shortly to confirm your inspection time.</p>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `,
  };

  await sgMail.send(emailData);
};

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
        const customerEmail = paymentIntent.metadata.email || paymentIntent.receipt_email;
        
        try {
          if (customerEmail) {
            // Create Stripe customer
            await stripe.customers.create({
              email: customerEmail,
              metadata: {
                paymentIntentId: paymentIntent.id,
                ...paymentIntent.metadata,
              },
            });

            // Send confirmation emails
            await Promise.all([
              sendCustomerConfirmation(paymentIntent),
              sendAdminNotification(paymentIntent),
            ]);

            // Update payment intent with receipt email
            await stripe.paymentIntents.update(paymentIntent.id, {
              receipt_email: customerEmail,
              description: `Pool Safety Inspection${paymentIntent.metadata.includeCprSign === 'true' ? ' with CPR Sign' : ''}`,
            });
          }
        } catch (error) {
          console.error('Error processing payment success:', error);
          // Don't throw here - we still want to return 200 to Stripe
        }
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
