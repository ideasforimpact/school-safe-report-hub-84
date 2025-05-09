
import { FeedbackForm } from '@/types/feedbackTypes';
import { FormSubmission } from '@/contexts/feedback/types';
import { initialForms, initialSubmissions } from '@/contexts/feedback/initialData';

export const mockFeedbackForms: FeedbackForm[] = initialForms;
export const mockFormResponses: FormSubmission[] = initialSubmissions as unknown as FormSubmission[];
