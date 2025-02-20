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
    const { amount, items, includeCprSign, customerDetails, paymentIntentId } = body;

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);

    if (paymentIntentId) {
      // Only update metadata, not amount
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

      const updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
        metadata
      });

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
        } as const,
        body: JSON.stringify({
          clientSecret: updatedIntent.client_secret,
          paymentIntentId: updatedIntent.id,
        }),
      };
    } else {
      // Create new payment intent with amount and items
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "aud",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          service: "Pool Compliance Inspection",
          includeCprSign: includeCprSign ? "true" : "false",
          items: JSON.stringify(items.map(item => item.name)),
          timestamp: new Date().toISOString(),
        },
      });

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
    }
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
