import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2 } from 'lucide-react';

const BusinessPlansSection = ({
  businessPlans,
  isBusinessPlanModalOpen,
  setIsBusinessPlanModalOpen,
  businessPlanTitle,
  setBusinessPlanTitle,
  businessPlanContent,
  setBusinessPlanContent,
  handleSaveBusinessPlan,
  savingBusinessPlan
}) => {
  return (
    <section>
      <div className="flex justify-between items-center mb-4 border-b pb-2 border-primary/30">
        <h3 className="text-xl font-semibold text-primary-foreground">My Business Plans / Ventures</h3>
        <Dialog open={isBusinessPlanModalOpen} onOpenChange={setIsBusinessPlanModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg glassmorphic">
            <DialogHeader>
              <DialogTitle>Create New Business Plan</DialogTitle>
              <DialogDescription>Outline your new venture or idea.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="bp-title">Title</Label>
                <Input id="bp-title" value={businessPlanTitle} onChange={(e) => setBusinessPlanTitle(e.target.value)} placeholder="My Awesome Startup Idea"/>
              </div>
              <div>
                <Label htmlFor="bp-content">Details (Template Coming Soon)</Label>
                <Textarea id="bp-content" value={businessPlanContent} onChange={(e) => setBusinessPlanContent(e.target.value)} placeholder="Executive summary, market analysis, etc." rows={6}/>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBusinessPlanModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveBusinessPlan} disabled={savingBusinessPlan}>
                {savingBusinessPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {businessPlans.length > 0 ? (
        <div className="space-y-3">
          {businessPlans.map(plan => (
            <Card key={plan.id} className="bg-muted/30 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{plan.title}</CardTitle>
                <CardDescription>Created: {new Date(plan.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2">{plan.content?.text || "No details provided."}</p>
              </CardContent>
              <CardFooter>
                <Button variant="link" size="sm" className="p-0 h-auto">View/Edit (Soon)</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">You haven't added any business plans or ventures yet.</p>
      )}
    </section>
  );
};

export default BusinessPlansSection;