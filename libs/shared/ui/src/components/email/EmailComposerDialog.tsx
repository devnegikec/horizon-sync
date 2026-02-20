import * as React from 'react';
import { Mail, Paperclip, X, Loader2 } from 'lucide-react';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  content_type?: string;
  size?: number;
}

export interface EmailComposerData {
  to: string;
  cc: string[];
  subject: string;
  message: string;
  attachments: EmailAttachment[];
}

export interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRecipient?: string;
  defaultSubject?: string;
  defaultMessage?: string;
  defaultAttachments?: EmailAttachment[];
  onSend: (data: EmailComposerData) => Promise<void>;
  sending?: boolean;
  maxFileSize?: number; // in bytes
}

export function EmailComposerDialog({
  open,
  onOpenChange,
  defaultRecipient = '',
  defaultSubject = '',
  defaultMessage = '',
  defaultAttachments = [],
  onSend,
  sending = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}: EmailComposerDialogProps) {
  const [to, setTo] = React.useState(defaultRecipient);
  const [cc, setCc] = React.useState<string[]>([]);
  const [ccInput, setCcInput] = React.useState('');
  const [subject, setSubject] = React.useState(defaultSubject);
  const [message, setMessage] = React.useState(defaultMessage);
  const [attachments, setAttachments] = React.useState<EmailAttachment[]>([]);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset form when dialog opens with new defaults
  React.useEffect(() => {
    if (open) {
      setTo(defaultRecipient);
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setCc([]);
      setCcInput('');
      setAttachments(defaultAttachments || []);
      setFileError(null);
    }
  }, [open, defaultRecipient, defaultSubject, defaultMessage, defaultAttachments]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setFileError(null);
    const newAttachments: EmailAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > maxFileSize) {
        setFileError(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxFileSize)}`);
        continue;
      }

      try {
        const base64Content = await fileToBase64(file);
        newAttachments.push({
          filename: file.name,
          content: base64Content,
          content_type: file.type || 'application/octet-stream',
          size: file.size,
        });
      } catch (error) {
        setFileError(`Failed to process file "${file.name}"`);
      }
    }

    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleAddCc = () => {
    const emails = ccInput
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length > 0) {
      setCc([...cc, ...emails]);
      setCcInput('');
    }
  };

  const removeCc = (index: number) => {
    setCc(cc.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSend({
        to,
        cc,
        subject,
        message,
        attachments,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email
          </DialogTitle>
          <DialogDescription>Compose and send an email with attachments</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc">CC</Label>
            <div className="flex gap-2">
              <Input
                id="cc"
                type="text"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                placeholder="cc@example.com (comma-separated)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCc();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddCc}>
                Add
              </Button>
            </div>
            {cc.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {cc.map((email, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeCc(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Add Attachments
              </Button>
              <span className="text-xs text-muted-foreground">
                Max {formatFileSize(maxFileSize)} per file
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />

            {fileError && <p className="text-sm text-destructive">{fileError}</p>}

            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((att, index) => {
                  // Check if this is a default attachment (from PDF generation)
                  const isDefaultAttachment = defaultAttachments?.some(
                    (defAtt) => defAtt.filename === att.filename && defAtt.content === att.content
                  );
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{att.filename}</span>
                        {att.size && (
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(att.size)})
                          </span>
                        )}
                        {isDefaultAttachment && (
                          <Badge variant="secondary" className="text-xs">
                            Auto-attached
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending} className="gap-2">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
