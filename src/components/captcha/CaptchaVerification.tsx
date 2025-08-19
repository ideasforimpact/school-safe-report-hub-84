
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AltchaWidget from './AltchaWidget';

interface CaptchaVerificationProps {
	onVerificationSuccess: () => void;
	onBack?: () => void;
}

const CaptchaVerification: React.FC<CaptchaVerificationProps> = ({
	onVerificationSuccess,
	onBack
}) => {
	const [token, setToken] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const handleVerified = (tok: string) => {
		setToken(tok);
		toast({ title: 'Verified', description: 'CAPTCHA verified successfully.' });
	};

	const handleProceed = async () => {
		if (!token) {
			toast({ title: 'Verification Required', description: 'Please complete the CAPTCHA verification first.', variant: 'destructive' });
			return;
		}
		setSubmitting(true);
		// No server-side verification here; we only gate the UI
		setTimeout(() => {
			onVerificationSuccess();
		}, 300);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="flex items-center justify-center mb-4">
						<ShieldCheck className="h-12 w-12 text-primary" />
					</div>
					<CardTitle className="text-2xl">Security Verification</CardTitle>
					<p className="text-gray-600">Please complete the verification below to continue</p>
				</CardHeader>
				<CardContent className="space-y-6">
					<AltchaWidget onVerified={handleVerified} theme="auto" />
					<div className="flex items-center justify-between">
						<Button variant="outline" onClick={onBack} className="flex items-center gap-2">
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
						<Button onClick={handleProceed} disabled={!token || submitting}>
							{submitting ? 'Processing...' : 'Proceed'}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default CaptchaVerification;
