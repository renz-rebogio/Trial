import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, UserCircle, Settings, LayoutDashboard, LogOut, Brain, Newspaper, Zap, ShoppingBag, UserCog } from 'lucide-react'; 
import { cn } from '@/lib/utils';

const NavActions = ({ user, authLoading, handleLogout, navigate }) => {
  if (authLoading) {
    return <div className="h-10 w-20 flex items-center justify-center"></div>; 
  }

  const iconClass = (colorClass) => cn("mr-2 h-4 w-4", colorClass);

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.05, filter: 'drop-shadow(0 0 8px hsl(var(--boogasi-cyan)))' }} 
            whileTap={{ scale: 0.95 }}
            className="nav-link-3d p-0.5 rounded-full cursor-pointer group" 
          >
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-primary/50 shadow-md group-hover:border-[hsl(var(--boogasi-cyan))] transition-colors">
              <AvatarImage src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.user_metadata?.screen_name || user.user_metadata?.name || user.email}`} alt={user.user_metadata?.name} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">{user.user_metadata?.screen_name ? user.user_metadata.screen_name.substring(0,1).toUpperCase() : (user.user_metadata?.name ? user.user_metadata.name.substring(0,1).toUpperCase() : (user.email ? user.email.substring(0,1).toUpperCase() : 'U'))}</AvatarFallback>
            </Avatar>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 glassmorphic-dropdown radix-dropdown-menu-content" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-foreground">{user.user_metadata?.screen_name || user.user_metadata?.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-blue))]" onClick={() => navigate('/profile')}><UserCircle className={iconClass("icon-neon-blue")} />Profile</DropdownMenuItem>
          <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-orange))]" onClick={() => navigate('/feed')}><Newspaper className={iconClass("icon-neon-orange")} />Feed</DropdownMenuItem>
          <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-cyan))]" onClick={() => navigate('/ai-assistant')}><Brain className={iconClass("icon-neon-cyan")} />Boogasi AI</DropdownMenuItem>
          <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-yellow))]" onClick={() => navigate('/my-investments')}><Zap className={iconClass("icon-neon-yellow")} />My Investments AI</DropdownMenuItem>
          <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-green))]" onClick={() => navigate('/seller-dashboard')}><LayoutDashboard className={iconClass("icon-neon-green")} />Seller Dashboard</DropdownMenuItem>
          <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-purple))]" onClick={() => navigate('/store/my-store')}><ShoppingBag className={iconClass("icon-neon-purple")} />My Storefront</DropdownMenuItem> {/* Example new item */}
          {user.user_metadata?.role === 'admin' && (
            <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-red))]" onClick={() => navigate('/admin/dashboard')}><UserCog className={iconClass("icon-neon-red")} />Admin Dashboard</DropdownMenuItem>
          )}
          <DropdownMenuItem className="radix-dropdown-menu-item hover:!text-[hsl(var(--boogasi-teal))]" disabled><Settings className={iconClass("icon-neon-teal")} />Settings (Soon)</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive hover:!bg-destructive/20 hover:!text-[hsl(var(--boogasi-red))] radix-dropdown-menu-item" onClick={handleLogout}><LogOut className={iconClass("icon-neon-pink")} />Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-2">
      <Button variant="outline" onClick={() => navigate('/auth?type=login')} className="nav-link-3d nav-button group">
        <LogIn className="mr-2 h-4 w-4 icon-neon-green transition-colors group-hover:filter group-hover:drop-shadow-[0_0_8px_hsl(var(--boogasi-green))]" /> Log In
      </Button>
      <Button onClick={() => navigate('/auth?type=register')} className="nav-button-primary group">
        <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" /> Sign Up
      </Button>
    </div>
  );
};

export default NavActions;