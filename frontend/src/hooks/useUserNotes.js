import { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    
    export const useUserNotes = (user) => {
      const { toast } = useToast();
      const [userNotes, setUserNotes] = useState([]);
      const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
      const [currentNote, setCurrentNote] = useState(null);
      const [noteTitle, setNoteTitle] = useState('');
      const [noteContent, setNoteContent] = useState('');
      const [savingNote, setSavingNote] = useState(false);
    
      const fetchUserNotes = useCallback(async () => {
        if (!user) return;
        try {
          const { data, error } = await supabase.from('user_notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
          if (error) throw error;
          setUserNotes(data || []);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error fetching notes', description: error.message });
        }
      }, [user, toast]);
    
      useEffect(() => {
        fetchUserNotes();
      }, [fetchUserNotes]);
    
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
        if (!user || !noteTitle.trim()) {
          toast({ variant: 'warning', title: 'Missing Title' });
          return;
        }
        setSavingNote(true);
        try {
          const noteData = { user_id: user.id, title: noteTitle, content: { text: noteContent }, updated_at: new Date().toISOString() };
          if (currentNote) {
            const { data, error } = await supabase.from('user_notes').update(noteData).eq('id', currentNote.id).select().single();
            if (error) throw error;
            setUserNotes(userNotes.map(n => n.id === data.id ? data : n));
          } else {
            const { data, error } = await supabase.from('user_notes').insert(noteData).select().single();
            if (error) throw error;
            setUserNotes([data, ...userNotes]);
          }
          setIsNoteModalOpen(false);
          toast({ title: 'Note Saved!' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error saving note', description: error.message });
        } finally {
          setSavingNote(false);
        }
      };
    
      const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
          await supabase.from('user_notes').delete().eq('id', noteId);
          setUserNotes(userNotes.filter(n => n.id !== noteId));
          toast({ title: 'Note Deleted' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error deleting note', description: error.message });
        }
      };
    
      return {
        userNotes,
        isNoteModalOpen,
        setIsNoteModalOpen,
        currentNote,
        noteTitle,
        setNoteTitle,
        noteContent,
        setNoteContent,
        savingNote,
        handleOpenNewNoteModal,
        handleOpenEditNoteModal,
        handleSaveNote,
        handleDeleteNote,
      };
    };