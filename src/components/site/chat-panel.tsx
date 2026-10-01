"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The AI assistant conversation.
 *
 * Answers stream in as plain text chunks from /api/chat, so the first words
 * appear while the rest is still being written. History lives in component
 * state only — nothing is persisted, and closing the widget forgets it.
 */

type Message = { role: "user" | "assistant"; content: string };

const OPENING =
  "Hi. I can answer questions about what nlogn builds, what it costs and how a project runs. What would you like to know?";

const SUGGESTIONS = [
  "What do you charge for a website?",
  "What software do you build?",
  "How long does a project take?",
];

export function ChatPanel({ onWhatsApp }: { onWhatsApp: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Keep the newest message in view as it streams.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => abort.current?.abort();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || pending) return;

      setError(null);
      setInput("");
      const next: Message[] = [...messages, { role: "user", content: question }];
      setMessages(next);
      setPending(true);

      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Only the last few turns travel, which keeps the request small.
          body: JSON.stringify({ messages: next.slice(-12) }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "The assistant could not answer that.");
        }
        if (!res.body) throw new Error("The assistant sent nothing back.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        setMessages([...next, { role: "assistant", content: "" }]);

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setMessages([...next, { role: "assistant", content: answer }]);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setMessages(next);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setPending(false);
        inputRef.current?.focus();
      }
    },
    [messages, pending],
  );

  const empty = messages.length === 0;

  return (
    <>
      <div
        ref={scroller}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5"
      >
        <div className="flex gap-3">
          <span
            aria-hidden
            className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-violet-wash text-violet"
          >
            <Sparkles className="size-3.5" strokeWidth={2} />
          </span>
          <p className="min-w-0 text-[0.875rem] leading-relaxed text-ink-soft">{OPENING}</p>
        </div>

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex gap-3", m.role === "user" && "justify-end")}
          >
            {m.role === "assistant" && (
              <span
                aria-hidden
                className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-violet-wash text-violet"
              >
                <Sparkles className="size-3.5" strokeWidth={2} />
              </span>
            )}
            <p
              className={cn(
                "min-w-0 whitespace-pre-wrap text-[0.875rem] leading-relaxed",
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-white"
                  : "text-ink-soft",
              )}
            >
              {m.content}
              {m.role === "assistant" && !m.content && pending && (
                <span className="text-muted">Thinking…</span>
              )}
            </p>
          </div>
        ))}

        {empty && !pending && (
          <ul className="space-y-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => send(s)}
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-left text-[0.8125rem] text-ink-soft transition-colors hover:border-violet/40 hover:text-ink"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-red-700"
          >
            {error}
            <div className="mt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => send(messages[messages.length - 1]?.content ?? "")}
                className="inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
              >
                <RefreshCw className="size-3.5" aria-hidden />
                Try again
              </button>
              <button
                type="button"
                onClick={onWhatsApp}
                className="font-semibold underline-offset-4 hover:underline"
              >
                Use WhatsApp instead
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="shrink-0 border-t border-line p-3"
      >
        <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-line bg-canvas p-2 pl-4 transition-colors focus-within:border-violet/50">
          <label htmlFor="chat-input" className="sr-only">
            Ask the assistant a question
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask something…"
            maxLength={2000}
            className="max-h-28 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[0.875rem] text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={pending || input.trim() === ""}
            aria-label="Send message"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-violet text-white transition-colors hover:bg-violet-deep disabled:opacity-40"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ArrowUp className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </form>
    </>
  );
}
