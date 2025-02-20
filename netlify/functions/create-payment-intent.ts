import { Handler, HandlerEvent } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

interface CustomerDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  preferredDate?: string;
  notes?: string;
  paymentMethod?: string;
}

interface Item {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface RequestBody {
  amount: number;
  items: Item[];
  includeCprSign: boolean;
  customerDetails?: CustomerDetails;
  paymentIntentId?: string;
  isExpressCheckout?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
} as const;

export const handler: Handler = async (event: HandlerEvent) => {
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
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const body = JSON.parse(event.body || '{}') as RequestBody;
    const { items, includeCprSign, customerDetails, paymentIntentId, isExpressCheckout } = body;

    // Calculate expected amount
    const basePrice = items.find(item => item.id === 'pool-inspection')?.price || 210;
    const cprSignPrice = includeCprSign ? 30 : 0;
    const expectedAmount = basePrice + cprSignPrice;
    
    // Convert amount to cents
    const amountInCents = Math.round(expectedAmount * 100);

    // Log the payment details for debugging
    console.log('Payment Details:', {
      basePrice,
      cprSignPrice,
      expectedAmount,
      amountInCents,
      includeCprSign,
      isExpressCheckout
    });

    // Prepare metadata with customer details
    const metadata: Record<string, string> = {
      firstName: customerDetails?.firstName || '',
      lastName: customerDetails?.lastName || '',
      email: customerDetails?.email || '',
      phone: customerDetails?.phone || '',
      address: customerDetails?.address || '',
      suburb: customerDetails?.suburb || '',
      postcode: customerDetails?.postcode || '',
      preferredDate: customerDetails?.preferredDate || '',
      notes: customerDetails?.notes || '',
      includeCprSign: includeCprSign ? "true" : "false",
      items: JSON.stringify(items.map(item => item.name))
    };

    // Prepare customer email data
    const customerEmail = customerDetails?.email;
    const description = `Pool Safety Inspection${includeCprSign ? ' with CPR Sign' : ''}`;

    // Log payment intent creation details
    console.log('Creating payment intent with:', {
      amountInCents,
      description,
      includeCprSign,
      isExpressCheckout
    });

    const paymentIntentData = {
      amount: amountInCents,
      currency: "aud",
      metadata,
      description,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      } as const,
    };

    let paymentIntent;

    try {
      // For express checkout, always create a new payment intent
      if (isExpressCheckout) {
        console.log('Creating new payment intent for express checkout');
        paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      } else {
        if (paymentIntentId) {
          console.log('Updating existing payment intent:', paymentIntentId);
          // Update existing payment intent
          paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
            amount: amountInCents,
            metadata,
            description,
            receipt_email: customerEmail,
          });
        } else {
          console.log('Creating new payment intent');
          // Create new payment intent
          paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
        }
      }

      console.log('Payment intent operation successful:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status
      });
    } catch (error) {
      console.error('Error in payment intent operation:', error);
      throw error;
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
      } as const,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
    };
  } catch (error) {
    console.error("Error in payment intent function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      } as const,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
