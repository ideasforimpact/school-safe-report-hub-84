import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

// Importing altcha package will introduce a new element <altcha-widget>
import 'altcha'

interface AltchaProps {
	onStateChange?: (ev: Event | CustomEvent) => void
	// Optional props to configure
	challengeurl?: string
	test?: boolean
	className?: string
	// New: emit solved token to parent
	onVerified?: (token: string | null) => void
}

const AltchaWidget = forwardRef<{ value: string | null }, AltchaProps>(({ onStateChange, challengeurl, test = true, className, onVerified }, ref) => {
	const widgetRef = useRef<HTMLElement>(null)
	const [value, setValue] = useState<string | null>(null)

	useImperativeHandle(ref, () => {
		return {
			get value() {
				return value
			}
		}
	}, [value])

	useEffect(() => {
		const handleStateChange = (ev: Event | CustomEvent) => {
			if ('detail' in ev) {
				// payload contains the base64 solution when state becomes verified
				// @ts-ignore
				const payload = ev.detail?.payload || null
				setValue(payload)
				onStateChange?.(ev)
				// Notify parent directly
				onVerified?.(payload)
			}
		}

		const { current } = widgetRef
		if (current) {
			current.addEventListener('statechange', handleStateChange as any)
			return () => current.removeEventListener('statechange', handleStateChange as any)
		}
	}, [onStateChange, onVerified])

	return (
		// Configure challengeurl in production and remove test
		// eslint-disable-next-line react/no-unknown-property
		<altcha-widget
			ref={widgetRef as any}
			style={{ '--altcha-max-width': '100%' } as any}
			{...(challengeurl ? { challengeurl } : {})}
			{...(test ? { test: true, debug: true } : {})}
		></altcha-widget>
	)
})

export { AltchaWidget };
export default AltchaWidget

// Allow TSX to accept the web component tag
declare global {
	namespace JSX {
		interface IntrinsicElements {
			'altcha-widget': any
		}
	}
} 