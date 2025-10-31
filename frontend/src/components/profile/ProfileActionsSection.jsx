import React from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, UploadCloud, Settings } from 'lucide-react'; // Assuming Settings for Change Password

const ProfileActionsSection = () => {
  return (
    <section>
      <h3 className="text-xl font-semibold text-primary-foreground mb-4 border-b pb-2 border-primary/30">Profile Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" className="w-full justify-start text-left" disabled>
          <Briefcase className="mr-2 h-4 w-4" /> My Listings (Coming Soon)
        </Button>
        <Button variant="outline" className="w-full justify-start text-left" disabled>
          <FileText className="mr-2 h-4 w-4" /> My Offers (Coming Soon)
        </Button>
        <Button variant="outline" className="w-full justify-start text-left" disabled>
          <Settings className="mr-2 h-4 w-4" /> Change Password (Coming Soon)
        </Button>
        <Button variant="outline" className="w-full justify-start text-left" disabled>
          <UploadCloud className="mr-2 h-4 w-4" /> Proof of Funds (Coming Soon)
        </Button>
      </div>
    </section>
  );
};

export default ProfileActionsSection;