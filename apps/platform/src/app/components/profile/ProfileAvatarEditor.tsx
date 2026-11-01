import * as React from 'react';

import { Camera, Loader2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useAuth } from '../../hooks';
import { UserService } from '../../services/user.service';
import { getUserInitials } from '../../utility/profile-utils';

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const AVATAR_SIZE = 512;

interface ProfileAvatarUser {
  avatar_url?: string | null;
  display_name?: string;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Downscales and centre-crops the selected image so the stored data URL stays small
 * (phone photos would otherwise be several MB of base64 in the user record).
 */
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Could not read that image file.'));
      element.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process that image.');

    const scale = AVATAR_SIZE / Math.min(image.width, image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, (AVATAR_SIZE - width) / 2, (AVATAR_SIZE - height) / 2, width, height);

    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface ProfileAvatarEditorProps {
  user: ProfileAvatarUser;
  sizeClassName?: string;
}

/** Avatar with an upload control that persists the new photo on the current user. */
export function ProfileAvatarEditor({ user, sizeClassName = 'h-24 w-24' }: ProfileAvatarEditorProps) {
  const { toast } = useToast();
  const { accessToken } = useAuth();
  const updateUser = useUserStore((s) => s.updateUser);
  const [preview, setPreview] = React.useState(user.avatar_url || '');
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(user.avatar_url || '');
  }, [user.avatar_url]);

  const saveAvatar = async (avatarUrl: string) => {
    if (!accessToken) {
      toast({ title: 'Error', description: 'Your session has expired. Please log in again.', variant: 'destructive' });
      return;
    }

    const previous = preview;
    setPreview(avatarUrl);
    setSaving(true);

    try {
      const updated = await UserService.updateMe({ avatar_url: avatarUrl }, accessToken);
      updateUser({ avatar_url: updated.avatar_url ?? avatarUrl });
      toast({ title: 'Success', description: 'Profile photo updated' });
    } catch (error) {
      setPreview(previous);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile photo',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: 'Unsupported file', description: 'Choose a PNG, JPG, WebP or GIF image.', variant: 'destructive' });
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      toast({ title: 'File too large', description: 'The image must be 5 MB or smaller.', variant: 'destructive' });
      return;
    }

    try {
      await saveAvatar(await fileToAvatarDataUrl(file));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not process that image.',
        variant: 'destructive',
      });
    }
  };

  const displayName = user.display_name || `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="group relative">
        <Avatar className={`${sizeClassName} ring-4 ring-background shadow-lg`}>
          <AvatarImage src={preview} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white text-2xl font-semibold">
            {getUserInitials(user.first_name, user.last_name, user.email)}
          </AvatarFallback>
        </Avatar>

        <button type="button"
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          aria-label="Change profile photo"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
        </button>

        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="sr-only" onChange={handleFileSelect} />
      </div>

      <Button type="button" variant="outline" size="sm" className="gap-2" disabled={saving} onClick={() => inputRef.current?.click()}>
        <Camera className="h-3.5 w-3.5" />
        {saving ? 'Uploading…' : preview ? 'Change photo' : 'Add photo'}
      </Button>
    </div>
  );
}
