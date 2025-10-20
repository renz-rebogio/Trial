import React from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Loader2 } from 'lucide-react';
    import PostCard from '@/components/feed/PostCard';
    import { Button } from '@/components/ui/button';
    
    const FeedMainContent = ({
      posts,
      isLoading,
      user,
      handleReaction,
      openCommentModalHandler,
      handleRepost,
      handleItemClick,
      hasMorePosts,
      fetchNextPage,
    }) => {
      if (isLoading && posts.length === 0) {
        return (
          <div className="flex justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--feed-primary-brighter))]" />
          </div>
        );
      }
    
      if (posts.length === 0 && !isLoading) {
        return (
          <p className="text-center py-10 text-muted-foreground">
            No posts yet. Be the first to share something!
          </p>
        );
      }
    
      return (
        <>
          <motion.div layout className="space-y-6">
            <AnimatePresence initial={false}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={user}
                  onReaction={handleReaction}
                  onComment={openCommentModalHandler}
                  onRepost={handleRepost}
                  onItemClick={handleItemClick}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          {hasMorePosts && !isLoading && posts.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button onClick={fetchNextPage} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Load More
              </Button>
            </div>
          )}
        </>
      );
    };
    
    export default FeedMainContent;