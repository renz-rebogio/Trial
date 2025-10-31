import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import NavLinks from '@/components/layout/nav/NavLinks';
import NavActions from '@/components/layout/nav/NavActions';
import MobileNav from '@/components/layout/nav/MobileNav';
import DonateModal from '@/components/layout/nav/DonateModal';
import InvestModal from '@/components/layout/nav/InvestModal';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);

  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/23367813-6d25-41bb-b484-ab74a89aa914/df12f9e67a1460321940cf8885b06c0d.jpg";

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar-light-vibrant sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={logoUrl} alt="Boogasi Logo" className="h-12 w-auto rounded-lg shadow-md border-2 border-primary/30" />
              </motion.div>
              <span className="text-3xl font-bold tracking-tight nav-logo-text">
                BOOGASI
              </span>
            </Link>
            
            <NavLinks user={user} setIsDonateModalOpen={setIsDonateModalOpen} setIsInvestModalOpen={setIsInvestModalOpen} />
            
            <div className="flex items-center">
              <NavActions user={user} authLoading={authLoading} handleLogout={handleLogout} navigate={navigate} />
              <MobileNav user={user} setIsDonateModalOpen={setIsDonateModalOpen} setIsInvestModalOpen={setIsInvestModalOpen} />
            </div>
          </div>
        </div>
      </nav>

      <DonateModal isOpen={isDonateModalOpen} setIsOpen={setIsDonateModalOpen} />
      <InvestModal isOpen={isInvestModalOpen} setIsOpen={setIsInvestModalOpen} />
    </>
  );
};

export default Navbar;