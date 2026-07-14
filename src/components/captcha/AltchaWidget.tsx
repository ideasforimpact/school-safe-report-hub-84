import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'

// Importing altcha package will introduce a new element <altcha-widget>
import 'altcha'

interface AltchaProps {
	onStateChange?: (ev: AltchaStateChangeEvent) => void
	// Optional props to configure
	challengeurl?: string
	test?: boolean
	className?: string
}

declare module 'react' {
	// eslint-disable-next-line @typescript-eslint/no-namespace -- module augmentation requires the namespace keyword, no ES module form exists
	namespace JSX {
		interface IntrinsicElements {
			'altcha-widget': AltchaWidgetReact & { class?: string }
		}
	}
}

const AltchaWidget = forwardRef<{ value: string | null }, AltchaProps>(({ onStateChange, challengeurl, test = true, className }, ref) => {
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
		const handleStateChange = (ev: Event) => {
			if ('detail' in ev) {
				// payload contains the base64 solution
				// when state becomes verified
				const stateChangeEvent = ev as AltchaStateChangeEvent
				setValue(stateChangeEvent.detail?.payload || null)
				onStateChange?.(stateChangeEvent)
			}
		}

		const { current } = widgetRef
		if (current) {
			current.addEventListener('statechange', handleStateChange)
			return () => current.removeEventListener('statechange', handleStateChange)
		}
	}, [onStateChange])

	return (
		// Configure challengeurl in production and remove test
		<altcha-widget
			ref={widgetRef as React.RefObject<HTMLElement>}
			class={className}
			style={{ '--altcha-max-width': '100%' }}
			{...(challengeurl ? { challengeurl } : {})}
			{...(test ? { test: true, debug: true } : {})}
		></altcha-widget>
	)
})

export default AltchaWidget
