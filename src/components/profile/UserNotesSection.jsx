import React, { useState, useEffect } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { useToast } from '@/components/ui/use-toast';
    import { PlusCircle, Loader2, Edit3, Trash2 } from 'lucide-react';
    
    const UserNotesSection = ({ user }) => {
      const { toast } = useToast();
      const [userNotes, setUserNotes] = useState([]);
      const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
      const [currentNote, setCurrentNote] = useState(null);
      const [noteTitle, setNoteTitle] = useState('');
      const [noteContent, setNoteContent] = useState('');
      const [savingNote, setSavingNote] = useState(false);
      const [isLoading, setIsLoading] = useState(true);
    
      useEffect(() => {
        if (user) {
          fetchUserNotes();
        }
      }, [user]);
    
      const fetchUserNotes = async () => {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
    
          if (error) throw error;
          setUserNotes(data || []);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error fetching notes",
            description: error.message
          });
        } finally {
          setIsLoading(false);
        }
      };
    
      const handleOpenNewNoteModal = () => {
        setCurrentNote(null);
        setNoteTitle('');
        setNoteContent('');
        setIsNoteModalOpen(true);
      };
    
      const handleOpenEditNoteModal = (note) => {
        setCurrentNote(note);
        setNoteTitle(note.title);
        setNoteContent(note.content?.text || '');
        setIsNoteModalOpen(true);
      };
    
      const handleSaveNote = async () => {
        if (!noteTitle.trim()) {
          toast({ variant: "destructive", title: "Title is required" });
          return;
        }
    
        setSavingNote(true);
        try {
          const noteData = {
            user_id: user.id,
            title: noteTitle,
            content: { text: noteContent },
            updated_at: new Date().toISOString()
          };
    
          if (currentNote) {
            const { error } = await supabase
              .from('user_notes')
              .update(noteData)
              .eq('id', currentNote.id);
            if (error) throw error;
            toast({ title: "Note Updated" });
          } else {
            const { error } = await supabase
              .from('user_notes')
              .insert(noteData);
            if (error) throw error;
            toast({ title: "Note Created" });
          }
    
          setIsNoteModalOpen(false);
          fetchUserNotes();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error saving note",
            description: error.message
          });
        } finally {
          setSavingNote(false);
        }
      };
    
      const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
    
        try {
          const { error } = await supabase
            .from('user_notes')
            .delete()
            .eq('id', noteId);
    
          if (error) throw error;
    
          toast({ title: "Note Deleted" });
          fetchUserNotes();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error deleting note",
            description: error.message
          });
        }
      };
    
      if (isLoading) {
        return (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
        );
      }
    
      return (
        <section className="brighter-theme-area"> 
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-[var(--brighter-border)]">
            <h3 className="text-xl font-semibold">My Notes</h3>
            <Button variant="outline" size="sm" onClick={handleOpenNewNoteModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Note
            </Button>
          </div>
    
          <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
            <DialogContent className="sm:max-w-lg"> 
              <DialogHeader>
                <DialogTitle>{currentNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
                <DialogDescription>
                  {currentNote ? 'Update your existing note.' : 'Jot down your thoughts, ideas, or plans.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="note-title">Title</Label>
                  <Input
                    id="note-title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="My Awesome Idea"
                  />
                </div>
                <div>
                  <Label htmlFor="note-content">Content</Label>
                  <Textarea
                    id="note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Details about my idea..."
                    rows={8}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNote} disabled={savingNote} variant="default">
                  {savingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  {currentNote ? 'Update Note' : 'Save Note'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    
          {userNotes.length > 0 ? (
            <div className="space-y-3">
              {userNotes.map(note => (
                <Card key={note.id} className="hover:shadow-md transition-shadow"> 
                  <CardHeader>
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <CardDescription>
                      Last updated: {new Date(note.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">{note.content?.text || "No content."}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditNoteModal(note)}>
                      <Edit3 className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-4">
              You haven't added any notes yet.
            </p>
          )}
        </section>
      );
    };
    
    export default UserNotesSection;