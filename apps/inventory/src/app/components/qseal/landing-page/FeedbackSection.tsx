import * as React from 'react';

import { MessageSquare } from 'lucide-react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Switch } from '@horizon-sync/ui/components/ui/switch';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import type { FeedbackType } from '../../../types/landing-page.types';

import { CollapsibleSection } from './CollapsibleSection';
import type { SectionProps } from './types';

/**
 * Feedback & Survey section: enable/disable, choose type (feedback/survey/none),
 * configure title, description, and survey URL.
 */
export function FeedbackSection({ config, setConfig }: SectionProps) {
  const fb = config.feedback;

  return (
    <CollapsibleSection icon={MessageSquare} title="Feedback & Survey">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Enable Feedback / Survey</Label>
        <Switch checked={fb.enabled}
          onCheckedChange={(v) =>
            setConfig((c) => ({ ...c, feedback: { ...c.feedback, enabled: v } }))
          }/>
      </div>
      {fb.enabled && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={fb.type}
              onValueChange={(v) =>
                setConfig((c) => ({
                  ...c,
                  feedback: { ...c.feedback, type: v as FeedbackType },
                }))
              }>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback">Feedback Form</SelectItem>
                <SelectItem value="survey">Survey Link</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input value={fb.title}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                feedback: { ...c.feedback, title: e.target.value },
              }))
            }
            placeholder="Section title"
            className="h-8 text-xs"/>
          <Textarea value={fb.description}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                feedback: { ...c.feedback, description: e.target.value },
              }))
            }
            placeholder="Description text"
            className="text-xs"
            rows={2}/>
          {fb.type === 'survey' && (
            <Input value={fb.survey_url ?? ''}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  feedback: { ...c.feedback, survey_url: e.target.value },
                }))
              }
              placeholder="Survey URL (e.g. Google Forms)"
              className="h-8 text-xs"/>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
