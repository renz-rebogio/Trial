import React from 'react';
import { Mail, User } from 'lucide-react';

const AccountDetailsSection = ({ profile, user }) => {
  return (
    <section>
      <h3 className="text-xl font-semibold text-primary-foreground mb-4 border-b pb-2 border-primary/30">Account Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start space-x-3 p-4 rounded-md bg-muted/50 shadow-inner">
          <User className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium text-lg">{profile.name}</p>
          </div>
        </div>
        <div className="flex items-start space-x-3 p-4 rounded-md bg-muted/50 shadow-inner">
          <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">Email Address</p>
            <p className="font-medium text-lg">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.email_confirmed_at ? `Verified on ${new Date(user.email_confirmed_at).toLocaleDateString()}` : 'Email not verified'}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountDetailsSection;