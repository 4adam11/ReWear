import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { format, isToday, isYesterday } from "date-fns";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";

import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { cardImage, PLACEHOLDER_IMAGE } from "../utils/image";
import { money } from "../utils/format";
import usePageTitle from "../hooks/usePageTitle";

// How often an open chat and the chat list check for new messages
const THREAD_POLL_MS = 4000;
const LIST_POLL_MS = 20000;

const dayLabel = (d) => (isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "d MMM yyyy"));
const listTime = (d) => (isToday(d) ? format(d, "HH:mm") : isYesterday(d) ? "Yesterday" : format(d, "d MMM"));
const priceOf = (c) => (c.price > 0 ? money(c.price) : c.rent > 0 ? `${money(c.rent)}/day` : "");

// LEFT: every chat, newest first
const ChatList = ({ chats, activeId }) => {
  if (!chats) return <div className="h-40 m-4 bg-cream animate-pulse" />;

  if (chats.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <MessageCircle size={28} className="mx-auto text-muted" />
        <p className="mt-3 font-semibold">No messages yet</p>
        <p className="mt-1 text-sm text-muted">Use “Ask the seller a question” on any item to start a chat.</p>
        <Link to="/explore" className="btn btn-dark btn-sm mt-4">
          Browse items
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#efe6da]">
      {chats.map((c) => (
        <li key={c._id}>
          <Link
            to={`/messages/${c._id}`}
            aria-current={c._id === activeId ? "page" : undefined}
            className={`flex gap-3 px-4 py-3 ${c._id === activeId ? "bg-cream" : "hover:bg-cream"}`}
          >
            <img src={cardImage(c.productImage, 100) || PLACEHOLDER_IMAGE} alt="" className="w-11 h-14 object-cover bg-cream flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`truncate text-sm ${c.unread ? "font-bold" : "font-semibold"}`}>{c.other.name}</span>
                <span className="flex-shrink-0 text-[11px] text-muted">{listTime(new Date(c.lastAt))}</span>
              </div>
              <p className="truncate text-xs text-muted">{c.productTitle}</p>
              <div className="flex items-center gap-2">
                <p className={`flex-1 truncate text-[13px] ${c.unread ? "font-semibold text-ink" : "text-muted"}`}>
                  {c.lastMine ? "You: " : ""}
                  {c.lastMessage}
                </p>
                {c.unread > 0 && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
                    {c.unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
};

// RIGHT: one conversation (or a new one about `draft.product`)
const Thread = ({ chatId, draft, onSent }) => {
  const navigate = useNavigate();
  const { user, authHeader } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef();
  const lastAt = useRef(null);

  // Load the chat, then keep checking for new messages while it is open
  useEffect(() => {
    if (!chatId) return;

    let stop = false;

    const load = async (first) => {
      try {
        const { data } = await axios.get(`${API}/chats/${chatId}/messages`, {
          ...authHeader,
          params: !first && lastAt.current ? { after: lastAt.current } : undefined,
        });
        if (stop) return;

        setChat(data.conversation);
        if (first) {
          setMessages(data.messages);
        } else if (data.messages.length) {
          // Skip anything already shown (e.g. the message just sent from here)
          setMessages((prev) => [...prev, ...data.messages.filter((m) => !prev.some((p) => p._id === m._id))]);
        }
        if (data.messages.length) lastAt.current = data.messages.at(-1).createdAt;
        if (first || data.messages.length) onSent?.();
      } catch (err) {
        if (!stop && first) setError(err.response?.data?.message || "Could not load this chat");
      }
    };

    load(true);
    const timer = setInterval(() => {
      // No point asking while the tab is in the background
      if (!document.hidden) load(false);
    }, THREAD_POLL_MS);

    return () => {
      stop = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError("");

    try {
      if (chatId) {
        const { data } = await axios.post(`${API}/chats/${chatId}/messages`, { body }, authHeader);
        setMessages((prev) => (prev.some((m) => m._id === data._id) ? prev : [...prev, data]));
        lastAt.current = data.createdAt;
        setText("");
        onSent?.();
      } else {
        // First message about this listing: creates the chat, then opens it
        const { data } = await axios.post(`${API}/chats`, { productId: draft.product._id, body }, authHeader);
        onSent?.();
        navigate(`/messages/${data.conversation}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Message not sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const head = chat
    ? { name: chat.other.name, product: chat.product, title: chat.productTitle, image: chat.productImage, price: priceOf(chat), status: chat.productStatus, role: chat.role }
    : draft
      ? { name: draft.seller.name, product: draft.product._id, title: draft.product.title, image: draft.product.image, price: priceOf(draft.product), status: draft.product.status, role: "buyer" }
      : null;

  if (!head) {
    return error ? (
      <p role="alert" className="m-6 text-sm text-red-700">{error}</p>
    ) : (
      <div className="h-40 m-4 bg-cream animate-pulse" />
    );
  }

  // Group messages under a date line
  const groups = [];
  messages.forEach((m) => {
    const label = dayLabel(new Date(m.createdAt));
    if (groups.at(-1)?.label !== label) groups.push({ label, items: [] });
    groups.at(-1).items.push(m);
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* WHO AND WHAT THIS CHAT IS ABOUT */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <Link to="/messages" aria-label="Back to all messages" className="md:hidden w-9 h-9 -ml-2 flex items-center justify-center text-ink">
          <ArrowLeft size={20} />
        </Link>
        <Link to={head.status === "removed" ? "/messages" : `/product/${head.product}`} className="flex-shrink-0">
          <img src={cardImage(head.image, 100) || PLACEHOLDER_IMAGE} alt="" className="w-10 h-[52px] object-cover bg-cream" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold">
            {head.name}
            <span className="font-normal text-muted"> · {head.role === "buyer" ? "seller" : "buyer"}</span>
          </p>
          <p className="truncate text-xs text-muted">
            {head.title}
            {head.price ? ` · ${head.price}` : ""}
            {head.status === "sold" ? " · Sold" : head.status === "removed" ? " · No longer listed" : ""}
          </p>
        </div>
        {head.status !== "removed" && (
          <Link to={`/product/${head.product}`} className="hidden sm:inline-flex btn btn-outline btn-sm">
            View item
          </Link>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-paper" aria-live="polite">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Ask {head.name.split(" ")[0]} about size, condition, fit or delivery. Keep payment on ReWear so your order is protected.
          </p>
        )}

        {groups.map((g) => (
          <div key={g.label}>
            <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{g.label}</p>
            <ul className="flex flex-col gap-1.5">
              {g.items.map((m) => {
                const mine = m.sender === user._id;
                return (
                  <li key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${mine ? "bg-ink text-paper rounded-l-xl rounded-tr-xl" : "bg-white border border-line rounded-r-xl rounded-tl-xl"}`}>
                      <span className="sr-only">{mine ? "You: " : `${head.name}: `}</span>
                      {m.body}
                      <span className={`block mt-0.5 text-[10px] text-right ${mine ? "text-paper/70" : "text-muted"}`}>
                        {format(new Date(m.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* WRITE */}
      <form onSubmit={send} className="border-t border-line p-3 bg-white">
        {error && <p role="alert" className="mb-2 text-[13px] text-red-700">{error}</p>}
        <div className="flex items-end gap-2">
          <label htmlFor="chat-message" className="sr-only">
            Message to {head.name}
          </label>
          <textarea
            id="chat-message"
            rows={1}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter starts a new line
              if (e.key === "Enter" && !e.shiftKey) send(e);
            }}
            placeholder="Write a message…"
            className="flex-1 min-h-[44px] max-h-32 px-3.5 py-2.5 rounded-sm border border-[#d9cbb9] text-sm resize-y focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button type="submit" disabled={sending || !text.trim()} aria-label="Send message" className="btn btn-dark h-11 px-4">
            <Send size={17} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

const Messages = () => {
  usePageTitle("Messages");
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { authHeader } = useAuth();

  const isNew = id === "new";
  const productId = isNew ? params.get("product") : null;

  const [chats, setChats] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftError, setDraftError] = useState("");

  const loadChats = () =>
    axios
      .get(`${API}/chats`, authHeader)
      .then(({ data }) => setChats(data))
      .catch(() => setChats((c) => c || []));

  useEffect(() => {
    loadChats();
    const timer = setInterval(() => {
      if (!document.hidden) loadChats();
    }, LIST_POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Ask the seller": open the existing chat about this item, or prepare a new one
  useEffect(() => {
    if (!productId) return;

    let ignore = false;
    axios
      .get(`${API}/chats/for/${productId}`, authHeader)
      .then(({ data }) => {
        if (ignore) return;
        if (data.conversation) navigate(`/messages/${data.conversation}`, { replace: true });
        else setDraft(data);
      })
      .catch((err) => !ignore && setDraftError(err.response?.data?.message || "Could not start this chat"));

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const chatId = id && !isNew ? id : null;
  const showThread = !!chatId || isNew;

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-6 py-0 sm:py-6">
      <h1 className={`page-title px-4 sm:px-0 pt-5 sm:pt-0 mb-5 ${showThread ? "hidden md:block" : ""}`}>Messages</h1>

      <div className="bg-white border-y sm:border border-line sm:rounded-sm grid md:grid-cols-[320px_minmax(0,1fr)] h-[calc(100dvh-202px)] md:h-[calc(100dvh-270px)] min-h-[380px]">
        {/* On phones only one pane shows at a time */}
        <aside aria-label="Your chats" className={`${showThread ? "hidden md:block" : ""} md:border-r border-line overflow-y-auto`}>
          <ChatList chats={chats} activeId={chatId} />
        </aside>

        <section aria-label="Conversation" className={`${showThread ? "" : "hidden md:flex"} min-h-0 flex flex-col`}>
          {chatId ? (
            <Thread key={chatId} chatId={chatId} onSent={loadChats} />
          ) : isNew ? (
            draftError || !productId ? (
              <div className="m-6">
                <p role="alert" className="text-sm text-red-700">{draftError || "Choose an item first, then use “Ask the seller a question”."}</p>
                <Link to="/messages" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                  Back to messages
                </Link>
              </div>
            ) : (
              <Thread key={`new-${productId}`} draft={draft} onSent={loadChats} />
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-muted">
              <MessageCircle size={30} />
              <p className="mt-3 text-sm">Pick a chat on the left to read it.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
