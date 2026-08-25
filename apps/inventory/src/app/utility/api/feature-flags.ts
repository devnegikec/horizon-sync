import { apiRequest } from './core';

export interface FeatureFlagEvaluation {
    feature_name: string;
    enabled: boolean;
    visible: boolean;
}

export const featureFlagApi = {
    evaluate: (accessToken: string, featureName: string) =>
        apiRequest<FeatureFlagEvaluation>(
            `/feature-flags/evaluate/${featureName}`,
            accessToken,
        ),
};
