import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { RefreshCw, Filter, Megaphone, ShoppingBag, UserCircle } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import UserNotesSection from '@/components/profile/UserNotesSection';
    
    const FeedSidebar = ({
      userNotes,
      isNoteModalOpen,
      setIsNoteModalOpen,
      currentNote,
      noteTitle,
      setNoteTitle,
      noteContent,
      setNoteContent,
      handleSaveNote,
      savingNote,
      handleOpenNewNoteModal,
      handleOpenEditNoteModal,
      handleDeleteNote,
      filter,
      setFilter,
    }) => {
      const navigate = useNavigate();
      const { toast } = useToast();
    
      return (
        <aside className="lg:col-span-3 space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--boogasi-green-val))]">My Notes</CardTitle>
              <CardDescription>Quick personal notes.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <UserNotesSection
                userNotes={userNotes.slice(0, 3)}
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
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-[hsl(var(--boogasi-green-val))] text-[hsl(var(--boogasi-green-val))] hover:bg-[hsl(var(--boogasi-green-val))]/10"
                onClick={() => navigate('/profile', { state: { activeTab: 'notes' } })}
              >
                View All Notes
              </Button>
            </CardFooter>
          </Card>
    
          <Card className="shadow-xl p-4">
            <h3 className="text-lg font-semibold mb-3 text-[hsl(var(--brighter-text-info))]">Feed Filters</h3>
            <div className="space-y-2">
              <Button variant={filter === 'latest' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setFilter('latest')}>
                <RefreshCw size={16} className="mr-2" /> Latest
              </Button>
              <Button variant={filter === 'popular' ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setFilter('popular')}>
                <Filter size={16} className="mr-2" /> Popular (Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "🚧 Feature not implemented" })}>
                <Megaphone size={16} className="mr-2" /> Announcements (Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "🚧 Feature not implemented" })}>
                <ShoppingBag size={16} className="mr-2" /> Marketplace (Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => toast({ title: "🚧 Feature not implemented" })}>
                <UserCircle size={16} className="mr-2" /> User Activity (Soon)
              </Button>
            </div>
          </Card>
        </aside>
      );
    };
    
    export default FeedSidebar;