import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { PlusCircle, Briefcase } from 'lucide-react';
import NewProjectDialog from '@/components/deals/NewProjectDialog';
import ProjectList from '@/components/deals/ProjectList';

const DealMakerPage = () => {
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [projectUpdated, setProjectUpdated] = useState(false);

  const handleProjectCreated = () => {
    setProjectUpdated(prev => !prev);
    setIsNewProjectDialogOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Boogasi Deal Maker</title>
        <meta name="description" content="Create, manage, and collaborate on deals with Boogasi Deal Maker." />
      </Helmet>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--boogasi-purple-val))] to-[hsl(var(--boogasi-pink-val))]">
              Boogasi Deal Maker
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              The central hub for creating, managing, and collaborating on your business deals.
            </p>
          </div>
          <Button onClick={() => setIsNewProjectDialogOpen(true)} size="lg" className="bg-gradient-to-r from-[hsl(var(--boogasi-green-val))] to-[hsl(var(--boogasi-teal-val))] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <PlusCircle className="mr-2 h-5 w-5" />
            New Deal
          </Button>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">My Deals</h2>
            </div>
            <ProjectList key={projectUpdated} />
        </div>
      </div>
      <NewProjectDialog 
        isOpen={isNewProjectDialogOpen} 
        setIsOpen={setIsNewProjectDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
};

export default DealMakerPage;