import * as React from 'react';

import { Camera, User as UserIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';

interface AvatarUploadProps {
  avatarPreview: string;
  initials: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarUpload({ avatarPreview, initials, onAvatarChange }: AvatarUploadProps) {
  return (
    <div className="flex flex-col items-center gap-4 pb-4">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-border">
          <AvatarImage src={avatarPreview || '/placeholder.svg'} alt="Profile" />
          <AvatarFallback className="text-xl bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-primary-foreground">
            {initials || <UserIcon className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 flex items-center justify-center bg-foreground/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-6 w-6 text-background" />
        </label>
        <input id="avatar-upload" type="file" accept="image/*" onChange={onAvatarChange} className="sr-only" />
      </div>
      <p className="text-sm text-muted-foreground">Click to upload profile picture</p>
    </div>
  );
}
