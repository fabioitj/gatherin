'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewsNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl">
            <FileQuestion className="w-12 h-12 text-purple-600" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          News not found
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          The news article you're looking for doesn't exist or has been moved. 
          Please check the URL or return to the homepage.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to homepage
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.history.back()}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go back
          </Button>
        </div>
        
        <div className="mt-12 p-6 bg-purple-50 rounded-2xl border border-purple-100">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">
            Need help?
          </h2>
          <p className="text-purple-700">
            Explore our <Link href="/" className="underline hover:text-purple-900">latest news</Link> or 
            learn more <Link href="/sobre" className="underline hover:text-purple-900">about our platform</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}