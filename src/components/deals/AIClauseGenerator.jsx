import React, { useState } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, Sparkles, Wand2 } from 'lucide-react';
    
    const AIClauseGenerator = ({ project, onInsertClause }) => {
      const { toast } = useToast();
      const [context, setContext] = useState('');
      const [generatedClause, setGeneratedClause] = useState('');
      const [isGenerating, setIsGenerating] = useState(false);
    
      const handleGenerateClause = async () => {
        if (!context.trim()) {
          toast({ title: 'Context needed', description: 'Please provide some context for the clause.', variant: 'destructive' });
          return;
        }
        setIsGenerating(true);
        setGeneratedClause('');
    
        const { data, error } = await supabase.functions.invoke('generate-clause', {
          body: {
            dealType: project.deal_type,
            context: `${project.description}\n\nAdditional points: ${context}`,
          },
        });
    
        setIsGenerating(false);
    
        if (error || data.error) {
          toast({ title: 'AI Generation Failed', description: error?.message || data.error, variant: 'destructive' });
        } else {
          setGeneratedClause(data.clause);
          toast({ title: 'Clause Generated!', description: 'The AI has generated a new clause for you.' });
        }
      };
    
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> AI Clause Generator</CardTitle>
            <CardDescription>Generate contract clauses using AI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter key points, terms, or specific details for the clause..."
                className="min-h-[120px]"
              />
            </div>
            <Button onClick={handleGenerateClause} disabled={isGenerating} className="w-full">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Clause
            </Button>
    
            {generatedClause && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold">Suggested Clause:</h4>
                <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap font-mono">
                  {generatedClause}
                </div>
                <Button variant="secondary" className="w-full" onClick={() => onInsertClause(generatedClause)}>
                  Insert into Contract
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
    };
    
    export default AIClauseGenerator;