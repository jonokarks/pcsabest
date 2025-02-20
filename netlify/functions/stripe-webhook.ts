import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import sgMail from '@sendgrid/mail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const;

const handler: Handler = async (event) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
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

      // Send email to business
      await sgMail.send({
        to: 'info@poolcompliancesa.com.au',
        from: process.env.VERIFIED_SENDER || 'info@poolcompliancesa.com.au',
        subject: 'New Pool Compliance Booking - Payment Successful',
        html: emailContent,
      });

      // Send confirmation email to customer
      const customerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f9fafb;
            }
            .header {
              background-color: #0d9488;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header img {
              max-width: 250px;
              height: auto;
            }
            .content {
              padding: 30px;
              background-color: #fff;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .details {
              background-color: #f0fdfa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #ccfbf1;
            }
            .footer {
              background-color: #f3f4f6;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #4b5563;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            h2 {
              color: #0d9488;
              margin-bottom: 20px;
            }
            h3 {
              color: #0d9488;
              margin: 0 0 10px 0;
            }
            p {
              margin: 0 0 15px 0;
            }
            .contact-info {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://strong-monstera-223bb6.netlify.app/images/PCSA-White.png" alt="Pool Compliance SA Logo">
          </div>
          <div class="content">
            <h2>Thank You for Your Booking</h2>
            <p>Dear ${metadata.firstName},</p>
            <p>Thank you for choosing Pool Compliance SA for your pool inspection. We have successfully received your booking and payment.</p>
            
            <div class="details">
              <h3>Booking Details</h3>
              <p><strong>Service:</strong> ${itemsList}</p>
              <p><strong>CPR Sign:</strong> ${metadata.includeCprSign === 'true' ? 'Yes' : 'No'}</p>
              <p><strong>Preferred Date:</strong> ${metadata.preferredDate}</p>
              <p><strong>Location:</strong> ${metadata.address}, ${metadata.suburb} ${metadata.postcode}</p>
              <p><strong>Amount Paid:</strong> $${(paymentIntent.amount / 100).toFixed(2)}</p>
            </div>
            
            <p>Our team will contact you shortly to confirm your inspection time. We aim to accommodate your preferred date where possible.</p>
            
            <p>If you have any questions or need to update your booking details, please don't hesitate to reach out to us.</p>
            
            <div class="contact-info">
              <p>Best regards,<br>Pool Compliance SA Team</p>
            </div>
          </div>
          <div class="footer">
            <p>Pool Compliance SA</p>
            <p>📞 0400 000 000 | ✉️ info@poolcompliancesa.com.au</p>
            <p>Serving the Adelaide Metropolitan Area</p>
          </div>
        </body>
        </html>
      `;

      // Send confirmation to customer
      await sgMail.send({
        to: metadata.email,
        from: process.env.VERIFIED_SENDER || 'info@poolcompliancesa.com.au',
        subject: 'Pool Compliance SA - Booking Confirmation',
        html: customerEmailContent,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ received: true }),
      };
    }

    // Handle other event types if needed
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ received: true }),
      };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Webhook error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

export { handler };
