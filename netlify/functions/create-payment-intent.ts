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

// Cancel any existing incomplete payment intents for the customer
const cancelExistingPaymentIntents = async (customerEmail: string) => {
  try {
    const thirtyMinutesAgo = Math.floor(Date.now() / 1000) - (30 * 60);
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10, // Limit to recent intents
      created: { gte: thirtyMinutesAgo },
    });

    // Find and cancel incomplete payment intents for this customer
    const cancelPromises = paymentIntents.data
      .filter(pi => 
        // Match by email in metadata or receipt_email
        (pi.metadata.email === customerEmail || pi.receipt_email === customerEmail) &&
        // Only cancel incomplete intents
        ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(pi.status)
      )
      .map(pi => stripe.paymentIntents.cancel(pi.id));

    if (cancelPromises.length > 0) {
      console.log(`Canceling ${cancelPromises.length} incomplete payment intents for ${customerEmail}`);
      await Promise.all(cancelPromises);
    }
  } catch (error) {
    console.error('Error canceling existing payment intents:', error);
    // Continue with creating new payment intent even if cleanup fails
  }
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

    // Cancel existing incomplete payment intents if we have customer email
    if (customerDetails?.email) {
      await cancelExistingPaymentIntents(customerDetails.email);
    }

    // Convert amount to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Prepare metadata
    const metadata: Record<string, string> = {
      items: JSON.stringify(items.map(item => item.name)),
      includeCprSign: includeCprSign ? 'true' : 'false',
      createdAt: Date.now().toString(),
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
      payment_method_options: {
        card: {
          setup_future_usage: undefined,
        },
      },
    });

    // Log success for monitoring
    console.log('Payment intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      createdAt: metadata.createdAt,
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
