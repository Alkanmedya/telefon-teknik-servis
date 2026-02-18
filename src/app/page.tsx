'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import RepairList from '@/components/RepairList';
import RepairForm from '@/components/RepairForm';
import StockList from '@/components/StockList';
import SecondHandList from '@/components/SecondHandList';
import ExpenseTracker from '@/components/ExpenseTracker';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import CorporateList from '@/components/CorporateList';
import LoanerList from '@/components/LoanerList';
import WishlistView from '@/components/WishlistView';
import SettingsView from '@/components/SettingsView';
import CustomerPortal from '@/components/CustomerPortal';
import SupplierView from '@/components/SupplierView';
import RMAView from '@/components/RMAView';
import QuoteManager from '@/components/QuoteManager';
import CustomerDetail from '@/components/CustomerDetail';
import ShopView from '@/components/ShopView';
import { useAppState } from '@/lib/store';
import LoginScreen from '@/components/LoginScreen';
import GlobalSearch from '@/components/GlobalSearch';
import ThemeToggle from '@/components/ThemeToggle';
import { Store } from 'lucide-react';

export type PageType = 'dashboard' | 'repairs' | 'new-repair' | 'stock' | 'second-hand' | 'expenses' | 'calendar' | 'corporate' | 'loaners' | 'wishlist' | 'settings' | 'customer-portal' | 'suppliers' | 'rma' | 'quotes' | 'customers' | 'shop';

export default function Home() {
  const { state } = useAppState();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [showSearch, setShowSearch] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setCurrentPage('new-repair'); }
      if (e.ctrlKey && e.key === 'f' && !isTyping) { e.preventDefault(); setShowSearch(true); }
      if (e.key === 'Escape') { setShowSearch(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'repairs': return <RepairList onNavigate={setCurrentPage} />;
      case 'new-repair': return <RepairForm onNavigate={setCurrentPage} />;
      case 'stock': return <StockList />;
      case 'second-hand': return <SecondHandList />;
      case 'expenses': return <ExpenseTracker />;
      case 'calendar': return <AppointmentCalendar />;
      case 'corporate': return <CorporateList />;
      case 'loaners': return <LoanerList />;
      case 'wishlist': return <WishlistView />;
      case 'settings': return <SettingsView />;
      case 'customer-portal': return <CustomerPortal />;
      case 'suppliers': return <SupplierView />;
      case 'rma': return <RMAView />;
      case 'quotes': return <QuoteManager />;
      case 'customers': return <CustomerDetail onNavigate={setCurrentPage} />;
      case 'shop': return <ShopView />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  if (!state.currentUserId) {
    return (
      <div className="relative">
        <LoginScreen />
        <ThemeToggle />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onSearchOpen={() => setShowSearch(true)} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="animate-fade-in">
          {renderPage()}
        </div>
      </main>
      <ThemeToggle />
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} onNavigate={setCurrentPage} />}
    </div>
  );
}
