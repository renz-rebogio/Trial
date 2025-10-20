import React, { useState, useEffect, useCallback } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/hooks/useAuth';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Loader2, Package, DollarSign, Settings, PlusCircle, Edit3, Trash2, Eye, FileText, Check, XCircle as XIcon } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
    } from "@/components/ui/alert-dialog";
    import UserNotesSection from '@/components/profile/UserNotesSection'; 
    
    const BUCKET_NAME = 'boogasi';
    
    const SellerDashboardPage = () => {
      const { user } = useAuth();
      const navigate = useNavigate();
      const { toast } = useToast();
      const [sellerData, setSellerData] = useState(null);
      const [products, setProducts] = useState([]);
      const [sales, setSales] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const [productToDelete, setProductToDelete] = useState(null);
    
      const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
      const [currentNote, setCurrentNote] = useState(null);
      const [noteTitle, setNoteTitle] = useState('');
      const [noteContent, setNoteContent] = useState('');
      const [savingNote, setSavingNote] = useState(false);
      const [userNotes, setUserNotes] = useState([]);
    
      const [selectedProducts, setSelectedProducts] = useState([]);
    
    
      const fetchDashboardData = useCallback(async () => {
        if (!user) {
          navigate('/auth?type=login&redirect=/seller-dashboard');
          return;
        }
        setIsLoading(true);
        try {
          const { data: sellerInfo, error: sellerError } = await supabase
            .from('sellers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); 
    
          if (sellerError && sellerError.code !== 'PGRST116') throw sellerError;
          
          if (!sellerInfo) {
            toast({ variant: 'warning', title: 'Seller Account Not Found', description: 'Please complete your seller registration.' });
            navigate('/sell-on-boogasi');
            setIsLoading(false);
            return;
          }
          setSellerData(sellerInfo);
    
          const { data: productData, error: productError } = await supabase
            .from('digital_products')
            .select(`
              id, title, price, status, 
              digital_product_categories (name), 
              digital_product_images (id, image_url, alt_text)
            `)
            .eq('seller_id', sellerInfo.id)
            .order('created_at', { ascending: false });
          if (productError) throw productError;
          setProducts(productData || []);
    
          const { data: salesData, error: salesError } = await supabase
            .from('digital_product_sales')
            .select(`*, digital_products (title)`)
            .eq('seller_id', sellerInfo.id)
            .order('sale_date', { ascending: false });
          if (salesError) throw salesError;
          setSales(salesData || []);
          
          const { data: notesData, error: notesError } = await supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
          if (notesError) throw notesError;
          setUserNotes(notesData || []);
    
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error loading dashboard', description: error.message });
        } finally {
          setIsLoading(false);
        }
      }, [user, navigate, toast]);
    
      useEffect(() => {
        fetchDashboardData();
      }, [fetchDashboardData]);
    
      const handleDeleteProduct = async () => {
        if (!productToDelete || !productToDelete.id) return;
        setIsLoading(true); 
        try {
          
          const { data: images, error: imageError } = await supabase
            .from('digital_product_images')
            .select('image_url')
            .eq('product_id', productToDelete.id);
    
          if (imageError) throw imageError;
    
          if (images && images.length > 0) {
            const filesToDelete = images.map(img => {
              try {
                const urlParts = new URL(img.image_url);
                return urlParts.pathname.substring(urlParts.pathname.indexOf(BUCKET_NAME) + BUCKET_NAME.length + 1);
              } catch (e) {
                console.warn("Invalid image URL for deletion:", img.image_url, e);
                return null;
              }
            }).filter(path => path !== null);
            
            if (filesToDelete.length > 0) {
                const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
                if (storageError) console.warn("Error deleting files from storage, proceeding with DB deletion:", storageError.message);
            }
          }
          
          await supabase.from('digital_product_images').delete().eq('product_id', productToDelete.id);
          await supabase.from('digital_product_sales').delete().eq('product_id', productToDelete.id); 
          await supabase.from('posts').update({ digital_product_id: null }).eq('digital_product_id', productToDelete.id); 
    
          const { error: deleteError } = await supabase.from('digital_products').delete().eq('id', productToDelete.id);
          if (deleteError) throw deleteError;
    
          toast({ title: 'Product Deleted', description: `"${productToDelete.title}" has been removed.` });
          fetchDashboardData(); 
        } catch (error) {
          toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
        } finally {
          setProductToDelete(null);
          setIsLoading(false);
        }
      };
    
      const handleOpenNewNoteModal = () => { setCurrentNote(null); setNoteTitle(''); setNoteContent(''); setIsNoteModalOpen(true); };
      const handleOpenEditNoteModal = (note) => { setCurrentNote(note); setNoteTitle(note.title); setNoteContent(note.content?.text || ''); setIsNoteModalOpen(true); };
      
      const handleSaveNote = async () => {
        if (!noteTitle.trim() || !noteContent.trim()) {
          toast({ variant: "destructive", title: "Cannot save note", description: "Title and content are required." });
          return;
        }
        setSavingNote(true);
        try {
          const noteData = {
            user_id: user.id,
            title: noteTitle,
            content: { text: noteContent }, 
          };
    
          if (currentNote?.id) { 
            const { error } = await supabase.from('user_notes').update(noteData).eq('id', currentNote.id);
            if (error) throw error;
            toast({ title: "Note Updated", description: "Your note has been saved." });
          } else { 
            const { error } = await supabase.from('user_notes').insert(noteData);
            if (error) throw error;
            toast({ title: "Note Saved", description: "Your new note has been created." });
          }
          setIsNoteModalOpen(false);
          fetchDashboardData(); 
        } catch (error) {
          toast({ variant: "destructive", title: "Error Saving Note", description: error.message });
        } finally {
          setSavingNote(false);
        }
      };
    
      const handleDeleteNote = async (noteId) => {
        try {
          const { error } = await supabase.from('user_notes').delete().eq('id', noteId);
          if (error) throw error;
          toast({ title: "Note Deleted", description: "The note has been removed." });
          fetchDashboardData(); 
        } catch (error) {
          toast({ variant: "destructive", title: "Error Deleting Note", description: error.message });
        }
      };
    
      const handleProductSelection = (productId) => {
        setSelectedProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
      };
    
      const handleBulkAction = async (action) => {
        if (selectedProducts.length === 0) { 
          toast({ title: "No Products Selected", description: "Please select products to perform this action."});
          return; 
        }
        setIsLoading(true);
        const newStatus = action === 'approve' ? 'active' : 'rejected';
        try {
          const updates = selectedProducts.map(id => ({ id, status: newStatus }));
          const { error } = await supabase.from('digital_products').upsert(updates);
          if (error) throw error;
          toast({ title: "Bulk Action Complete", description: `Selected products have been ${action === 'approve' ? 'approved' : 'rejected'}.` });
          setSelectedProducts([]);
          fetchDashboardData(); 
        } catch (error) {
          toast({ variant: 'destructive', title: 'Bulk Action Failed', description: error.message });
        } finally {
          setIsLoading(false);
        }
      };
    
    
      if (isLoading) {
        return <div className="flex justify-center items-center h-screen brighter-theme-area"><Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--brighter-blue))]" /></div>;
      }
      if (!sellerData) return <div className="text-center py-10 brighter-theme-area">Redirecting...</div>;
      
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.seller_payout_amount || 0), 0);
      const totalSalesCount = sales.length;
    
      return (
        <div className="container mx-auto py-8 px-4 brighter-theme-area min-h-screen"> {/* Apply brighter theme */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-[hsl(var(--brighter-blue))]">Seller Dashboard</h1>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/seller/list-product')} className="bg-[hsl(var(--brighter-blue))] hover:bg-[hsl(var(--brighter-blue))]/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> List New Product
              </Button>
              <Button variant="outline" onClick={() => navigate(`/store/${sellerData.id}`)} className="border-[hsl(var(--brighter-teal))] text-[hsl(var(--brighter-teal))] hover:bg-[hsl(var(--brighter-teal))]/10" >
                <Eye className="mr-2 h-4 w-4" /> View My Storefront
              </Button>
            </div>
          </div>
    
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold text-[hsl(var(--brighter-green))]">${totalRevenue.toFixed(2)}</div><p className="text-xs">Net earnings after 25% commission</p></CardContent></Card>
            <Card className="shadow-xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Sales</CardTitle><Package className="h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold text-[hsl(var(--brighter-teal))]">{totalSalesCount}</div><p className="text-xs">Number of products sold</p></CardContent></Card>
            <Card className="shadow-xl"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Account Status</CardTitle><Settings className="h-4 w-4" /></CardHeader><CardContent><div className={`text-2xl font-bold capitalize ${sellerData.status === 'active' ? 'text-[hsl(var(--brighter-green))]' : 'text-[hsl(var(--brighter-yellow))]'}`}>{sellerData.status.replace('_', ' ')}</div><p className="text-xs">Your seller account standing</p></CardContent></Card>
          </div>
    
          <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex mb-6 shadow-lg backdrop-blur-sm"> {/* TabsList will inherit */}
              <TabsTrigger value="products">My Products</TabsTrigger> {/* TabsTrigger will inherit */}
              <TabsTrigger value="sales">Sales History</TabsTrigger>
              <TabsTrigger value="notes">My Notes</TabsTrigger>
            </TabsList>
    
            <TabsContent value="products">
              <Card className="shadow-xl"> {/* Card will inherit */}
                <CardHeader>
                  <CardTitle>Your Digital Products</CardTitle>
                  <CardDescription>Manage your product listings. (Admin approval actions enabled for testing)</CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length > 0 && (
                    <div className="mb-4 flex space-x-2">
                      <Button size="sm" onClick={() => handleBulkAction('approve')} disabled={selectedProducts.length === 0} className="bg-[hsl(var(--brighter-green))] hover:bg-[hsl(var(--brighter-green))]/90 text-primary-foreground"><Check className="mr-1 h-4 w-4"/>Approve Selected</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleBulkAction('reject')} disabled={selectedProducts.length === 0} className="bg-[hsl(var(--brighter-pink))] hover:bg-[hsl(var(--brighter-pink))]/90"><XIcon className="mr-1 h-4 w-4"/>Reject Selected</Button>
                    </div>
                  )}
                  {products.length === 0 ? (
                    <p className="text-center py-8">You haven't listed any products yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map(product => (
                        <Card key={product.id} className="flex flex-col overflow-hidden group shadow-lg hover:shadow-[hsl(var(--brighter-blue))]/30 transition-shadow duration-300"> {/* Card will inherit */}
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="absolute top-2 left-2 h-5 w-5 z-10 accent-[hsl(var(--brighter-blue))] rounded"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleProductSelection(product.id)}
                            />
                            {product.digital_product_images && product.digital_product_images.length > 0 ? (
                              <img src={product.digital_product_images[0].image_url} alt={product.digital_product_images[0].alt_text || product.title} className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <div className="h-48 w-full flex items-center justify-center">
                                <Package className="h-16 w-16" />
                              </div>
                            )}
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg truncate group-hover:text-[hsl(var(--brighter-blue))]">{product.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {product.digital_product_categories?.name || 'N/A'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow text-sm">
                            <p>Price: <span className="font-semibold text-[hsl(var(--brighter-green))]">${product.price}</span></p>
                            <p>Status: <span className={`capitalize font-medium ${product.status === 'active' ? 'text-[hsl(var(--brighter-green))]' : product.status === 'rejected' ? 'text-[hsl(var(--brighter-pink))]' : 'text-[hsl(var(--brighter-yellow))]'}`}>{product.status.replace('_', ' ')}</span></p>
                          </CardContent>
                          <CardFooter className="flex justify-end space-x-2 p-3">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/seller/edit-product/${product.id}`)} disabled className="border-[hsl(var(--brighter-teal))] text-[hsl(var(--brighter-teal))] hover:bg-[hsl(var(--brighter-teal))]/10"> 
                              <Edit3 className="mr-1 h-3 w-3" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setProductToDelete(product)} className="bg-[hsl(var(--brighter-pink))] hover:bg-[hsl(var(--brighter-pink))]/90">
                                  <Trash2 className="mr-1 h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent> {/* Dialog will inherit */}
                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "${productToDelete?.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel className="border-[hsl(var(--brighter-teal))] text-[hsl(var(--brighter-teal))] hover:bg-[hsl(var(--brighter-teal))]/10">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteProduct} className="bg-[hsl(var(--brighter-pink))] hover:bg-[hsl(var(--brighter-pink))]/90 text-primary-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
    
            <TabsContent value="sales">
              <Card className="shadow-xl"> {/* Card will inherit */}
                <CardHeader><CardTitle>Your Sales History</CardTitle><CardDescription>Overview of all your product sales (25% platform commission applied).</CardDescription></CardHeader>
                <CardContent>
                  {sales.length === 0 ? (<p>No sales recorded yet.</p>) : (
                    <div className="overflow-x-auto"><table className="min-w-full divide-y"><thead className="bg-muted/20"><tr><th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Date</th><th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Product</th><th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Sale Price</th><th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Commission (25%)</th><th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Your Payout (75%)</th><th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Status</th></tr></thead><tbody className="divide-y">{sales.map(sale => (<tr key={sale.id}><td className="px-4 py-3 whitespace-nowrap text-sm">{new Date(sale.sale_date).toLocaleDateString()}</td><td className="px-4 py-3 whitespace-nowrap text-sm">{sale.digital_products?.title || 'N/A'}</td><td className="px-4 py-3 whitespace-nowrap text-sm">${parseFloat(sale.sale_price || 0).toFixed(2)}</td><td className="px-4 py-3 whitespace-nowrap text-sm text-[hsl(var(--brighter-pink))]">-${parseFloat(sale.commission_amount || 0).toFixed(2)}</td><td className="px-3 whitespace-nowrap text-sm text-[hsl(var(--brighter-green))]">${parseFloat(sale.seller_payout_amount || 0).toFixed(2)}</td><td className="px-4 py-3 whitespace-nowrap text-sm capitalize">{sale.status}</td></tr>))}</tbody></table></div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes">
               <UserNotesSection 
                  userNotes={userNotes}
                  isNoteModalOpen={isNoteModalOpen}
                  setIsNoteModalOpen={setIsNoteModalOpen}
                  currentNote={currentNote}
                  noteTitle={noteTitle}
                  setNoteTitle={setNoteTitle}
                  noteContent={noteContent}
                  setNoteContent={setNoteContent}
                  handleSaveNote={handleSaveNote}
                  savingNote={savingNote}
                  handleOpenNewNoteModal={handleOpenNewNoteModal}
                  handleOpenEditNoteModal={handleOpenEditNoteModal}
                  handleDeleteNote={handleDeleteNote}
                />
            </TabsContent>
          </Tabs>
        </div>
      );
    };
    
    export default SellerDashboardPage;