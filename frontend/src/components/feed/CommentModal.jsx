import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

const CommentModal = ({ isOpen, setIsOpen, post, user, onSubmitComment }) => {
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !post || !commentContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmitComment(post.id, commentContent);
      setCommentContent('');
      // setIsOpen(false); // Parent will handle closing if successful
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg bg-[hsl(var(--feed-card-bg-brighter))] text-card-foreground border-[hsl(var(--feed-primary-brighter))]/50"> 
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--feed-primary-brighter))]">Comment on {post.profiles?.screen_name}'s post</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap line-clamp-3 text-muted-foreground">{post.content}</DialogDescription>
        </DialogHeader>
        <div className="py-2 max-h-60 overflow-y-auto">
          {post.post_comments?.map(comment => (
            <div key={comment.id} className="mb-2 p-2 border border-[hsl(var(--feed-secondary-brighter))]/30 rounded-md bg-background/50 text-sm">
              <div className="flex items-center mb-1">
                <Avatar className="h-6 w-6 mr-2 border-[hsl(var(--feed-primary-brighter))] border">
                  <AvatarImage src={comment.profiles?.avatar_url} />
                  <AvatarFallback className="bg-[hsl(var(--feed-secondary-brighter))] text-secondary-foreground">{comment.profiles?.screen_name?.substring(0,1).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-[hsl(var(--feed-primary-brighter))] text-xs">{comment.profiles?.screen_name || 'User'}</span>
                <span className="text-muted-foreground text-xs ml-2">{new Date(comment.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="text-foreground pl-8 text-xs">{comment.content}</p>
            </div>
          ))}
           {post.post_comments?.length === 0 && <p className="text-muted-foreground text-sm text-center">No comments yet. Be the first!</p>}
        </div>
        <Textarea 
          value={commentContent} 
          onChange={(e) => setCommentContent(e.target.value)} 
          placeholder="Write a comment..." 
          className="bg-input text-foreground placeholder:text-muted-foreground border-[hsl(var(--feed-secondary-brighter))]/50 focus:border-[hsl(var(--feed-primary-brighter))]" 
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} className="border-[hsl(var(--feed-secondary-brighter))] text-foreground hover:bg-muted">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !commentContent.trim()} className="bg-[hsl(var(--feed-primary-brighter))] text-primary-foreground hover:bg-[hsl(var(--feed-primary-brighter))]/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;