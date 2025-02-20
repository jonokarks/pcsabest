# Pool Compliance SA Website

A modern, Next.js-based website for Pool Compliance SA, offering pool safety inspection services in Adelaide.

## Features

- Modern, responsive design using Tailwind CSS
- Dynamic server-side rendering with Next.js 14
- Serverless Stripe payment processing with Netlify Functions
- Shopping cart functionality
- Contact form with form validation
- SEO optimized with metadata
- Mobile-friendly navigation

## Tech Stack

- Next.js 14.2.3
- React 18
- TypeScript
- Tailwind CSS
- Stripe Payment Integration (Serverless)
- React Hook Form
- Netlify Functions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Stripe account for payment processing
- Netlify account for deployment

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/pool-compliance.git
cd pool-compliance
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
SITE_URL=your_site_url
```

4. Start the development server:
```bash
npm run dev
```

The site will be available at `http://localhost:3000`

### Development Mode

The site is configured to run in development mode with:
- Dynamic rendering for all pages
- Serverless Stripe payment processing
- Hot module reloading
- TypeScript type checking

To run in development mode:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
pool-compliance/
├── app/                    # Next.js app directory
│   ├── about-us/          # About Us page
│   ├── book-compliance/   # Booking page
│   ├── checkout/          # Checkout process
│   ├── contact/           # Contact page
│   └── globals.css        # Global styles
├── components/            # React components
├── context/               # React context providers
├── netlify/               # Netlify serverless functions
│   └── functions/         # Serverless function implementations
├── public/                # Static assets
└── types/                # TypeScript type definitions
```

## Features in Detail

### Booking System
- Dynamic booking interface
- Real-time price calculation
- Optional CPR sign add-on

### Payment Processing
- Serverless Stripe integration using Netlify Functions
- Support for major credit cards
- Automatic receipt generation
- Secure payment processing with no server requirements
- Dynamic payment intent creation through serverless functions

### Contact Form
- Form validation
- Real-time error handling
- Dynamic submission

### Development Features
- Hot module reloading
- TypeScript type checking
- ESLint integration
- Prettier code formatting

## Deployment

The site is optimized for deployment on Netlify with serverless functions. For deployment:

1. Connect your repository to Netlify
2. Configure the following environment variables in Netlify:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `SITE_URL`
   - `NODE_ENV`

3. Netlify will automatically deploy your site and set up the serverless functions.

For local development:

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is proprietary and confidential. Unauthorized copying of this project's files, via any medium, is strictly prohibited.

## Contact

Pool Compliance SA - info@poolcompliancesa.com.au
# pcsa1
