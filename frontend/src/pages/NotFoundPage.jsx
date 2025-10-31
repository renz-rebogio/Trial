import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
        className="max-w-md"
      >
        <AlertTriangle className="w-24 h-24 text-destructive mx-auto mb-8 animate-pulse" />
        <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-foreground mb-6">Page Not Found</h2>
        <p className="text-lg text-muted-foreground mb-10">
          Oops! The page you're looking for doesn't seem to exist. It might have been moved or deleted.
        </p>
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity duration-300">
          <Link to="/">Go Back Home</Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;