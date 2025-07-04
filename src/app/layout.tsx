import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZivaAds - Facebook Ad Management for Zimbabwe',
  description: 'Professional Facebook advertising management platform designed for Zimbabwean businesses. Monitor, optimize, and grow your ad campaigns with ease.',
  keywords: 'Facebook ads, advertising, Zimbabwe, Harare, digital marketing, ad management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 