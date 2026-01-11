'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import NewsletterList from '@/components/newsletter/NewsletterList';
import CreateNewsletterForm from '@/components/newsletter/CreateNewsletterForm';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Newsletter Management System</h1>
          <p className="text-gray-600 mb-6">
            Sign in with your AWS Cognito account to manage newsletters
          </p>
          <button
            onClick={() => signIn('cognito')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700"
          >
            Sign In with Cognito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Newsletter Management System
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Newsletter Form */}
          <div className="lg:col-span-1">
            <CreateNewsletterForm />
          </div>

          {/* Newsletter List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Newsletters</h2>
            <NewsletterList />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Newsletter Management System - Powered by Next.js, AWS, and Strapi
          </p>
        </div>
      </footer>
    </div>
  );
}
