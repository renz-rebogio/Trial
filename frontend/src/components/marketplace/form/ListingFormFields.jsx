import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ListingFormFields = ({ register, errors, control, categories }) => {
  return (
    <>
      <div>
        <Label htmlFor="title" className="text-foreground">Project Title</Label>
        <Input 
          id="title" 
          {...register("title")} 
          placeholder="e.g., Innovative Eco Tech Startup" 
          className="bg-input text-foreground placeholder:text-muted-foreground border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]"
        />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description" className="text-foreground">Detailed Description</Label>
        <Textarea 
          id="description" 
          {...register("description")} 
          placeholder="Describe your project, team, market, and funding needs..." 
          rows={5} 
          className="bg-input text-foreground placeholder:text-muted-foreground border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]"
        />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="amountSought" className="text-foreground">Amount Sought ($)</Label>
          <Input 
            id="amountSought" 
            type="number" 
            step="0.01" 
            {...register("amountSought")} 
            placeholder="e.g., 50000" 
            className="bg-input text-foreground placeholder:text-muted-foreground border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]"
          />
          {errors.amountSought && <p className="text-sm text-destructive mt-1">{errors.amountSought.message}</p>}
        </div>
        <div>
          <Label htmlFor="categoryId" className="text-foreground">Category</Label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="categoryId" className="bg-input text-foreground border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-[hsl(var(--brighter-teal))]">
                  {categories.map(category => (
                    <SelectItem key={category.id} value={String(category.id)} className="hover:bg-accent focus:bg-accent">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
        </div>
      </div>
    </>
  );
};

export default ListingFormFields;