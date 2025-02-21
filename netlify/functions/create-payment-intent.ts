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
  isExpressCheckout?: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
} as const;

const validateAmount = (amount: number, items: Item[], includeCprSign: boolean): boolean => {
  const basePrice = items.find(item => item.id === 'pool-inspection')?.price || 210;
  const cprSignPrice = includeCprSign ? 30 : 0;
  const expectedAmount = basePrice + cprSignPrice;
  return Math.abs(amount - expectedAmount) < 0.01; // Account for floating point precision
};

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight requests
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
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }

    const body = JSON.parse(event.body || '{}') as RequestBody;
    const { amount, items, includeCprSign, customerDetails, isExpressCheckout } = body;

    // Validate request data
    if (!amount || !items?.length) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid request data' }),
      };
    }

    // Validate amount matches items
    if (!validateAmount(amount, items, includeCprSign)) {
      console.error('Amount mismatch:', {
        provided: amount,
        items,
        includeCprSign,
      });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Amount mismatch detected' }),
      };
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Prepare metadata
    const metadata: Record<string, string> = {
      items: JSON.stringify(items.map(item => item.name)),
      includeCprSign: includeCprSign ? 'true' : 'false',
      timestamp: Date.now().toString(),
      ...(customerDetails && Object.entries(customerDetails).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: String(value || ''),
      }), {})),
    };

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'aud',
      metadata,
      description: `Pool Safety Inspection${includeCprSign ? ' with CPR Sign' : ''}`,
      receipt_email: customerDetails?.email,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: isExpressCheckout ? undefined : 'off_session',
    });

    // Log success for monitoring
    console.log('Payment intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
    };
  } catch (error) {
    // Log error for debugging
    console.error('Error creating payment intent:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
