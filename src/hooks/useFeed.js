import { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    
    const POSTS_PER_PAGE = 10;
    const FEED_MEDIA_BUCKET = 'boogasi';
    
    export const useFeed = (user) => {
      const { toast } = useToast();
      const [posts, setPosts] = useState([]);
      const [isLoadingPosts, setIsLoadingPosts] = useState(true);
      const [currentPage, setCurrentPage] = useState(1);
      const [hasMorePosts, setHasMorePosts] = useState(true);
      const [filter, setFilter] = useState('latest');
    
      const fetchPosts = useCallback(async (page = 1, shouldRefresh = false) => {
        if (!hasMorePosts && !shouldRefresh && page > 1) return;
        setIsLoadingPosts(true);
    
        const from = (page - 1) * POSTS_PER_PAGE;
        const to = page * POSTS_PER_PAGE - 1;
    
        try {
          let query = supabase
            .from('posts')
            .select(`
              *,
              profiles (id, screen_name, name, avatar_url),
              listings (id, title, amount_sought),
              digital_products (id, title, price),
              post_reactions (id, user_id, reaction_type),
              post_comments (id, user_id, content, created_at, profiles (screen_name, name, avatar_url)),
              reposts (id, user_id)
            `)
            .range(from, to);
    
          if (filter === 'latest') {
            query = query.order('created_at', { ascending: false });
          } else if (filter === 'popular') {
            query = query.order('created_at', { ascending: false });
            toast({ title: "Popular filter coming soon!", description: "Showing latest posts for now." });
          }
    
          const { data, error } = await query;
          if (error) throw error;
    
          setPosts(prevPosts => shouldRefresh ? (data || []) : [...prevPosts, ...(data || [])]);
          setCurrentPage(page);
          setHasMorePosts((data || []).length === POSTS_PER_PAGE);
        } catch (error) {
          console.error("Error fetching posts:", error);
          toast({ variant: 'destructive', title: 'Error fetching posts', description: error.message });
        } finally {
          setIsLoadingPosts(false);
        }
      }, [toast, filter, hasMorePosts]);
    
      const handleRefreshPosts = useCallback(() => {
        setPosts([]);
        setCurrentPage(1);
        setHasMorePosts(true);
        fetchPosts(1, true);
      }, [fetchPosts]);
    
      useEffect(() => {
        if (user) {
          handleRefreshPosts();
        }
      }, [user, filter, handleRefreshPosts]);
    
      const uploadToStorage = async (file, pathPrefix) => {
        if (!file || !user) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${pathPrefix}/${user.id}/${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from(FEED_MEDIA_BUCKET).upload(fileName, file, { contentType: file.type });
        if (error) throw error;
        const publicURLData = supabase.storage.from(FEED_MEDIA_BUCKET).getPublicUrl(data.path);
        return publicURLData.data.publicUrl;
      };
    
      const handlePostCreated = async (postDetails) => {
        if (!user || !user.id) {
          toast({ variant: 'destructive', title: 'Authentication Error', description: 'User ID is missing. Cannot create post.' });
          return;
        }
    
        let imageUrl = null, videoUrl = null, fileUrl = null, fileName = null, fileType = null;
        if (postDetails.imageFile) imageUrl = await uploadToStorage(postDetails.imageFile, 'feed_images');
        if (postDetails.videoFile) videoUrl = await uploadToStorage(postDetails.videoFile, 'feed_videos');
        if (postDetails.otherFile) {
          fileUrl = await uploadToStorage(postDetails.otherFile, 'feed_files');
          fileName = postDetails.otherFile.name;
          fileType = postDetails.otherFile.type;
        }
    
        const { data: newPostData, error } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            content: postDetails.content,
            image_upload_url: imageUrl,
            video_upload_url: videoUrl,
            file_upload_url: fileUrl,
            file_upload_name: fileName,
            file_upload_type: fileType,
          })
          .select(`*, profiles (id, screen_name, name, avatar_url), post_reactions(*), post_comments(*), reposts(*)`)
          .single();
    
        if (error) {
          console.error("Error in handlePostCreated (insert):", error);
          throw error;
        }
    
        setPosts(prevPosts => [newPostData, ...prevPosts]);
        if (filter !== 'latest') {
          handleRefreshPosts();
        }
      };
    
      const handleReaction = async (postId, reactionType) => {
        if (!user || !user.id) { toast({ variant: 'destructive', title: 'Not Logged In' }); return; }
    
        const existingReaction = posts.find(p => p.id === postId)?.post_reactions
          .find(r => r.user_id === user.id && r.reaction_type === reactionType);
    
        try {
          if (existingReaction) {
            await supabase.from('post_reactions').delete().match({ id: existingReaction.id });
          } else {
            await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
          }
          const updatedPosts = posts.map(p => {
            if (p.id === postId) {
              let newReactions = [...(p.post_reactions || [])];
              if (existingReaction) {
                newReactions = newReactions.filter(r => r.id !== existingReaction.id);
              } else {
                newReactions.push({ user_id: user.id, reaction_type: reactionType, post_id: postId, id: `temp-${Date.now()}` });
              }
              return { ...p, post_reactions: newReactions };
            }
            return p;
          });
          setPosts(updatedPosts);
        } catch (error) {
          console.error("Error in handleReaction:", error);
          toast({ variant: 'destructive', title: 'Error Reacting', description: error.message });
          handleRefreshPosts();
        }
      };
    
      const handleCommentSubmit = async (postId, commentText) => {
        if (!user || !user.id || !commentText.trim()) return null;
        try {
          const { data: newComment, error: commentError } = await supabase.from('post_comments').insert({
            post_id: postId,
            user_id: user.id,
            content: commentText,
          }).select('*, profiles(screen_name, name, avatar_url)').single();
    
          if (commentError) throw commentError;
    
          const updatedPosts = posts.map(p => {
            if (p.id === postId) {
              return { ...p, post_comments: [...(p.post_comments || []), newComment] };
            }
            return p;
          });
          setPosts(updatedPosts);
          toast({ title: "Comment Posted!" });
          return newComment;
        } catch (error) {
          console.error("Error in handleCommentSubmit:", error);
          toast({ variant: 'destructive', title: 'Error Posting Comment', description: error.message });
          return null;
        }
      };
    
      const handleRepost = async (postId) => {
        if (!user || !user.id) { toast({ variant: 'destructive', title: 'Not Logged In' }); return; }
    
        const existingRepost = posts.find(p => p.id === postId)?.reposts
          .find(r => r.user_id === user.id);
    
        try {
          if (existingRepost) {
            await supabase.from('reposts').delete().match({ user_id: user.id, original_post_id: postId });
            toast({ title: "Repost Removed" });
          } else {
            await supabase.from('reposts').insert({ original_post_id: postId, user_id: user.id });
            toast({ title: "Post Reposted!" });
          }
          const updatedPosts = posts.map(p => {
            if (p.id === postId) {
              let newReposts = [...(p.reposts || [])];
              if (existingRepost) {
                newReposts = newReposts.filter(r => !(r.user_id === user.id && r.original_post_id === postId));
              } else {
                newReposts.push({ user_id: user.id, original_post_id: postId, id: `temp-repost-${Date.now()}` });
              }
              return { ...p, reposts: newReposts };
            }
            return p;
          });
          setPosts(updatedPosts);
        } catch (error) {
          console.error("Error in handleRepost:", error);
          toast({ variant: 'destructive', title: 'Error Reposting', description: error.message });
          handleRefreshPosts();
        }
      };
    
      return {
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
        fetchNextPage: () => fetchPosts(currentPage + 1),
      };
    };