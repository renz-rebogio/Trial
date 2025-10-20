import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, BadgeCheck, Eye, EyeOff, Clock, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const formatCurrency = (value) => {
  if (!value) return '$0';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return `${value}`;
};

const ProfileHeader = ({
  profile,
  user,
  avatarPreview,
  isEditModalOpen,
  setIsEditModalOpen,
  name,
  setName,
  screenName,
  setScreenName,
  country,
  setCountry,
  stateProvince,
  setStateProvince,
  handleAvatarChange,
  handleProfileUpdate,
  updatingProfile,
  investorVerificationInfo 
}) => {
  const getAvatarUrl = (url) => {
    if (!url) return null;
    return url.includes('?t=') ? url : `${url}?t=${new Date().getTime()}`;
  };

  const showBadge = investorVerificationInfo?.isVerified && investorVerificationInfo?.badgeVisible;
  const verificationStatus = investorVerificationInfo?.status; 

  let statusIndicator = null;
  if (showBadge) {
    statusIndicator = (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex items-center gap-1 p-1 pr-2 rounded-full bg-green-500/10 border border-green-500/30 cursor-default"
            >
              <BadgeCheck className="h-5 w-5 text-green-400" />
              <span className="text-xs font-medium text-green-300">{`Verified Boogasi Investor – ${formatCurrency(investorVerificationInfo.range)}`}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-background border-primary/30 text-foreground">
            <p className="flex items-center gap-1.5"><Info className="h-4 w-4 text-primary" /> This user has verified their investment capacity with Boogasi. Trust and transparency matter here.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } else if (verificationStatus === 'pending_review') {
    statusIndicator = (
      <div 
        className="flex items-center gap-1 p-1 pr-2 rounded-full bg-amber-500/10 border border-amber-500/30"
        title="Verification Under Review"
      >
        <Clock className="h-5 w-5 text-amber-400" />
        <span className="text-xs font-medium text-amber-300">Verification Under Review</span>
      </div>
    );
  }


  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border/40 shadow-lg">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <Avatar className="w-28 h-28 border-4 border-background shadow-xl ring-2 ring-primary/50">
              <AvatarImage
                src={getAvatarUrl(avatarPreview || profile?.avatar_url)}
                alt={profile?.name || 'Profile'}
              />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                {(profile?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2.5 cursor-pointer shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/80"
            >
              <Camera className="w-5 h-5" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-primary-foreground">{profile?.name || 'Anonymous User'}</h1>
              {statusIndicator}
            </div>
            <p className="text-muted-foreground/80">@{profile?.screen_name || 'username'}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {profile?.country && profile?.state_province
                ? `${profile.state_province}, ${profile.country}`
                : profile?.country || profile?.state_province || 'Location not set'}
            </p>
          </div>

          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-2 border-primary/50 text-primary/90 hover:bg-primary/10 hover:text-primary">
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="glassmorphic">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="screenName">Username</Label>
                  <Input
                    id="screenName"
                    value={screenName}
                    onChange={(e) => setScreenName(e.target.value)}
                    placeholder="Your username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Your country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateProvince">State/Province</Label>
                  <Input
                    id="stateProvince"
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    placeholder="Your state or province"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleProfileUpdate}
                  disabled={updatingProfile}
                >
                  {updatingProfile && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;