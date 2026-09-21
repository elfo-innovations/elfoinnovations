import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Paperclip, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string; // local preview URL, shown in the bubble only
  image?: { data: string; mimeType: string }; // base64 payload sent to the backend
};

const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I'm Elsa, the ELFO Innovations assistant. Ask me about our services, pricing, or how to get started. 👋",
};

function getSessionId(): string {
  const key = "elfo_chat_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// Reads a File and returns { data: base64WithoutPrefix, mimeType }
function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve({ data: base64, mimeType: file.type || "image/png" });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function SiteChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ preview: string; data: string; mimeType: string } | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionId = useRef<string | undefined>(undefined);
  const recognitionRef = useRef<any>(null);
  const voiceModeRef = useRef(false); // mirrors voiceMode so the speech-recognition callback always reads the latest value

  useEffect(() => {
    sessionId.current = getSessionId();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Cache available system voices once they load (they load async in most browsers)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Roman Urdu / Hinglish has no unique script — detect it by common romanized words,
  // so we can switch to a Hindi voice (reads romanized Urdu/Hindi far more accurately
  // than an English voice, which mangles the pronunciation).
  const looksHinglish = (text: string) => {
    const hinglishWords = /\b(hai|hain|nahi|nhi|kya|kaise|kyun|kyu|mein|main|aap|tum|kar|raha|rahi|rahe|ho|hoon|hun|acha|theek|zyada|bhai|yaar|matlab|bata|batao|kahan|kab|kyunki|liye|lena|dena|karo|karna|krna)\b/i;
    return hinglishWords.test(text);
  };

  const pickVoice = (text: string): { voice?: SpeechSynthesisVoice; lang: string } => {
    const voices = voicesRef.current;
    const preferHindi = looksHinglish(text);
    const targetLang = preferHindi ? "hi" : "en";
    const inLang = voices.filter((v) => v.lang.toLowerCase().startsWith(targetLang));
    const pool = inLang.length ? inLang : voices;
    // Most TTS engines expose a "female" hint in the voice name; fall back to the first match
    const female = pool.find((v) => /female/i.test(v.name)) ?? pool[0];
    return { voice: female, lang: preferHindi ? "hi-IN" : "en-US" };
  };

  // Speak text aloud using the browser's built-in text-to-speech
  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // stop anything currently being spoken
    const utterance = new SpeechSynthesisUtterance(text);
    const { voice, lang } = pickVoice(text);
    utterance.lang = lang;
    if (voice) utterance.voice = voice;
    utterance.pitch = 1.1; // slightly higher pitch reinforces a feminine voice when no explicit female voice is found
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceMode = () => {
    setVoiceMode((v) => {
      const next = !v;
      voiceModeRef.current = next;
      if (!next) window.speechSynthesis?.cancel(); // turning off mid-speech stops it immediately
      return next;
    });
  };

  // Set up browser speech-to-text (Web Speech API) once, if the browser supports it
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "hi-IN"; // Hindi recognition handles Hinglish/code-switched speech far better than en-US

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (voiceModeRef.current) {
        // Hands-free: send immediately instead of just filling the text box
        sendMessageRef.current(transcript);
      } else {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return; // browser doesn't support speech recognition
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { data, mimeType } = await fileToBase64(file);
    setPendingImage({ preview: URL.createObjectURL(file), data, mimeType });
    e.target.value = ""; // allow picking the same file again later
  };

  const logMessage = async (msg: Msg) => {
    try {
      await supabase.from("site_chat_logs").insert({
        session_id: sessionId.current ?? getSessionId(),
        role: msg.role,
        content: msg.content,
      });
    } catch {
      /* logging failures shouldn't break the chat experience */
    }
  };

  // sendMessageRef lets the speech-recognition callback (set up once on mount) always
  // call the latest version of sendMessage, without stale-closure issues.
  const sendMessageRef = useRef<(overrideText?: string) => void>(() => {});

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if ((!text && !pendingImage) || loading) return;

    const userMsg: Msg = {
      role: "user",
      content: text,
      imagePreview: pendingImage?.preview,
      image: pendingImage ? { data: pendingImage.data, mimeType: pendingImage.mimeType } : undefined,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingImage(null);
    setLoading(true);
    logMessage(userMsg);

    try {
      // Don't resend old image previews/base64 to the API — only the new message needs it
      const apiMessages = next.map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image,
      }));
      const { data, error } = await supabase.functions.invoke("site-chat", {
        body: { messages: apiMessages },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const assistantMsg: Msg = { role: "assistant", content: data.reply };
      setMessages((m) => [...m, assistantMsg]);
      logMessage(assistantMsg);
      if (voiceModeRef.current) speak(data.reply);
    } catch {
      const errMsg = "Sorry, something went wrong. Please try again in a moment.";
      setMessages((m) => [...m, { role: "assistant", content: errMsg }]);
      if (voiceModeRef.current) speak(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  const send = () => sendMessage();

  return (
    <>
      {/* Floating toggle button — pill-shaped with label + online indicator, matches when open/closed */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_-10px_rgba(59,130,246,0.8)] transition hover:scale-105 active:scale-95 ${
          open ? "h-14 w-14 justify-center" : "px-5 py-3.5"
        }`}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-emerald-400" />
            </span>
            <span className="text-sm font-semibold">Chat with Elsa</span>
          </>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[70vh] max-h-[560px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:w-96">
          <div className="flex items-center gap-2 border-b bg-[#0a1128] px-4 py-3 text-white">
            <img src="/elfo-logo-dark.png" alt="ELFO Innovations" className="h-9 w-9 shrink-0 object-contain" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Elsa</div>
              <div className="text-[11px] text-white/60">Ask us anything</div>
            </div>
            <button
              onClick={toggleVoiceMode}
              aria-label={voiceMode ? "Turn off voice mode" : "Turn on voice mode"}
              title={voiceMode ? "Voice mode on — replies are spoken aloud" : "Turn on voice mode"}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10 ${
                voiceMode ? "text-primary" : "text-white/60"
              }`}
            >
              {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  {m.imagePreview && (
                    <img src={m.imagePreview} alt="Attachment" className="mb-1.5 max-h-40 rounded-lg object-cover" />
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Typing…
                </div>
              </div>
            )}
          </div>

          {pendingImage && (
            <div className="flex items-center gap-2 border-t px-3 pt-2">
              <img src={pendingImage.preview} alt="Selected" className="h-12 w-12 rounded-lg object-cover" />
              <button
                onClick={() => setPendingImage(null)}
                className="text-xs text-muted-foreground underline"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 border-t p-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach image"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              onClick={toggleMic}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted ${
                listening ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || (!input.trim() && !pendingImage)}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}