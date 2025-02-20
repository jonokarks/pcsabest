import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import sgMail from '@sendgrid/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Webhook secret not configured' })
    };
  }

  if (!process.env.SENDGRID_API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'SendGrid API key not configured' })
    };
  }

  try {
    const signature = event.headers['stripe-signature'];
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      signature!,
      webhookSecret
    );

    // Handle the payment_intent.succeeded event
    if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata;

      // Initialize SendGrid
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      // Format items for email
      const items = JSON.parse(metadata.items || '[]');
      const itemsList = items.join(', ');

      // Create email content
      const emailContent = `
        <h2>New Pool Compliance Booking</h2>
        <p><strong>Payment Status:</strong> Successful</p>
        <p><strong>Amount Paid:</strong> $${(paymentIntent.amount / 100).toFixed(2)}</p>
        
        <h3>Customer Details:</h3>
        <p><strong>Name:</strong> ${metadata.firstName} ${metadata.lastName}</p>
        <p><strong>Email:</strong> ${metadata.email}</p>
        <p><strong>Phone:</strong> ${metadata.phone}</p>
        <p><strong>Address:</strong> ${metadata.address}</p>
        <p><strong>Suburb:</strong> ${metadata.suburb}</p>
        <p><strong>Postcode:</strong> ${metadata.postcode}</p>
        <p><strong>Preferred Date:</strong> ${metadata.preferredDate}</p>
        
        <h3>Service Details:</h3>
        <p><strong>Services:</strong> ${itemsList}</p>
        <p><strong>CPR Sign Included:</strong> ${metadata.includeCprSign === 'true' ? 'Yes' : 'No'}</p>
        
        ${metadata.notes ? `<p><strong>Additional Notes:</strong> ${metadata.notes}</p>` : ''}
      `;

      // Send email
      await sgMail.send({
        to: 'info@poolcompliancesa.com.au',
        from: process.env.VERIFIED_SENDER || 'info@poolcompliancesa.com.au',
        subject: 'New Pool Compliance Booking - Payment Successful',
        html: emailContent,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ received: true }),
      };
    }

    // Handle other event types if needed
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Webhook error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };
