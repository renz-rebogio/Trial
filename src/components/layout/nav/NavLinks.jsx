import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Newspaper, ShoppingCart, Brain, Heart, DollarSign, Users, FileText, Shield, Briefcase, Zap, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ to, icon, children, onClick, isExternal = false, iconClassName }) => {
  const location = useLocation();
  const isActive = !isExternal && location.pathname === to;

  const navItemVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.1, type: 'spring', stiffness: 120 } },
    hover: { 
      transition: { duration: 0.15 }
    },
    tap: { scale: 0.97 }
  };

  const commonClasses = "nav-link-3d";
  
  const IconComponent = icon ? React.cloneElement(icon, { className: cn("h-4 w-4 mr-1.5 group-hover:filter group-hover:drop-shadow-[0_0_5px_currentColor]", iconClassName) }) : null;

  if (onClick) {
    return (
      <motion.button 
        variants={navItemVariants} 
        initial="initial"
        animate="animate"
        whileHover="hover" 
        whileTap="tap" 
        onClick={onClick} 
        className={cn(commonClasses, isActive ? 'active-link' : '', 'group')}
      >
        {IconComponent}
        <span>{children}</span>
      </motion.button>
    );
  }

  if (isExternal) {
    return (
      <motion.a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        variants={navItemVariants} 
        initial="initial"
        animate="animate"
        whileHover="hover" 
        whileTap="tap" 
        className={cn(commonClasses, 'group')}
      >
        {IconComponent}
        <span>{children}</span>
      </motion.a>
    );
  }

  return (
    <motion.div 
      variants={navItemVariants} 
      initial="initial"
      animate="animate"
      whileHover="hover" 
      whileTap="tap"
    >
      <Link 
        to={to} 
        className={cn(commonClasses, isActive ? 'active-link' : '', 'group')}
      >
        {IconComponent}
        <span>{children}</span>
      </Link>
    </motion.div>
  );
};

const NavLinks = ({ user, setIsDonateModalOpen, setIsInvestModalOpen }) => {
  const navItemsConfig = [
    { to: "/", icon: <Home />, text: "Home", requiresUser: false, group: "main", iconClassName: "icon-neon-green" },
    { to: "/feed", icon: <Newspaper />, text: "Feed", requiresUser: true, group: "main", iconClassName: "icon-neon-orange" },
    { to: "/marketplace", icon: <ShoppingCart />, text: "Marketplace", requiresUser: false, group: "main", iconClassName: "icon-neon-blue" },
    { to: "/deal-maker", icon: <Briefcase />, text: "Deal Maker", requiresUser: true, group: "main", iconClassName: "icon-neon-pink" },
    { to: "/ai-assistant", icon: <Brain />, text: "Boogasi AI", requiresUser: true, group: "main", iconClassName: "icon-neon-cyan" },
    { onClick: () => setIsDonateModalOpen(true), icon: <Heart />, text: "Donate", requiresUser: false, group: "secondary", iconClassName: "icon-neon-pink" },
    { to: "/my-investments", icon: <Zap />, text: "My Investments AI", requiresUser: true, group: "secondary", iconClassName: "icon-neon-yellow" },
    { to: "/about", icon: <Users />, text: "About Us", requiresUser: false, group: "footer" },
    { to: "/terms-and-conditions", icon: <FileText />, text: "Terms", requiresUser: false, group: "footer" },
    { to: "/privacy-policy", icon: <Shield />, text: "Privacy", requiresUser: false, group: "footer" },
    { to: "/service-level-agreement", icon: <Briefcase />, text: "SLA", requiresUser: false, group: "footer" },
    { to: "/admin/dashboard", icon: <UserCog />, text: "Admin Dashboard", requiresUser: true, group: "admin", iconClassName: "icon-neon-red" },
  ];

  const visibleNavItems = navItemsConfig.filter(item => item.group === "main");

  return (
    <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
      {visibleNavItems.map((item, index) => {
        if (item.requiresUser && !user) return null;
        if (item.group === "admin" && user?.user_metadata?.role !== 'admin') return null;
        return (
          <NavItem 
            key={index} 
            to={item.to} 
            icon={item.icon} 
            onClick={item.onClick} 
            isExternal={item.isExternal}
            iconClassName={item.iconClassName}
          >
            {item.text}
          </NavItem>
        );
      })}
      {user?.user_metadata?.role === 'admin' && (
        <NavItem 
          to="/admin/dashboard" 
          icon={<UserCog />} 
          iconClassName="icon-neon-red"
        >
          Admin Dashboard
        </NavItem>
      )}
    </div>
  );
};

export default NavLinks;