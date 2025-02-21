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

interface EmailData {
  to: string;
  subject: string;
  html: string;
  from: {
    email: string;
    name: string;
  };
}

const sendEmail = async (emailData: EmailData) => {
  try {
    await sgMail.send(emailData);
    console.log('Email sent successfully to:', emailData.to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendAdminNotification = async (paymentIntent: Stripe.PaymentIntent) => {
  const metadata = paymentIntent.metadata;
  const amount = (paymentIntent.amount / 100).toFixed(2);
  const hasCprSign = metadata.includeCprSign === 'true';

  if (!process.env.VERIFIED_SENDER) {
    throw new Error('VERIFIED_SENDER environment variable is required');
  }

  const emailData: EmailData = {
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
      <p><strong>Payment Method:</strong> ${paymentIntent.payment_method_types.join(', ')}</p>
      <p><strong>Status:</strong> ${paymentIntent.status}</p>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    `,
  };

  await sendEmail(emailData);
};

const sendCustomerConfirmation = async (paymentIntent: Stripe.PaymentIntent) => {
  const metadata = paymentIntent.metadata;
  const recipientEmail = metadata.email || paymentIntent.receipt_email;
  
  if (!recipientEmail) {
    throw new Error('No customer email found');
  }

  const amount = (paymentIntent.amount / 100).toFixed(2);
  const hasCprSign = metadata.includeCprSign === 'true';

  const emailData: EmailData = {
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
      
      <p style="color: #666; font-size: 12px;">
        Transaction ID: ${paymentIntent.id}<br>
        Date: ${new Date().toLocaleString()}
      </p>
    `,
  };

  await sendEmail(emailData);
};

const sendRefundNotification = async (charge: Stripe.Charge, refund: Stripe.Refund) => {
  if (!process.env.VERIFIED_SENDER) {
    throw new Error('VERIFIED_SENDER environment variable is required');
  }

  const amount = (refund.amount / 100).toFixed(2);
  const customerEmail = charge.receipt_email || charge.billing_details.email;

  if (customerEmail) {
    const customerEmailData: EmailData = {
      from: {
        email: process.env.VERIFIED_SENDER,
        name: 'Pool Compliance SA'
      },
      to: customerEmail,
      subject: 'Refund Processed for Pool Safety Inspection',
      html: `
        <h2>Refund Confirmation</h2>
        <p>We have processed a refund for your pool safety inspection booking.</p>
        <p><strong>Amount Refunded:</strong> $${amount}</p>
        <p><strong>Refund ID:</strong> ${refund.id}</p>
        <p><strong>Original Payment ID:</strong> ${charge.payment_intent}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
      `,
    };

    await sendEmail(customerEmailData);
  }

  // Always send admin notification for refunds
  const adminEmailData: EmailData = {
    from: {
      email: process.env.VERIFIED_SENDER,
      name: 'Pool Compliance SA'
    },
    to: process.env.VERIFIED_SENDER,
    subject: 'Refund Processed - Pool Safety Inspection',
    html: `
      <h2>Refund Processed</h2>
      <p><strong>Amount:</strong> $${amount}</p>
      <p><strong>Customer Email:</strong> ${customerEmail || 'Not available'}</p>
      <p><strong>Refund ID:</strong> ${refund.id}</p>
      <p><strong>Original Payment ID:</strong> ${charge.payment_intent}</p>
      <p><strong>Reason:</strong> ${refund.reason || 'Not specified'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    `,
  };

  await sendEmail(adminEmailData);
};

// Clean up old incomplete payment intents
const cleanupIncompletePaymentIntents = async () => {
  try {
    const thirtyMinutesAgo = Math.floor(Date.now() / 1000) - (30 * 60);
    const paymentIntents = await stripe.paymentIntents.list({
      created: { lt: thirtyMinutesAgo },
      limit: 100,
    });

    const incompleteIntents = paymentIntents.data.filter(pi =>
      ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(pi.status)
    );

    if (incompleteIntents.length > 0) {
      console.log(`Found ${incompleteIntents.length} old incomplete payment intents to clean up`);
      
      await Promise.all(
        incompleteIntents.map(async (pi) => {
          try {
            await stripe.paymentIntents.cancel(pi.id);
            console.log(`Canceled payment intent: ${pi.id}`);
          } catch (error) {
            console.error(`Error canceling payment intent ${pi.id}:`, error);
          }
        })
      );
    }
  } catch (error) {
    console.error('Error cleaning up incomplete payment intents:', error);
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
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

    console.log('Processing webhook event:', stripeEvent.type);

    switch (stripeEvent.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        try {
          const customerEmail = paymentIntent.metadata.email || paymentIntent.receipt_email;
          
          if (customerEmail) {
            // Create or update Stripe customer
            const existingCustomers = await stripe.customers.list({
              email: customerEmail,
              limit: 1,
            });

            let customer: Stripe.Customer;
            if (existingCustomers.data.length > 0) {
              customer = await stripe.customers.update(existingCustomers.data[0].id, {
                metadata: {
                  lastPaymentIntentId: paymentIntent.id,
                  ...paymentIntent.metadata,
                },
              });
            } else {
              customer = await stripe.customers.create({
                email: customerEmail,
                metadata: {
                  paymentIntentId: paymentIntent.id,
                  ...paymentIntent.metadata,
                },
              });
            }

            // Update payment intent with customer ID and receipt email
            await stripe.paymentIntents.update(paymentIntent.id, {
              customer: customer.id,
              receipt_email: customerEmail,
              description: `Pool Safety Inspection${paymentIntent.metadata.includeCprSign === 'true' ? ' with CPR Sign' : ''}`,
            });

            // Send confirmation emails
            await Promise.all([
              sendCustomerConfirmation(paymentIntent),
              sendAdminNotification(paymentIntent),
            ]);
          }
        } catch (error) {
          console.error('Error processing payment success:', error);
          // Log error but don't throw to ensure 200 response to Stripe
        }
        break;
      }

      case 'charge.refunded': {
        const charge = stripeEvent.data.object as Stripe.Charge;
        if (charge.refunds?.data && charge.refunds.data.length > 0) {
          const refund = charge.refunds.data[0];
          console.log('Refund processed:', refund.id);
          
          try {
            await sendRefundNotification(charge, refund);
          } catch (error) {
            console.error('Error processing refund notification:', error);
          }
        } else {
          console.error('Refund event received but no refund data found:', charge.id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', {
          id: paymentIntent.id,
          error: paymentIntent.last_payment_error,
        });
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        console.log('Payment canceled:', {
          id: paymentIntent.id,
          canceledAt: paymentIntent.canceled_at,
        });
        break;
      }
    }

    // Clean up old incomplete payment intents periodically
    await cleanupIncompletePaymentIntents();

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
