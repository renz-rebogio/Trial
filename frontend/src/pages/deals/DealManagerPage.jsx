import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileSignature, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const DealManagerPage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-8 px-4 md:px-6 lg:px-8 brighter-theme-area"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <FileSignature className="h-10 w-10 text-[hsl(var(--boogasi-pink-val))]" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--boogasi-pink-val))] to-[hsl(var(--boogasi-purple-val))]">
            Boogasi Deal Manager
          </h1>
        </div>
        <Link to="/deal-manager/new">
          <Button variant="default" size="lg" className="bg-gradient-to-r from-[hsl(var(--boogasi-green-val))] to-[hsl(var(--boogasi-teal-val))] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Deal
          </Button>
        </Link>
      </div>

      <Card className="shadow-2xl border-border/40 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-foreground">Your Deals</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your ongoing and completed deals here.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center">
          <Loader2 className="h-16 w-16 text-[hsl(var(--boogasi-pink-val))] animate-spin mb-6" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Deal Listing Coming Soon!</h3>
          <p className="text-muted-foreground max-w-md">
            This area will soon display all your active and past deals. For now, you can start by creating a new deal.
          </p>
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YnVzaW5lc3MlMjBkZWFsfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
            alt="Business people shaking hands over a deal"
            className="mt-8 w-full max-w-sm rounded-lg shadow-lg opacity-80"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DealManagerPage;