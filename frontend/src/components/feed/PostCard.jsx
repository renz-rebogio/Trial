import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageSquare, Repeat, FileText, ExternalLink, Briefcase, Zap, Megaphone, Rocket, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNowStrict } from 'date-fns';

const PostCard = ({ post, user, onReaction, onComment, onRepost, onItemClick }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const userHasLiked = post.post_reactions?.some(r => r.user_id === user?.id && r.reaction_type === 'like');
  const userHasReposted = post.reposts?.some(r => r.user_id === user?.id);

  const getPostTypeIcon = () => {
    if (post.listings) return <Briefcase size={18} className="text-[hsl(var(--boogasi-blue-val))]" />;
    if (post.digital_products) return <Zap size={18} className="text-[hsl(var(--boogasi-purple-val))]" />;
    if (post.shared_article_url) return <FileText size={18} className="text-[hsl(var(--boogasi-teal-val))]" />;
    
    const content = post.content?.toLowerCase() || '';
    if (content.includes('announcement') || content.includes('update')) return <Megaphone size={18} className="text-[hsl(var(--boogasi-orange-val))]" />;
    if (content.includes('launch') || content.includes('new product')) return <Rocket size={18} className="text-[hsl(var(--boogasi-pink-val))]" />;
    if (post.profiles?.screen_name?.toLowerCase().includes('boogasi admin')) return <Building2 size={18} className="text-[hsl(var(--boogasi-red-val))]" />;
    
    // Default to user avatar if available, otherwise a generic icon or fallback
    if (post.profiles?.avatar_url) {
      return <AvatarImage src={post.profiles.avatar_url} alt={post.profiles.screen_name} />;
    }
    // Fallback icon if no specific type and no avatar
    return <UserCircleIcon size={18} className="text-[hsl(var(--boogasi-green-val))]" />; // Example, replace UserCircleIcon if not available
  };
  
  const getAvatarFallback = () => {
    if (post.profiles?.screen_name) return post.profiles.screen_name.substring(0,1).toUpperCase();
    if (post.listings) return 'L';
    if (post.digital_products) return 'P';
    if (post.shared_article_url) return 'A';
    const content = post.content?.toLowerCase() || '';
    if (content.includes('announcement') || content.includes('update')) return '!';
    if (content.includes('launch') || content.includes('new product')) return '🚀';
    if (post.profiles?.screen_name?.toLowerCase().includes('boogasi admin')) return 'B';
    return 'U'; // User / System
  };


  const timeAgo = post.created_at ? formatDistanceToNowStrict(new Date(post.created_at), { addSuffix: true }) : 'recently';

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout>
      <Card className="shadow-md overflow-hidden feed-card-style border border-[hsl(var(--brighter-border-val))]">
        <CardHeader className="flex flex-row items-start space-x-3 p-4">
          <Avatar className="h-10 w-10 border-2 border-[hsl(var(--feed-primary-brighter))]">
            {getPostTypeIcon()}
            <AvatarFallback className="bg-[hsl(var(--feed-secondary-brighter))] text-[hsl(var(--secondary-foreground))]">{getAvatarFallback()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div onClick={() => onItemClick(post)} className="cursor-pointer">
              <CardTitle className="text-base font-semibold hover:underline text-[hsl(var(--brighter-foreground-val))]">
                {post.profiles?.screen_name || post.profiles?.name || 'Boogasi Update'}
              </CardTitle>
              <CardDescription className="text-xs text-[hsl(var(--brighter-muted-foreground-val))]">{timeAgo}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-2 text-sm text-[hsl(var(--brighter-foreground-val))] cursor-pointer" onClick={() => onItemClick(post)}>
          {post.shared_article_url && (
            <div className="mb-3 p-3 border rounded-md bg-[hsl(var(--brighter-card-alt-bg-val))]">
              <p className="text-xs text-[hsl(var(--brighter-muted-foreground-val))]">Shared Article:</p>
              <a href={post.shared_article_url} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--brighter-text-accent))] hover:underline font-semibold text-base block" onClick={(e) => e.stopPropagation()}>
                {post.shared_article_title || "View Article"} <ExternalLink size={14} className="inline ml-1" />
              </a>
              {post.shared_article_source && <p className="text-xs text-[hsl(var(--brighter-muted-foreground-val))]">Source: {post.shared_article_source}</p>}
              {post.shared_article_summary && <p className="text-xs text-[hsl(var(--brighter-muted-foreground-val))] mt-1 line-clamp-2">{post.shared_article_summary}</p>}
            </div>
          )}

          <p className="whitespace-pre-wrap line-clamp-4">{post.content}</p>
          
          {post.image_upload_url && <img loading="lazy" src={post.image_upload_url} alt="Post image" className="mt-2 rounded-md max-h-72 w-auto mx-auto object-contain"/>}
          
          {post.video_upload_url && (
            <div className="mt-2 relative rounded-md overflow-hidden" style={{paddingBottom: "56.25%", height: 0}}>
                <video src={post.video_upload_url} controls className="absolute top-0 left-0 w-full h-full" onClick={(e) => e.stopPropagation()} />
            </div>
           )}

          {post.file_upload_url && (
            <div className="mt-2 p-2 border rounded-md bg-[hsl(var(--brighter-card-alt-bg-val))] flex items-center justify-between">
              <a href={post.file_upload_url} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--brighter-text-accent))] hover:underline flex items-center" onClick={(e) => e.stopPropagation()}>
                <FileText size={16} className="mr-1"/>
                {post.file_upload_name || "View Attached File"}
              </a>
              <span className="text-xs text-[hsl(var(--brighter-muted-foreground-val))]">{post.file_upload_type}</span>
            </div>
          )}
          
          {post.listings && (<div className="mt-3 border rounded-md p-3 bg-[hsl(var(--brighter-card-alt-bg-val))] hover:shadow-sm"><p className="font-semibold text-xs text-[hsl(var(--brighter-text-primary))]">Marketplace Listing Attached:</p><p className="text-sm font-medium">{post.listings.title}</p><p className="text-xs">Seeking: ${post.listings.amount_sought?.toLocaleString()}</p></div>)}
          {post.digital_products && (<div className="mt-3 border rounded-md p-3 bg-[hsl(var(--brighter-card-alt-bg-val))] hover:shadow-sm"><p className="font-semibold text-xs text-[hsl(var(--brighter-text-info))]">Digital Product Attached:</p><p className="text-sm font-medium">{post.digital_products.title}</p><p className="text-xs">Price: ${post.digital_products.price?.toLocaleString()}</p></div>)}
        </CardContent>
        
        <CardFooter className="flex justify-around p-2 border-t border-[hsl(var(--brighter-border-val))]">
          <Button variant="ghost" size="sm" className={`hover:text-[hsl(var(--primary))] ${userHasLiked ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--brighter-muted-foreground-val))]'}`} onClick={(e) => { e.stopPropagation(); onReaction(post.id, 'like'); }}>
            <ThumbsUp size={16} className="mr-1" /> Like ({post.post_reactions?.filter(r => r.reaction_type === 'like').length || 0})
          </Button>
          <Button variant="ghost" size="sm" className="hover:text-[hsl(var(--primary))] text-[hsl(var(--brighter-muted-foreground-val))]" onClick={(e) => { e.stopPropagation(); onComment(post); }}>
            <MessageSquare size={16} className="mr-1" /> Comment ({post.post_comments?.length || 0})
          </Button>
          <Button variant="ghost" size="sm" className={`hover:text-[hsl(var(--primary))] ${userHasReposted ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--brighter-muted-foreground-val))]'}`} onClick={(e) => { e.stopPropagation(); onRepost(post.id); }}>
            <Repeat size={16} className="mr-1" /> Repost ({post.reposts?.length || 0})
          </Button>
        </CardFooter>

        {post.post_comments && post.post_comments.length > 0 && (
          <div className="px-4 pb-2 pt-1 bg-[hsl(var(--brighter-card-alt-bg-val))] border-t border-[hsl(var(--brighter-border-val))]">
            <h4 className="text-xs font-semibold mb-1 text-[hsl(var(--brighter-foreground-val))]">Comments:</h4>
            {post.post_comments.slice(0,1).map(comment => (
              <div key={comment.id} className="text-xs mb-1 p-1 rounded ">
                <span className="font-semibold text-[hsl(var(--brighter-text-primary))]">{comment.profiles?.screen_name || 'User'}: </span>
                <span className="text-[hsl(var(--brighter-muted-foreground-val))] line-clamp-1">{comment.content}</span>
              </div>
            ))}
            {post.post_comments.length > 1 && <Button variant="link" size="sm" className="text-xs p-0 h-auto text-[hsl(var(--brighter-text-accent))] hover:text-[hsl(var(--primary))]" onClick={(e) => {e.stopPropagation(); onComment(post);}}>View all comments</Button>}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// A simple UserCircleIcon if not available from lucide-react or similar
const UserCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
  </svg>
);


export default PostCard;