import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen transition-all duration-300">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
           {children}
        </div>
      </main>
    </div>
  );
}
