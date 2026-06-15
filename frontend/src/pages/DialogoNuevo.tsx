import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, type Author, type DialogueMessage } from "../lib/api";
import { notifyOk, notifyGrokError } from "../lib/notify";

/**
 * CHAT con un autor.
 *  - /dialogos/nuevo?author=ID  -> conversación nueva
 *  - /dialogos/:id              -> abre una conversación guardada
 */
export default function DialogoNuevo() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [authors, setAuthors] = useState<Author[]>([]);
  const [authorId, setAuthorId] = useState<string>(params.get("author") ?? "");
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(id ? Number(id) : null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listAuthors().then(setAuthors).catch(() => {});
    if (id) {
      api
        .getDialogue(Number(id))
        .then((d) => {
          setAuthorId(d.author_id);
          setMessages(d.messages);
        })
        .catch(() => {});
    }
  }, [id]);

  const author = authors.find((a) => a.id === authorId);

  // Autoscroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || !authorId || sending) return;
    const history = messages;
    setMessages([...history, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await api.dialogueReply(authorId, history, text);
      setMessages((m) => [...m, { role: "author", content: reply }]);
    } catch (err) {
      setMessages(history); // revertir el mensaje optimista
      setInput(text); // devolver el texto para reintentar
      notifyGrokError(err);
    } finally {
      setSending(false);
    }
  }

  async function save() {
    if (!authorId || messages.length === 0) {
      return notifyGrokError(new Error("No hay nada que guardar todavía."));
    }
    try {
      if (savedId) {
        await api.updateDialogue(savedId, messages);
      } else {
        const { id: newId } = await api.saveDialogue(authorId, author?.name ?? "", messages);
        setSavedId(newId);
      }
      notifyOk("Conversación guardada.");
    } catch (err) {
      notifyGrokError(err);
    }
  }

  // Si no hay autor seleccionado, invitamos a elegir uno.
  if (!authorId) {
    return (
      <div className="text-center">
        <p className="text-muted">Elige un autor para empezar a conversar.</p>
        <button onClick={() => navigate("/dialogos")} className="btn-gold mt-4">
          Ver autores
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Encabezado del chat */}
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate("/dialogos")} className="btn-ghost !px-3 !py-2 text-sm">
          ← Volver
        </button>
        {author && (
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full font-serif text-cream"
              style={{ backgroundColor: author.accent }}
            >
              {author.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div>
              <div className="font-serif text-xl text-cream">{author.name}</div>
              <div className="text-xs uppercase tracking-wide text-muted">{author.era}</div>
            </div>
          </div>
        )}
        <button onClick={save} className="btn-ghost ml-auto text-sm">
          Guardar
        </button>
      </div>

      {/* Mensajes */}
      <div
        ref={scrollRef}
        className="card flex-1 space-y-3 overflow-y-auto p-4"
        style={{ height: "60vh" }}
      >
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted">
            Escribe tu primera pregunta a {author?.name ?? "este autor"}.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === "user"
                  ? "rounded-br-sm bg-gold/15 text-cream"
                  : "rounded-bl-sm border border-border bg-surface font-serif text-cream/95"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-2.5 text-muted">
              <span className="animate-pulse">escribiendo…</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de entrada */}
      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder={`Pregúntale a ${author?.name?.split(" ")[0] ?? "…"}…`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button onClick={send} disabled={sending || !input.trim()} className="btn-gold disabled:opacity-40">
          Enviar
        </button>
      </div>
    </div>
  );
}
