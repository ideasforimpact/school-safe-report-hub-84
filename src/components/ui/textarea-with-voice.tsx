import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    : null;

export interface TextareaWithVoiceProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextareaWithVoice = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithVoiceProps
>(({ className, name, value = "", onChange, maxLength, ...props }, ref) => {
  const [listening, setListening] = React.useState(false);
  const [supported, setSupported] = React.useState(false);
  const [interimTranscript, setInterimTranscript] = React.useState("");

  const recognitionRef =
    React.useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(
      null
    );

  const valueRef = React.useRef(value);
  valueRef.current = value;

  React.useEffect(() => {
    setSupported(!!SpeechRecognition);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = React.useCallback(() => {
    if (!SpeechRecognition || !onChange) return;

    try {
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let newFinal = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript.trim();

          if (result.isFinal) {
            newFinal += transcript + " ";
          } else {
            interim += transcript + " ";
          }
        }

        // append finalized speech only once
        if (newFinal.trim()) {
          const current =
            typeof valueRef.current === "string" ? valueRef.current : "";

          const next = (current + " " + newFinal).trim();

          const capped = maxLength
            ? next.slice(0, Number(maxLength))
            : next;

          onChange({
            target: { name: name ?? "description", value: capped },
          } as React.ChangeEvent<HTMLTextAreaElement>);
        }

        // interim should always be fresh preview
        setInterimTranscript(interim.trim());
      };

      recognition.onend = () => {
        setListening(false);
        setInterimTranscript("");
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
        }
        setListening(false);
        setInterimTranscript("");
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (err) {
      console.error(err);
      setListening(false);
    }
  }, [onChange, name, maxLength]);

  const stopListening = React.useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const handleMicClick = () => {
    if (listening) stopListening();
    else startListening();
  };

  const committed = typeof value === "string" ? value : "";

  const displayValue = React.useMemo(() => {
    const combined = interimTranscript
      ? (committed + " " + interimTranscript).trim()
      : committed;

    return maxLength ? combined.slice(0, Number(maxLength)) : combined;
  }, [committed, interimTranscript, maxLength]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInterimTranscript("");
      onChange?.(e);
    },
    [onChange]
  );

  return (
    <div className="relative space-y-1">
      {listening && (
        <p className="text-xs text-gray-500">
          Listening… {interimTranscript ? "(speech detected)" : "speak now"}
        </p>
      )}

      <Textarea
        ref={ref}
        name={name}
        value={displayValue}
        onChange={handleChange}
        maxLength={maxLength}
        className={cn("pr-10 pb-9", className)}
        {...props}
      />

      {supported && (
        <button
          type="button"
          onClick={handleMicClick}
          disabled={props.disabled}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          className={cn(
            "absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition",
            listening
              ? "text-red-600 border-red-200 bg-red-50"
              : "text-gray-600 hover:text-blue-600",
            props.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {listening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
});

TextareaWithVoice.displayName = "TextareaWithVoice";

export { TextareaWithVoice };