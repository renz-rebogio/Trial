import React from 'react';
    import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    
    const FeedTrending = () => {
      const { toast } = useToast();
      const trendingTopics = ['#AIInnovation', '#StartupGrowth', '#CryptoNews', '#EcoInvesting', '#BoogasiUpdates'];
    
      return (
        <aside className="lg:col-span-3 space-y-6 hidden lg:block">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--boogasi-purple-val))]">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {trendingTopics.map(tag => (
                  <li key={tag}>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-muted-foreground hover:text-[hsl(var(--boogasi-purple-val))]"
                      onClick={() => toast({ title: "🚧 Feature not implemented" })}
                    >
                      {tag}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--boogasi-orange-val))]">Sponsored</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Premium tools for investors - Coming Soon!</p>
            </CardContent>
          </Card>
        </aside>
      );
    };
    
    export default FeedTrending;