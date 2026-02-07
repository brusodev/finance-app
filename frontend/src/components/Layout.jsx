import React, { useState, createContext, useContext } from 'react';
import Sidebar from './Sidebar';

// Context para compartilhar estado do sidebar
const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a Layout');
  }
  return context;
};

export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <Sidebar />
        <main className={`min-h-screen transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}>
          <div className="p-4 lg:p-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
