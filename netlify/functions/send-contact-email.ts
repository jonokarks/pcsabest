import { Handler } from '@netlify/functions';
import sgMail from '@sendgrid/mail';

const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { name, email, phone, message } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // Initialize SendGrid
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not set');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Email content
    const msg = {
      to: 'info@poolcompliancesa.com.au',
      from: process.env.VERIFIED_SENDER || 'info@poolcompliancesa.com.au', // Must be verified in SendGrid
      subject: 'New Contact Form Submission',
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
      replyTo: email,
    };

    // Send email
    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // More detailed error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error sending email',
        error: errorMessage 
      }),
    };
  }
};

export { handler };
