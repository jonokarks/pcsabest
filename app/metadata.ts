import { Metadata } from "next";

const defaultMetadata: Metadata = {
  title: {
    default: "Pool Compliance SA - Swimming Pool Inspections Adelaide",
    template: "%s | Pool Compliance SA",
  },
  description:
    "Professional pool compliance inspections in Adelaide. Book your pool safety inspection today and ensure your pool meets all safety requirements.",
  keywords: [
    "pool compliance",
    "pool inspection",
    "swimming pool safety",
    "pool certification",
    "Adelaide pool inspector",
    "pool safety certificate",
    "pool barrier inspection",
    "SA pool regulations",
  ],
  authors: [{ name: "Pool Compliance SA" }],
  creator: "Pool Compliance SA",
  publisher: "Pool Compliance SA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://poolcompliancesa.com.au"),
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://poolcompliancesa.com.au",
    siteName: "Pool Compliance SA",
    title: "Pool Compliance SA - Swimming Pool Inspections Adelaide",
    description:
      "Professional pool compliance inspections in Adelaide. Book your pool safety inspection today and ensure your pool meets all safety requirements.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pool Compliance SA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pool Compliance SA - Swimming Pool Inspections Adelaide",
    description:
      "Professional pool compliance inspections in Adelaide. Book your pool safety inspection today and ensure your pool meets all safety requirements.",
    images: ["/images/twitter-image.jpg"],
    creator: "@poolcompliancesa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification",
  },
  alternates: {
    canonical: "https://poolcompliancesa.com.au",
  },
};

export default defaultMetadata;
