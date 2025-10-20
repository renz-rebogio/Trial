import React, { useState, useEffect } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { Link } from 'react-router-dom';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Loader2, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
    import { motion } from 'framer-motion';
    
    const ProjectList = () => {
      const { user } = useAuth();
      const [projects, setProjects] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState(null);
    
      useEffect(() => {
        const fetchProjects = async () => {
          if (!user) return;
          setIsLoading(true);
          
          const { data, error } = await supabase.rpc('get_user_projects');
    
          if (error) {
            console.error('Error fetching projects:', error);
            setError(error.message);
          } else {
            setProjects(data);
          }
          setIsLoading(false);
        };
    
        fetchProjects();
      }, [user]);
    
      if (isLoading) {
        return (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }
    
      if (error) {
        return (
          <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Could not load your projects: {error}</p>
            </CardContent>
          </Card>
        );
      }
    
      if (projects.length === 0) {
        return (
          <div className="text-center py-16 px-6 border-2 border-dashed border-border/50 rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No Deals Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first deal. You'll see projects you create or are invited to here.
            </p>
          </div>
        );
      }
    
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="truncate">{project.project_name}</CardTitle>
                  <CardDescription>{project.deal_type}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                  <div className="mt-4">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">Status: </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-bold">{project.status}</span>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link to={`/project/${project.id}/editor`}>
                    <Button className="w-full">
                      Open Editor <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      );
    };
    
    export default ProjectList;