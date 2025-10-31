import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import FloatingChatButton from '@/components/chatbox/FloatingChatButton';
import Chatbox from '@/components/chatbox/Chatbox';
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98
  }
};
const pageTransition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
  duration: 0.3
};
const Layout = ({
  children
}) => {
  const location = useLocation();
  const isAIAssistantPage = location.pathname === '/ai-assistant';
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toggleChat = () => setIsChatOpen(!isChatOpen);
  return <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster />
      <footer className="py-8 text-center border-t border-border bg-card">
        <div className="container mx-auto">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Boogasi LLC. All rights reserved.</p>
            <ul className="mt-3 flex justify-center items-center space-x-4 sm:space-x-6">
                <li>
                    <Link to="/terms-and-conditions" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                        Terms and Conditions
                    </Link>
                </li>
                <li>
                    <Link to="/privacy-policy" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                </li>
                <li>
                    <Link to="/service-level-agreement" className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">
                        Service Level Agreement
                    </Link>
                </li>
            </ul>
            {isAIAssistantPage && <p className="mt-3 text-xs text-muted-foreground/80">
                © Boogasi. This AI tool is for research and demonstration purposes only. Boogasi is not a licensed financial advisor.
              </p>}
            <p className="mt-4 text-xs text-muted-foreground/70">Built by Boogasi </p>
        </div>
    </footer>
    <FloatingChatButton onClick={toggleChat} />
    <Chatbox isOpen={isChatOpen} onClose={toggleChat} />
    </div>;
};
export default Layout;