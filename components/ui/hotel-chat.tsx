"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X, RotateCcw, LoaderCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { brand } from "@/lib/brand";

type Message = { role: "user" | "assistant"; text: string };
const welcome: Message = { role: "assistant", text: "Welcome to Nafiis. I’m your AI hotel assistant. Ask me about the hotel, how to book, or how payment review works." };

export function HotelChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const launcher = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLDivElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const pending = useRef(false);

  useEffect(() => { if (open && !busy) input.current?.querySelector("input")?.focus(); }, [open, busy]);
  useEffect(() => {
    if (transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, busy, error, open]);

  function close() { setOpen(false); launcher.current?.querySelector("button")?.focus(); }

  async function send(text: string) {
    text = text.trim();
    if (!text || pending.current) return;
    pending.current = true;
    setBusy(true); setError(""); setDraft("");
    setMessages(previous => [...previous, { role: "user", text }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }), signal: AbortSignal.timeout(95_000),
      });
      const data = await response.json();
      if (!response.ok || typeof data.reply !== "string") throw new Error(data.error || "The assistant is unavailable. Please try again or contact reception.");
      setMessages(previous => [...previous, { role: "assistant", text: data.reply }]);
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The assistant took too long. Please try again or contact reception.");
      setDraft(text);
    } finally {
      pending.current = false; setBusy(false);
      input.current?.querySelector("input")?.focus();
    }
  }

  async function newChat() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/chat", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not start a new chat. Please try again.");
      setMessages([welcome]); setDraft("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again."); }
    finally { pending.current = false; setBusy(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void send(draft); }

  if (/^\/(admin|reception|restaurant|components)(\/|$)/.test(pathname)) return null;

  return (
    <div className="fixed right-3 bottom-4 z-40 sm:right-6 sm:bottom-6">
      {open && (
        <section id="hotel-chat" role="dialog" aria-label="Ask Nafiis hotel assistant" aria-modal="false"
          onKeyDown={event => { if (event.key === "Escape") close(); }}
          className="mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
          <header className="flex items-center justify-between gap-2 bg-brand px-4 py-3 text-white">
            <div><h2 className="font-semibold">Ask Nafiis</h2><p className="text-xs text-white/80">AI hotel assistant</p></div>
            <div className="flex gap-1">
              <Button variant="ghost-light" size="sm" aria-label="Start a new chat" title="Start a new chat" disabled={busy} onClick={() => void newChat()} className="px-2"><RotateCcw aria-hidden /></Button>
              <Button variant="ghost-light" size="sm" aria-label="Close hotel assistant" onClick={close} className="px-2"><X aria-hidden /></Button>
            </div>
          </header>
          <div ref={transcript} role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 text-sm leading-6">
            {messages.map((message, index) => <div key={index} className={`w-fit max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 ${message.role === "user" ? "ml-auto bg-brand text-white" : "bg-background text-foreground"}`}><span className="sr-only">{message.role === "user" ? "You: " : "Assistant: "}</span>{message.text}</div>)}
            {busy && <p role="status" className="flex items-center gap-2 text-muted"><LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />Finding an answer…</p>}
          </div>
          {messages.length === 1 && <div className="flex flex-wrap gap-2 px-4 pb-3">{["Room prices", "Restaurant menu", "How do I book?"].map(question => <Button key={question} size="sm" variant="secondary" disabled={busy} onClick={() => void send(question)} className="text-xs">{question}</Button>)}</div>}
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
            <ButtonLink href="/#book" size="sm" variant="ghost" onClick={close}>Book a room</ButtonLink>
            <a href={`tel:${brand.contact.phoneHref}`} className="self-center rounded-full px-2 text-xs font-medium text-brand underline underline-offset-4">Call reception</a>
          </div>
          <form onSubmit={submit} className="border-t border-border p-3">
            {error && <p role="alert" className="mb-2 text-xs text-danger">{error}</p>}
            <div ref={input} className="flex items-end gap-2">
              <div className="min-w-0 flex-1"><Field label="Your question" name="hotel-question" icon={MessageCircle} placeholder="Ask about your stay…" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1000} autoComplete="off" disabled={busy} /></div>
              <Button type="submit" aria-label="Send question" disabled={busy || !draft.trim()} className="px-3"><Send aria-hidden /></Button>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-muted">AI answers may be inaccurate. Reception confirms prices and availability. Don’t share payment details, passwords or wallet keys.</p>
          </form>
        </section>
      )}
      <div ref={launcher} className="flex justify-end"><Button aria-expanded={open} aria-controls="hotel-chat" onClick={() => setOpen(!open)} className="shadow-lg"><MessageCircle aria-hidden />Ask Nafiis</Button></div>
    </div>
  );
}
