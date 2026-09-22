import type { LandingPageConfig } from '../../../types/landing-page.types';

/**
 * Shared prop types used across landing page section components.
 */
export interface SectionProps {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}

/**
 * Props for VisualsSection — extends SectionProps with product context for image uploads.
 */
export interface VisualsSectionProps extends SectionProps {
  productId: string;
  accessToken: string | null;
}
