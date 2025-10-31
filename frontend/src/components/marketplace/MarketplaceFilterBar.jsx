import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search } from 'lucide-react';

const MarketplaceFilterBar = ({
  searchTerm,
  setSearchTerm,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  categories,
  amountRangeFilter,
  setAmountRangeFilter,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end p-4 border rounded-lg bg-transparent shadow"
    >
      <div className="relative flex-grow lg:col-span-1">
        <Label htmlFor="search-projects" className="text-sm text-muted-foreground mb-1 block">Search</Label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground mt-3" />
        <Input
          id="search-projects"
          type="search"
          placeholder="Search projects, categories..."
          className="pl-10 w-full h-12 bg-input border-border focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-grow lg:col-span-1">
        <Label htmlFor="category-filter" className="text-sm text-muted-foreground mb-1 block">Category</Label>
        <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
          <SelectTrigger id="category-filter" className="w-full h-12 bg-input border-border text-foreground focus:border-[hsl(var(--brighter-blue))] focus:ring-[hsl(var(--brighter-blue))]">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-[hsl(var(--brighter-teal))]">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-grow lg:col-span-1">
        <Label className="text-sm text-muted-foreground mb-1 block">Amount Sought: <span className="text-[hsl(var(--brighter-green))]">${amountRangeFilter[0].toLocaleString()}</span> - <span className="text-[hsl(var(--brighter-green))]">${amountRangeFilter[1].toLocaleString()}</span></Label>
        <Slider
          min={0}
          max={1000000}
          step={10000}
          value={amountRangeFilter}
          onValueChange={setAmountRangeFilter}
          className="h-12 flex items-center [&>span:first-child]:bg-[hsl(var(--brighter-green))] [&_[role=slider]]:bg-[hsl(var(--brighter-pink))] [&_[role=slider]]:border-[hsl(var(--brighter-pink))]"
        />
      </div>
    </motion.div>
  );
};

export default MarketplaceFilterBar;