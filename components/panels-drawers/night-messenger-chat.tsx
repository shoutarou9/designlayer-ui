"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  Mic,
  PhoneMissed,
  Plus,
  Search,
  Settings,
  Smile,
} from "lucide-react";
import { coerceDisplayText } from "@/lib/coerceActionNodes";
import { cn } from "@/lib/utils";

export const NIGHT_MESSENGER_AVATARS = {
  jerimaA: "/dev/testimonial-avatars/testimonial-alex-rodriguez.png",
  jerimaB: "/dev/testimonial-avatars/testimonial-jordan-lee.png",
  jerimaC: "/dev/testimonial-avatars/testimonial-maya-chen.png",
  jerimaD: "/dev/testimonial-avatars/testimonial-sara-williams.png",
  lu: "/dev/testimonial-avatars/testimonial-kenji-tanaka.png",
  muzi: "/dev/testimonial-avatars/testimonial-maya-chen.png",
  jia: "/dev/testimonial-avatars/testimonial-sara-williams.png",
  amy: "/dev/testimonial-avatars/testimonial-jordan-lee.png",
  surf: "/dev/testimonial-avatars/testimonial-alex-rodriguez.png",
  dalonzo: "/dev/testimonial-avatars/testimonial-kenji-tanaka.png",
  frank: "/dev/testimonial-avatars/testimonial-alex-rodriguez.png",
  alice: "/dev/testimonial-avatars/testimonial-maya-chen.png",
  mike: "/dev/testimonial-avatars/testimonial-jordan-lee.png",
  brand: "/dev/testimonial-avatars/testimonial-kenji-tanaka.png",
  jim: "/dev/testimonial-avatars/testimonial-alex-rodriguez.png",
  steven: "/dev/testimonial-avatars/testimonial-sara-williams.png",
  hella: "/dev/testimonial-avatars/testimonial-maya-chen.png",
  me: "/dev/testimonial-avatars/testimonial-jordan-lee.png",
} as const;

export const NIGHT_MESSENGER_CHAT_BG_SRC = "/dev/night-messenger-chat/bg.png";

const UI_FONT =
  'Inter, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, ui-sans-serif, sans-serif';

const ACCENT = "#6e7cff";

export type NightMessengerStory = {
  id: string;
  name: string;
  avatarSrc?: string;
  add?: boolean;
};

export type NightMessengerPreviewKind = "text" | "missed-call" | "voice";

export type NightMessengerThread = {
  id: string;
  name: string;
  preview: string;
  time: string;
  avatarSrc?: string;
  mosaicSrcs?: string[];
  starred?: boolean;
  previewKind?: NightMessengerPreviewKind;
  role?: string;
  email?: string;
  addedNote?: string;
};

export type NightMessengerBubble = {
  id: string;
  from: "them" | "me";
  text: string;
  time?: string;
  read?: boolean;
  /** 時刻行のみ（吹き出しなし） */
  stamp?: boolean;
  /** 不在着信などの通話イベント */
  call?: "missed";
};

export type NightMessengerChatProps = {
  searchPlaceholder?: string;
  starredLabel?: string;
  messageLabel?: string;
  composerPlaceholder?: string;
  addedFriendLabel?: string;
  startChatLabel?: string;
  accentColor?: string;
  stories?: NightMessengerStory[];
  threads?: NightMessengerThread[];
  messagesByThread?: Record<string, NightMessengerBubble[]>;
  activeThreadId?: string;
  unreadStarred?: number;
  unreadMessages?: number;
  className?: string;
  contentClassName?: string;
};

function asPlainString(value: ReactNode, fallback: string): string {
  const text = coerceDisplayText(value);
  if (typeof text === "string" && text.trim()) return text;
  if (typeof text === "number" || typeof text === "bigint") return String(text);
  return fallback;
}

const DEFAULT_STORIES: NightMessengerStory[] = [
  { id: "add", name: "Add", add: true },
  { id: "mike", name: "Mike", avatarSrc: NIGHT_MESSENGER_AVATARS.mike },
  { id: "brand", name: "Brand", avatarSrc: NIGHT_MESSENGER_AVATARS.brand },
  { id: "jim", name: "Jim Katt", avatarSrc: NIGHT_MESSENGER_AVATARS.jim },
  { id: "steven", name: "Steven", avatarSrc: NIGHT_MESSENGER_AVATARS.steven },
  { id: "hella", name: "Hella J", avatarSrc: NIGHT_MESSENGER_AVATARS.hella },
];

const DEFAULT_THREADS: NightMessengerThread[] = [
  {
    id: "jerima",
    name: "DesignLayer.Team",
    preview: "Sure. Please wait a minute.",
    time: "19:45",
    mosaicSrcs: [
      NIGHT_MESSENGER_AVATARS.jerimaA,
      NIGHT_MESSENGER_AVATARS.jerimaB,
      NIGHT_MESSENGER_AVATARS.jerimaC,
      NIGHT_MESSENGER_AVATARS.jerimaD,
    ],
    role: "Business Partner",
    email: "jerima1997@163.com",
    addedNote: "You have added DesignLayer.Team as your friend,",
  },
  {
    id: "lu",
    name: "Nina Torres",
    preview: "The files look great now.",
    time: "Now",
    avatarSrc: NIGHT_MESSENGER_AVATARS.lu,
    starred: true,
  },
  {
    id: "muzi",
    name: "Kaito Mori",
    preview: "Let's sync tomorrow morning.",
    time: "5 mins",
    avatarSrc: NIGHT_MESSENGER_AVATARS.muzi,
    starred: true,
  },
  {
    id: "jia",
    name: "Priya Nair",
    preview: "Can you review the draft?",
    time: "1 hour",
    avatarSrc: NIGHT_MESSENGER_AVATARS.jia,
    starred: true,
  },
  {
    id: "amy",
    name: "Owen Blake",
    preview: "Missed Call",
    time: "10 mins",
    avatarSrc: NIGHT_MESSENGER_AVATARS.amy,
    previewKind: "missed-call",
  },
  {
    id: "surf",
    name: "Hana Sato",
    preview: "Dinner at 8 works for me.",
    time: "10:25am",
    avatarSrc: NIGHT_MESSENGER_AVATARS.surf,
  },
  {
    id: "dalonzo",
    name: "Marco Ruiz",
    preview: "Voice Message",
    time: "8:45am",
    avatarSrc: NIGHT_MESSENGER_AVATARS.dalonzo,
    previewKind: "voice",
  },
  {
    id: "frank",
    name: "Lena Fischer",
    preview: "I'll send the invoice today...",
    time: "Jan 25",
    avatarSrc: NIGHT_MESSENGER_AVATARS.frank,
  },
  {
    id: "alice",
    name: "Theo Adams",
    preview: "Sounds good, see you then.",
    time: "Jan 24",
    avatarSrc: NIGHT_MESSENGER_AVATARS.alice,
  },
];

const DEFAULT_MESSAGES: Record<string, NightMessengerBubble[]> = {
  jerima: [
    { id: "jt0", from: "them", text: "", time: "Sat 10:25", stamp: true },
    { id: "j1", from: "them", text: "Hey! Welcome to DesignLayer." },
    { id: "j2", from: "them", text: "Have you seen the new components?" },
    { id: "j3", from: "me", text: "Yes, they look great!" },
    { id: "jt1", from: "them", text: "", time: "19:45", stamp: true },
    { id: "j4", from: "them", text: "One more thing..." },
    { id: "j5", from: "them", text: "Can you review the latest build?" },
    { id: "j6", from: "me", text: "Sure. Please wait a minute.", read: true },
  ],
  lu: [
    { id: "l1", from: "me", text: "Hey Nina, did you get the files?" },
    { id: "l2", from: "them", text: "The files look great now." },
  ],
  muzi: [{ id: "m1", from: "them", text: "Let's sync tomorrow morning." }],
  jia: [{ id: "h1", from: "them", text: "Can you review the draft?" }],
  amy: [
    { id: "c1", from: "them", text: "Missed Call", time: "10 mins ago", call: "missed" },
  ],
  surf: [{ id: "s1", from: "them", text: "Dinner at 8 works for me." }],
  dalonzo: [],
  frank: [
    { id: "f1", from: "them", text: "I'll send the invoice today." },
  ],
  alice: [{ id: "a1", from: "them", text: "Sounds good, see you then." }],
};

function WindowControls() {
  return (
    <div className="flex shrink-0 items-center gap-[7px]" role="group" aria-label="Window">
      <button
        type="button"
        className="group flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-[#ff5f57] text-black/70 transition hover:brightness-110"
        aria-label="Close"
      >
        <svg viewBox="0 0 8 8" className="h-1.5 w-1.5 opacity-0 group-hover:opacity-100" aria-hidden>
          <path d="M1.5 1.5 6.5 6.5M6.5 1.5 1.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        className="group flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-[#febc2e] text-black/70 transition hover:brightness-110"
        aria-label="Minimize"
      >
        <svg viewBox="0 0 8 8" className="h-1.5 w-1.5 opacity-0 group-hover:opacity-100" aria-hidden>
          <path d="M1.5 4h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        className="group flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-[#28c840] text-black/70 transition hover:brightness-110"
        aria-label="Maximize"
      >
        <svg viewBox="0 0 8 8" className="h-1.5 w-1.5 opacity-0 group-hover:opacity-100" aria-hidden>
          <path d="M2 5.2 4 2.8 6 5.2M2 2.8h4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function Face({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white/80",
          className,
        )}
      >
        {alt.slice(0, 1)}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex overflow-hidden rounded-full bg-white/10", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="block h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}

function MosaicAvatar({ srcs, className }: { srcs: string[]; className?: string }) {
  const cells = srcs.slice(0, 4);
  return (
    <span
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-full bg-[#2a3140]",
        className,
      )}
    >
      {cells.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ))}
    </span>
  );
}

/**
 * 夜の山並み壁紙の上に浮かぶデスクトップ・メッセンジャー。
 * 左レール、スター付きスレッド、吹き出し、入力バー。
 */
export function NightMessengerChat({
  searchPlaceholder = "Search",
  starredLabel = "Starred",
  messageLabel = "Message",
  composerPlaceholder = "Text message",
  addedFriendLabel = "You have added DesignLayer.Team as your friend,",
  startChatLabel = "Start chatting now!",
  accentColor = ACCENT,
  stories = DEFAULT_STORIES,
  threads = DEFAULT_THREADS,
  messagesByThread = DEFAULT_MESSAGES,
  activeThreadId = "jerima",
  unreadStarred = 2,
  unreadMessages = 3,
  className,
  contentClassName,
}: NightMessengerChatProps) {
  const accent = asPlainString(accentColor, ACCENT);
  const searchText = asPlainString(searchPlaceholder, "Search");
  const starredText = asPlainString(starredLabel, "Starred");
  const messageText = asPlainString(messageLabel, "Message");
  const composerText = asPlainString(composerPlaceholder, "Text message");
  const addedLead = asPlainString(addedFriendLabel, DEFAULT_THREADS[0]!.addedNote ?? "");
  const startText = asPlainString(startChatLabel, "Start chatting now!");

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(activeThreadId);
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<Record<string, NightMessengerBubble[]>>({});
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("chat");
  const [typing, setTyping] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((thread) => {
      if (!q) return true;
      return (
        thread.name.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q)
      );
    });
  }, [query, threads]);

  const starred = filtered.filter((thread) => thread.starred);
  const inbox = filtered.filter((thread) => !thread.starred);
  const active = threads.find((thread) => thread.id === activeId) ?? threads[0];
  const threadMessages = [
    ...(messagesByThread[active?.id ?? ""] ?? []),
    ...(extra[active?.id ?? ""] ?? []),
  ];

  const draftActive = draft.trim().length > 0;

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [active?.id, extra, typing, draftActive]);

  useEffect(() => {
    setTyping(false);
    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
  }, [activeId]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    };
  }, []);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !active) return;
    const bubble: NightMessengerBubble = {
      id: `local-${Date.now()}`,
      from: "me",
      text,
      read: true,
    };
    setExtra((prev) => ({
      ...prev,
      [active.id]: [...(prev[active.id] ?? []), bubble],
    }));
    setDraft("");

    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    setTyping(true);
    const threadId = active.id;
    replyTimerRef.current = setTimeout(() => {
      setExtra((prev) => ({
        ...prev,
        [threadId]: [
          ...(prev[threadId] ?? []),
          { id: `reply-${Date.now()}`, from: "them", text: "Got it, thanks!" },
        ],
      }));
      setTyping(false);
      replyTimerRef.current = null;
    }, 1800);
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    sendMessage();
  };

  const openThread = (id: string) => {
    setActiveId(id);
    setMobilePane("chat");
  };

  return (
    <div
      className={cn(
        "relative flex h-[min(740px,88vh)] w-[min(1100px,92vw)] overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#12161d] text-[#eceef4] shadow-[0_40px_90px_rgba(0,0,0,0.45)]",
        className,
      )}
      style={
        {
          "--nm-accent": accent,
          fontFamily: UI_FONT,
        } as CSSProperties
      }
    >
      <section
        className={cn(
          "w-full shrink-0 flex-col border-r border-white/[0.06] bg-[#161b23] md:w-[320px]",
          mobilePane === "list" ? "flex" : "hidden md:flex",
        )}
      >
        <div className="flex h-[52px] shrink-0 items-center gap-2.5 px-3">
          <WindowControls />
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{searchText}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchText}
              className="h-8 w-full rounded-full border-0 bg-[#222833] pl-9 pr-3 text-[12px] text-white/90 outline-none placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-[var(--nm-accent)]"
            />
          </label>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#222833] text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto px-3 pb-2 pt-2 [scrollbar-width:none]">
          {stories.map((story) => (
            <div key={story.id} className="flex w-[52px] shrink-0 flex-col items-center gap-1.5">
              {story.add ? (
                <button
                  type="button"
                  className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border border-dashed border-white/25 text-white/55 transition hover:border-white/50 hover:text-white"
                  aria-label={story.name}
                >
                  <Plus className="h-4 w-4" />
                </button>
              ) : (
                <span className="inline-flex shrink-0 rounded-full p-[2px] ring-2 ring-[#3b6dff]">
                  <Face src={story.avatarSrc} alt={story.name} className="h-[42px] w-[42px]" />
                </span>
              )}
              <span className="w-full truncate text-center text-[10px] text-white/55">
                {story.name}
              </span>
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-3">
          <SectionHead
            label={starredText}
            meta={`${unreadStarred} unread messages`}
          />
          {starred.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              active={thread.id === activeId}
              onSelect={() => openThread(thread.id)}
            />
          ))}
          <SectionHead
            label={messageText}
            meta={`${unreadMessages} unread messages`}
            className="mt-1"
          />
          {inbox.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              active={thread.id === activeId}
              onSelect={() => openThread(thread.id)}
            />
          ))}
        </div>

        <div className="flex h-[52px] shrink-0 items-center justify-between border-t border-white/[0.06] px-4">
          <div className="flex items-center gap-2.5">
            <Face
              src={NIGHT_MESSENGER_AVATARS.me}
              alt="You"
              className="h-8 w-8 ring-2 ring-[#3b82f6]/80"
            />
            <span className="text-[12px] font-medium">DesignLayer</span>
          </div>
          <button
            type="button"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-white/45 transition hover:bg-white/8 hover:text-white"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section
        className={cn(
          "min-w-0 flex-1 flex-col bg-[#12161d]",
          mobilePane === "chat" ? "flex" : "hidden md:flex",
          contentClassName,
        )}
      >
        <header className="flex h-[52px] shrink-0 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              className="mr-1 cursor-pointer text-white/50 md:hidden"
              onClick={() => setMobilePane("list")}
            >
              Back
            </button>
            {active?.mosaicSrcs ? (
              <MosaicAvatar srcs={active.mosaicSrcs} className="h-8 w-8" />
            ) : (
              <Face src={active?.avatarSrc} alt={active?.name ?? ""} className="h-8 w-8" />
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{active?.name}</p>
              <p className="truncate text-[11px] text-white/40">{active?.role ?? "Online"}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-white/45 transition hover:bg-white/8 hover:text-white"
            aria-label="Conversation menu"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </header>

        <div
          ref={scrollerRef}
          className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-5"
        >
          {active?.id === "jerima" ? (
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="relative">
                {active.mosaicSrcs ? (
                  <MosaicAvatar srcs={active.mosaicSrcs} className="h-[78px] w-[78px]" />
                ) : null}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#f5c542]">
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                    <path
                      fill="#1b1408"
                      d="M6 1.1 7.2 4.3 10.6 4.6 8 6.9 8.8 10.3 6 8.5 3.2 10.3 4 6.9 1.4 4.6 4.8 4.3Z"
                    />
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-[15px] font-medium">{active.name}</p>
              <p className="mt-3 max-w-[240px] text-[11px] leading-relaxed text-white/35">
                {active.addedNote ?? addedLead}
                <br />
                {startText}
              </p>
            </div>
          ) : null}

          <MessageStream messages={threadMessages} />
          {typing ? <TypingIndicator /> : null}
          {draft.trim() ? <TypingIndicator mine /> : null}
        </div>

        <form
          onSubmit={send}
          className="flex shrink-0 items-center gap-2 px-4 pb-4 pt-1"
        >
          <div className="flex h-10 flex-1 items-center rounded-full bg-[#1c222c] pr-1.5">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={composerText}
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-[13px] text-white/90 outline-none placeholder:text-white/30"
            />
            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/40 transition hover:text-white"
              aria-label="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#1c222c] text-white/50 transition hover:text-white"
            aria-label="Attach"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#1c222c] text-white/50 transition hover:text-white"
            aria-label="Voice message"
          >
            <Mic className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}

function SectionHead({
  label,
  meta,
  className,
}: {
  label: string;
  meta: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between px-3 pb-1 pt-3", className)}>
      <p className="text-[13px] font-semibold">{label}</p>
      <p className="text-[10px] text-[#6e8cff]">{meta}</p>
    </div>
  );
}

function ThreadRow({
  thread,
  active,
  onSelect,
}: {
  thread: NightMessengerThread;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition duration-150",
        active ? "bg-white/[0.04]" : "hover:bg-white/[0.035]",
      )}
    >
      {thread.mosaicSrcs ? (
        <MosaicAvatar srcs={thread.mosaicSrcs} className="h-9 w-9 shrink-0" />
      ) : (
        <Face src={thread.avatarSrc} alt={thread.name} className="h-9 w-9 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-medium">{thread.name}</span>
          <span className="shrink-0 text-[10px] text-white/30">{thread.time}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/38">
          {thread.previewKind === "missed-call" ? (
            <PhoneMissed className="h-3 w-3 text-[#7ea0ff]" />
          ) : null}
          {thread.previewKind === "voice" ? (
            <Mic className="h-3 w-3 text-[#7ea0ff]" />
          ) : null}
          <span className="truncate">{thread.preview}</span>
        </span>
      </span>
    </button>
  );
}

function TypingIndicator({ mine = false }: { mine?: boolean }) {
  return (
    <div
      className={cn("mt-3 flex", mine ? "justify-end" : "justify-start")}
      role="status"
      aria-label="Typing"
    >
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-[16px] px-4 py-3",
          mine
            ? "rounded-br-[6px] bg-[var(--nm-accent)]"
            : "rounded-bl-[6px] bg-[#2a3140]",
        )}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 animate-bounce rounded-full",
              mine ? "bg-white/85" : "bg-white/60",
            )}
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageStream({ messages }: { messages: NightMessengerBubble[] }) {
  return (
    <div className="flex w-full flex-col">
      {messages.map((bubble, index) => {
        if (bubble.stamp && bubble.time) {
          return (
            <p
              key={bubble.id}
              className="mb-4 mt-1 text-center text-[11px] text-white/28"
            >
              {bubble.time}
            </p>
          );
        }
        if (bubble.call === "missed") {
          return (
            <div key={bubble.id} className="mt-3 flex justify-start">
              <div className="flex items-center gap-2 rounded-[16px] rounded-bl-[6px] bg-[#2a3140] px-3.5 py-2 text-[13px] text-white/92">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff5f57]/15">
                  <PhoneMissed className="h-3.5 w-3.5 text-[#ff7a72]" />
                </span>
                <span>{bubble.text}</span>
                {bubble.time ? (
                  <span className="text-[10px] text-white/35">{bubble.time}</span>
                ) : null}
              </div>
            </div>
          );
        }
        const mine = bubble.from === "me";
        const prev = messages[index - 1];
        const grouped =
          prev &&
          !prev.stamp &&
          prev.from === bubble.from;
        return (
          <div key={bubble.id} className={grouped ? "mt-1.5" : "mt-3"}>
            <div className={cn("flex items-end gap-1.5", mine ? "justify-end" : "justify-start")}>
              {mine && bubble.read ? (
                <Check className="mb-1 h-3.5 w-3.5 shrink-0 text-[#6ea0ff]" aria-label="Read" />
              ) : null}
              <div
                className={cn(
                  "max-w-[72%] rounded-[16px] px-3.5 py-2 text-[13px] leading-relaxed",
                  mine
                    ? "rounded-br-[6px] bg-[var(--nm-accent)] text-white"
                    : "rounded-bl-[6px] bg-[#2a3140] text-white/92",
                )}
              >
                {bubble.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 夜の山並みを1画面いっぱいに敷くステージ */
export function NightMessengerChatStage({
  children,
  className,
  backgroundSrc = NIGHT_MESSENGER_CHAT_BG_SRC,
}: {
  children?: ReactNode;
  className?: string;
  backgroundSrc?: string;
}) {
  const src = asPlainString(backgroundSrc, NIGHT_MESSENGER_CHAT_BG_SRC);

  return (
    <div
      data-tsuna-id="night-messenger-chat"
      className={cn(
        "relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#0a1220]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <div className="relative z-10 flex w-full items-center justify-center px-5 py-10 sm:px-8">
        {children ?? <NightMessengerChat />}
      </div>
    </div>
  );
}
