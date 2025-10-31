import React, { useState, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/hooks/useAuth';
    import { Button } from '@/components/ui/button';
    import { RefreshCw } from 'lucide-react';
    
    import { useFeed } from '@/hooks/useFeed';
    import { useUserNotes } from '@/hooks/useUserNotes';
    
    import CreatePostForm from '@/components/feed/CreatePostForm';
    import CommentModal from '@/components/feed/CommentModal';
    import FeedSidebar from '@/components/feed/FeedSidebar';
    import FeedMainContent from '@/components/feed/FeedMainContent';
    import FeedTrending from '@/components/feed/FeedTrending';
    
    const FeedPage = () => {
      const { user } = useAuth();
      const navigate = useNavigate();
    
      const {
        posts,
        isLoadingPosts,
        hasMorePosts,
        filter,
        setFilter,
        handleRefreshPosts,
        handlePostCreated,
        handleReaction,
        handleCommentSubmit,
        handleRepost,
        fetchNextPage,
      } = useFeed(user);
    
      const {
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
      } = useUserNotes(user);
    
      const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
      const [commentingOnPost, setCommentingOnPost] = useState(null);
    
      const openCommentModalHandler = (post) => {
        setCommentingOnPost(post);
        setIsCommentModalOpen(true);
      };
    
      const onCommentSubmit = async (postId, commentText) => {
        const newComment = await handleCommentSubmit(postId, commentText);
        if (newComment) {
          setIsCommentModalOpen(false);
        }
      };
    
      const handleItemClick = (post) => {
        if (post.listings?.id) {
          navigate(`/marketplace?listing=${post.listings.id}`);
        } else if (post.digital_products?.id) {
          navigate(`/product/${post.digital_products.id}`);
        } else if (post.shared_article_url) {
          window.open(post.shared_article_url, '_blank');
        }
      };
    
      return (
        <div className="container mx-auto py-8 px-2 md:px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 brighter-theme-area">
          <FeedSidebar
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
            filter={filter}
            setFilter={setFilter}
          />
    
          <main className="lg:col-span-6 space-y-6">
            <CreatePostForm user={user} onPostCreated={handlePostCreated} />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleRefreshPosts} disabled={isLoadingPosts}>
                <RefreshCw size={16} className={`mr-2 ${isLoadingPosts ? 'animate-spin' : ''}`} /> Refresh Feed
              </Button>
            </div>
            <FeedMainContent
              posts={posts}
              isLoading={isLoadingPosts}
              user={user}
              handleReaction={handleReaction}
              openCommentModalHandler={openCommentModalHandler}
              handleRepost={handleRepost}
              handleItemClick={handleItemClick}
              hasMorePosts={hasMorePosts}
              fetchNextPage={fetchNextPage}
            />
          </main>
    
          {commentingOnPost && (
            <CommentModal
              isOpen={isCommentModalOpen}
              setIsOpen={setIsCommentModalOpen}
              post={commentingOnPost}
              user={user}
              onSubmitComment={onCommentSubmit}
            />
          )}
    
          <FeedTrending />
        </div>
      );
    };
    
    export default FeedPage;