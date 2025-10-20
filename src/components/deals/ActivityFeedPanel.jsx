import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Save, ClipboardSignature as Signature, UserPlus, FileText } from 'lucide-react';

const activityIcons = {
  'contract_viewed': <Eye className="h-4 w-4 text-blue-500" />,
  'version_saved': <Save className="h-4 w-4 text-green-500" />,
  'contract_signed': <Signature className="h-4 w-4 text-purple-500" />,
  'participant_invited': <UserPlus className="h-4 w-4 text-orange-500" />,
  'project_created': <FileText className="h-4 w-4 text-teal-500" />,
};

const ActivityFeedPanel = ({ activities }) => {
  const renderActivityDetails = (activity) => {
    switch (activity.activity_type) {
      case 'version_saved':
        return `saved version ${activity.details.version_number}.`;
      case 'contract_signed':
        return `signed the contract.`;
      case 'participant_invited':
        return `invited ${activity.details.invited_email} as a ${activity.details.role}.`;
      case 'contract_viewed':
        return `viewed the contract.`;
      case 'project_created':
        return `created the project.`;
      default:
        return 'performed an action.';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>A log of all actions on this project.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-4">
          <div className="space-y-4">
            {activities.length > 0 ? activities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 pt-1">
                  {activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-grow">
                  <p className="text-sm">
                    <span className="font-semibold">{activity.profiles?.name || 'A user'}</span>
                    {' '}
                    {renderActivityDetails(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeedPanel;