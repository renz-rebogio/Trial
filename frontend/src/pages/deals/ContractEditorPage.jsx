import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { useParams, Link } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { FileEdit, ArrowLeft, Loader2, Save, PenSquare, ClipboardSignature as Signature } from 'lucide-react';
import AIClauseGenerator from '@/components/deals/AIClauseGenerator';
    import ReactQuill from 'react-quill';
    import SignaturePadModal from '@/components/deals/SignaturePadModal';
    import ParticipantsPanel from '@/components/deals/ParticipantsPanel';
    import ActivityFeedPanel from '@/components/deals/ActivityFeedPanel';
    
    const ContractEditorPage = () => {
      const { projectId } = useParams();
      const { user } = useAuth();
      const { toast } = useToast();
    
      const [project, setProject] = useState(null);
      const [contractContent, setContractContent] = useState('');
      const [currentVersion, setCurrentVersion] = useState(null);
      const [participants, setParticipants] = useState([]);
      const [signatures, setSignatures] = useState([]);
      const [activities, setActivities] = useState([]);
      const [onlineUsers, setOnlineUsers] = useState([]);
      
      const [isLoading, setIsLoading] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    
      const logActivity = useCallback(async (activity_type, details = {}) => {
        if (!user || !user.profile) return;
        await supabase.from('project_activity_logs').insert({
          project_id: projectId,
          user_id: user.profile.id,
          activity_type,
          details,
        });
      }, [projectId, user]);
    
      const fetchData = useCallback(async () => {
        setIsLoading(true);
        const { data: projectData, error: projectError } = await supabase
          .from('projects').select('*').eq('id', projectId).single();
    
        if (projectError) {
          toast({ title: 'Error fetching project', description: projectError.message, variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        setProject(projectData);
    
        const [participantsRes, versionsRes, signaturesRes, activitiesRes] = await Promise.all([
          supabase.from('project_participants').select('*, profiles(*)').eq('project_id', projectId),
          supabase.from('contract_versions').select('*').eq('project_id', projectId).order('version_number', { ascending: false }).limit(1),
          supabase.from('signatures').select('*').eq('project_id', projectId),
          supabase.from('project_activity_logs').select('*, profiles(name)').eq('project_id', projectId).order('created_at', { ascending: false })
        ]);
    
        setParticipants(participantsRes.data || []);
        setSignatures(signaturesRes.data || []);
        setActivities(activitiesRes.data || []);
    
        if (versionsRes.data && versionsRes.data.length > 0) {
          setCurrentVersion(versionsRes.data[0]);
          setContractContent(versionsRes.data[0].content || '');
        }
        
        setIsLoading(false);
        logActivity('contract_viewed');
      }, [projectId, toast, logActivity]);
    
      useEffect(() => {
        fetchData();
      }, [fetchData]);
    
      useEffect(() => {
        if (!projectId) return;
    
        const presenceChannel = supabase.channel(`project-presence-${projectId}`);
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const userIds = [];
            for (const id in presenceChannel.presenceState()) {
              userIds.push(presenceChannel.presenceState()[id][0]);
            }
            setOnlineUsers(userIds);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && user && user.profile) {
              await presenceChannel.track({ user_id: user.profile.user_id, name: user.profile.name });
            }
          });
    
        const dbChangesChannel = supabase
          .channel(`project-updates-${projectId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'signatures', filter: `project_id=eq.${projectId}` }, (payload) => {
            setSignatures(prev => [...prev.filter(s => s.id !== payload.new.id), payload.new]);
            fetchData(); // Re-fetch all for consistency
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_activity_logs', filter: `project_id=eq.${projectId}` }, (payload) => {
            setActivities(prev => [payload.new, ...prev]);
          })
          .subscribe();
    
        return () => {
          supabase.removeChannel(presenceChannel);
          supabase.removeChannel(dbChangesChannel);
        };
      }, [projectId, user, fetchData]);
    
      const handleSaveVersion = async () => {
        if (!user || !user.profile) return;
        setIsSaving(true);
        
        const newVersionNumber = currentVersion ? currentVersion.version_number + 1 : 1;
    
        const { data: newVersion, error } = await supabase
          .from('contract_versions')
          .insert({
            project_id: projectId,
            version_number: newVersionNumber,
            content: contractContent,
            created_by: user.profile.id,
          }).select().single();
    
        setIsSaving(false);
        if (error) {
          toast({ title: 'Error saving version', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Success', description: `Version ${newVersionNumber} has been saved.` });
          setCurrentVersion(newVersion);
          logActivity('version_saved', { version_number: newVersionNumber });
        }
      };
    
      const insertClause = (clause) => {
        const editor = document.querySelector('.ql-editor');
        if (editor) {
            editor.innerHTML += `<p><br></p><p>${clause}</p>`;
            setContractContent(editor.innerHTML);
        }
        toast({ title: 'Clause Inserted', description: 'The AI-generated clause has been added to your contract.' });
      };
    
      const currentUserParticipant = useMemo(() => participants.find(p => p.profiles.user_id === user?.id), [participants, user]);
      const hasSigned = useMemo(() => signatures.some(s => s.participant_id === currentUserParticipant?.id), [signatures, currentUserParticipant]);
      const isCreator = useMemo(() => project?.created_by === user?.id, [project, user]);
    
      if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
      }
    
      if (!project) {
        return <div className="text-center py-10">Project not found or you do not have access.</div>;
      }
    
      const quillModules = {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
          ['link'],
          ['clean']
        ],
      };
    
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto py-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileEdit className="h-10 w-10 text-[hsl(var(--boogasi-purple-val))]" />
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--boogasi-purple-val))] to-[hsl(var(--boogasi-teal-val))]">
                  {project.project_name}
                </h1>
                <p className="text-muted-foreground">Contract Editor</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
                {currentUserParticipant?.role === 'Signer' && !hasSigned && currentVersion && (
                  <Button onClick={() => setIsSignatureModalOpen(true)}>
                    <Signature className="mr-2 h-4 w-4" />
                    Sign Contract
                  </Button>
                )}
                <Link to="/deal-maker">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to Deals</Button>
                </Link>
            </div>
          </div>
    
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-lg h-full">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>Contract Document</CardTitle>
                    <CardDescription>Version: {currentVersion?.version_number || 'Unsaved'}</CardDescription>
                  </div>
                  <Button onClick={handleSaveVersion} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Version
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-background rounded-md border">
                    <ReactQuill 
                      theme="snow" 
                      value={contractContent} 
                      onChange={setContractContent}
                      modules={quillModules}
                      className="min-h-[600px]"
                      placeholder="Start writing your contract here..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
    
            <div className="space-y-8">
              <ParticipantsPanel 
                project={project}
                participants={participants}
                signatures={signatures}
                onlineUsers={onlineUsers}
                isCreator={isCreator}
                onParticipantsUpdate={fetchData}
              />
              <AIClauseGenerator project={project} onInsertClause={insertClause} />
              <ActivityFeedPanel activities={activities} />
            </div>
          </div>
          {isSignatureModalOpen && (
            <SignaturePadModal
              isOpen={isSignatureModalOpen}
              setIsOpen={setIsSignatureModalOpen}
              project={project}
              participant={currentUserParticipant}
              contractVersion={currentVersion}
              onSignatureSaved={() => {
                logActivity('contract_signed');
                fetchData();
              }}
            />
          )}
        </motion.div>
      );
    };
    
    export default ContractEditorPage;