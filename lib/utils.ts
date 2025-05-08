import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ClassValue as CVA } from 'class-variance-authority/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export const sectors = [
  "Technology",
  "Finance",
  "Healthcare",
  "Energy",
  "Consumer",
  "Industrial",
  "Utilities",
  "Materials",
  "Telecom",
  "Real Estate"
];

export const countries = [
  "USA",
  "Canada",
  "Brazil",
  "UK",
  "Germany",
  "France",
  "Japan",
  "China",
  "Australia",
  "India"
];

export const categories = [
  "Stocks",
  "Bonds",
  "ETFs",
  "Mutual Funds",
  "FIIs",
  "Commodities",
  "Forex",
  "Crypto"
];