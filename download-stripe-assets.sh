#!/bin/bash

# Create directories if they don't exist
mkdir -p public/images/payment-icons

# Download Stripe badge
curl -o public/images/powered-by-stripe.png "https://stripe.com/img/documentation/checkout/marketplace.png"

# Download payment method icons
curl -o public/images/payment-icons/visa.svg "https://b.stripecdn.com/checkout/v3/images/visa.svg"
curl -o public/images/payment-icons/mastercard.svg "https://b.stripecdn.com/checkout/v3/images/mastercard.svg"
curl -o public/images/payment-icons/amex.svg "https://b.stripecdn.com/checkout/v3/images/amex.svg"
