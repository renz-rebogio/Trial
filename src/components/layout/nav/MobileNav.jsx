import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, Newspaper, ShoppingCart, Brain, Heart, DollarSign, Users, FileText, Shield, Briefcase, Zap, Menu, Settings, LayoutDashboard, ShoppingBag, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNavItem = ({ to, icon, children, onClick, iconClassName }) => {
  const IconComponent = icon ? React.cloneElement(icon, { className: cn("mr-2 h-4 w-4", iconClassName) }) : null;
  if (onClick) {
    return (
      <DropdownMenuItem 
        className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-cyan))]" 
        onClick={onClick}
      >
        {IconComponent}{children}
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem 
      className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-cyan))]" 
      asChild
    >
      <Link to={to} className="w-full">
        {IconComponent}{children}
      </Link>
    </DropdownMenuItem>
  );
};


const MobileNav = ({ user, setIsDonateModalOpen, setIsInvestModalOpen }) => {
  return (
    <div className="md:hidden ml-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="nav-link-3d p-2 hover:text-[hsl(var(--boogasi-cyan))] hover:border-[hsl(var(--boogasi-cyan))] group">
            <Menu className="h-6 w-6 group-hover:filter group-hover:drop-shadow-[0_0_8px_hsl(var(--boogasi-cyan))]" /> 
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 glassmorphic-dropdown radix-dropdown-menu-content" align="end" forceMount>
          <MobileNavItem to="/" icon={<Home />} iconClassName="icon-neon-green">Home</MobileNavItem>
          {user && <MobileNavItem to="/feed" icon={<Newspaper />} iconClassName="icon-neon-orange">Feed</MobileNavItem>}
          <MobileNavItem to="/marketplace" icon={<ShoppingCart />} iconClassName="icon-neon-blue">Marketplace</MobileNavItem>
          <MobileNavItem to="/sell-on-boogasi" icon={<DollarSign />} iconClassName="icon-neon-purple">Sell on Boogasi</MobileNavItem>
          {user && (
            <>
              <MobileNavItem to="/deal-maker" icon={<Briefcase />} iconClassName="icon-neon-pink">Deal Maker</MobileNavItem>
              <MobileNavItem to="/ai-assistant" icon={<Brain />} iconClassName="icon-neon-cyan">AI Assistant</MobileNavItem>
              <MobileNavItem to="/my-investments" icon={<Zap />} iconClassName="icon-neon-yellow">My Investments</MobileNavItem>
              <MobileNavItem to="/seller-dashboard" icon={<LayoutDashboard />} iconClassName="icon-neon-green">Seller Dashboard</MobileNavItem>
              <MobileNavItem to="/store/my-store" icon={<ShoppingBag />} iconClassName="icon-neon-purple">My Storefront</MobileNavItem>
              {user.user_metadata?.role === 'admin' && (
                <MobileNavItem to="/admin/dashboard" icon={<UserCog />} iconClassName="icon-neon-red">Admin Dashboard</MobileNavItem>
              )}
            </>
          )}
          <MobileNavItem to="/about" icon={<Users />} iconClassName="icon-neon-pink">About Us</MobileNavItem>
          <DropdownMenuSeparator />
          <MobileNavItem to="/terms-and-conditions" icon={<FileText />} iconClassName="icon-neon-teal">Terms</MobileNavItem>
          <MobileNavItem to="/privacy-policy" icon={<Shield />} iconClassName="icon-neon-teal">Privacy</MobileNavItem>
          <MobileNavItem to="/service-level-agreement" icon={<Briefcase />} iconClassName="icon-neon-teal">SLA</MobileNavItem>
          <DropdownMenuSeparator />
          <MobileNavItem onClick={() => setIsDonateModalOpen(true)} icon={<Heart />} iconClassName="icon-neon-pink">Donate</MobileNavItem>
          <MobileNavItem onClick={() => setIsInvestModalOpen(true)} icon={<DollarSign />} iconClassName="icon-neon-yellow">Invest in Us</MobileNavItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileNav;