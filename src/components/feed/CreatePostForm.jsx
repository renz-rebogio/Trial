import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Image as ImageIcon, Video as VideoIcon, FileText, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MAX_FILE_SIZE_MB = 10; 
const MAX_MEDIA_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;

const CreatePostForm = ({ user, onPostCreated }) => {
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreviewName, setVideoPreviewName] = useState('');
  const [filePreviewName, setFilePreviewName] = useState('');

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelection = (event, setFile, setPreview, maxSize, type) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > maxSize) {
        toast({ variant: "destructive", title: "File Too Large", description: `${type} exceeds ${type === 'Image' || type === 'Video' ? MAX_MEDIA_SIZE_MB : MAX_FILE_SIZE_MB}MB limit.` });
        event.target.value = null; return;
      }
      setFile(file);
      if (type === 'Image' && setPreview) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      } else if (setPreview) { 
        setPreview(file.name);
      }
    }
  };
  
  const clearSelectedMedia = (type) => {
    if (type === 'image') { setSelectedImage(null); setImagePreview(null); if(imageInputRef.current) imageInputRef.current.value = null;}
    if (type === 'video') { setSelectedVideo(null); setVideoPreviewName(''); if(videoInputRef.current) videoInputRef.current.value = null;}
    if (type === 'file') { setSelectedFile(null); setFilePreviewName(''); if(fileInputRef.current) fileInputRef.current.value = null;}
  };

  const handleSubmitPost = async () => {
    if (!newPostContent.trim() && !selectedImage && !selectedVideo && !selectedFile) {
      toast({variant: 'warning', title: 'Empty Post', description: 'Please write something or add media.'});
      return;
    }
    if (!user) {
      toast({variant: 'destructive', title: 'Not Logged In', description: 'Please log in to post.'});
      return;
    }
    setIsPosting(true);
    
    const postDetails = {
      content: newPostContent,
      imageFile: selectedImage,
      videoFile: selectedVideo,
      otherFile: selectedFile,
    };

    try {
      await onPostCreated(postDetails);
      setNewPostContent('');
      clearSelectedMedia('image'); 
      clearSelectedMedia('video'); 
      clearSelectedMedia('file');
      toast({ title: 'Post Created!', description: 'Your post is now live on the feed.' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error Creating Post', description: error.message });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="shadow-lg feed-create-post-form">
      <CardHeader><CardTitle className="text-feed-primary">Create Post</CardTitle></CardHeader>
      <CardContent>
        <Textarea 
          placeholder={`What's on your mind, ${user?.user_metadata?.screen_name || user?.user_metadata?.name || 'User'}?`} 
          value={newPostContent} 
          onChange={(e) => setNewPostContent(e.target.value)} 
          rows={3} 
          className="mb-3 bg-input border-border text-foreground placeholder:text-muted-foreground"
        />
        
        {imagePreview && <div className="my-2 relative w-32 h-32"><img src={imagePreview} alt="Preview" className="rounded object-cover w-full h-full"/><Button variant="ghost" size="icon" className="absolute top-0 right-0 bg-black/50 text-white hover:bg-black/70 h-6 w-6" onClick={() => clearSelectedMedia('image')}><XCircle size={16}/></Button></div>}
        {videoPreviewName && <div className="my-2 text-sm flex items-center text-foreground">Video: {videoPreviewName} <Button variant="ghost" size="icon" className="ml-2 text-destructive h-6 w-6" onClick={() => clearSelectedMedia('video')}><XCircle size={16}/></Button></div>}
        {filePreviewName && <div className="my-2 text-sm flex items-center text-foreground">File: {filePreviewName} <Button variant="ghost" size="icon" className="ml-2 text-destructive h-6 w-6" onClick={() => clearSelectedMedia('file')}><XCircle size={16}/></Button></div>}

        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-feed-primary" onClick={() => imageInputRef.current?.click()}><ImageIcon size={20} /><input type="file" ref={imageInputRef} onChange={(e) => handleFileSelection(e, setSelectedImage, setImagePreview, MAX_MEDIA_SIZE_BYTES, 'Image')} accept="image/*" hidden /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-feed-primary" onClick={() => videoInputRef.current?.click()}><VideoIcon size={20} /><input type="file" ref={videoInputRef} onChange={(e) => handleFileSelection(e, setSelectedVideo, setVideoPreviewName, MAX_MEDIA_SIZE_BYTES, 'Video')} accept="video/*" hidden /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-feed-primary" onClick={() => fileInputRef.current?.click()}><FileText size={20} /><input type="file" ref={fileInputRef} onChange={(e) => handleFileSelection(e, setSelectedFile, setFilePreviewName, MAX_FILE_SIZE_BYTES, 'File')} accept=".*" hidden /></Button>
          </div>
          <Button onClick={handleSubmitPost} disabled={isPosting || (!newPostContent.trim() && !selectedImage && !selectedVideo && !selectedFile)} className="bg-feed-primary hover:bg-feed-primary/90 text-primary-foreground">
            {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;