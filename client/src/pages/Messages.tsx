import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, initials } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, Inbox, Loader2, MessageCircle, Send, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

function conversationDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(value));
}

export default function Messages() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, params] = useRoute("/messages/:id");
  const [, navigate] = useLocation();
  const selectedId = params?.id ? Number(params.id) : undefined;
  const utils = trpc.useUtils();
  const { data: inbox, isLoading: inboxLoading, error: inboxError } = trpc.marketplace.conversations.inbox.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 12_000 });
  const { data: detail, isLoading: detailLoading, error: detailError } = trpc.marketplace.conversations.detail.useQuery({ conversationId: selectedId || 0 }, { enabled: isAuthenticated && Boolean(selectedId), refetchInterval: 7_000 });
  const [body, setBody] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const currentConversation = inbox?.find((conversation) => conversation.id === selectedId);
  const counterpart = detail?.counterpart || currentConversation?.counterpart;

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [detail?.messages.length, selectedId]);

  const send = trpc.marketplace.conversations.send.useMutation({
    onSuccess: async () => {
      setBody("");
      await Promise.all([utils.marketplace.conversations.detail.invalidate(), utils.marketplace.conversations.inbox.invalidate()]);
    },
    onError: (error) => toast.error(error.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !body.trim() || send.isPending) return;
    send.mutate({ conversationId: selectedId, body: body.trim() });
  };

  if (!loading && !isAuthenticated) return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container py-20"><section className="empty-state"><MessageCircle className="size-6 text-[#64705c]" /><h1 className="mt-5 font-display text-4xl tracking-[-.05em]">Des échanges, en toute simplicité</h1><p className="mt-3 max-w-md leading-7 text-[#69645a]">Connectez-vous pour démarrer ou retrouver vos conversations avec les vendeurs Zelko.</p><Link href="/connexion"><Button className="btn-ink mt-6 rounded-full">Connexion ou inscription</Button></Link></section></main></div>;

  return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container pb-10 pt-7 sm:pt-10"><div className="mb-7"><p className="eyebrow">MESSAGERIE PRIVÉE</p><h1 className="mt-2 font-display text-5xl tracking-[-.06em]">Mes échanges</h1></div><div className="overflow-hidden rounded-[1.5rem] border border-[#ded9cd] bg-white lg:grid lg:min-h-[calc(100vh-215px)] lg:grid-cols-[330px_minmax(0,1fr)]">
    <aside className={`${selectedId ? "hidden lg:block" : "block"} border-b border-[#e3ded2] lg:border-b-0 lg:border-r`}><div className="flex items-center justify-between border-b border-[#e7e2d7] px-5 py-4"><p className="text-sm font-semibold text-[#32332f]">Boîte de réception</p><span className="grid size-6 place-items-center rounded-full bg-[#e6ebdf] font-mono text-[.65rem] text-[#506048]">{inbox?.length ?? 0}</span></div>{inboxLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="size-5 animate-spin text-[#64705c]" /></div> : inboxError ? <div className="p-6 text-sm leading-6 text-[#716c61]">Les conversations ne peuvent pas être chargées.<Button onClick={() => window.location.reload()} variant="link" className="h-auto p-0 text-[#586650]">Réessayer</Button></div> : inbox?.length ? <div className="max-h-[600px] overflow-y-auto p-2">{inbox.map((conversation) => { const active = conversation.id === selectedId; const otherName = conversation.counterpart?.username || conversation.counterpart?.name || "Membre Zelko"; return <button key={conversation.id} onClick={() => navigate(`/messages/${conversation.id}`)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active ? "bg-[#edf0e8]" : "hover:bg-[#f5f3ed]"}`}><Avatar className="size-10 shrink-0"><AvatarImage src={conversation.counterpart?.photoUrl || undefined} alt="" /><AvatarFallback className="bg-[#e1e8d9] font-mono text-xs text-[#55624d]">{initials(otherName)}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm font-semibold text-[#32332f]">{otherName}</strong><time className="shrink-0 text-[.65rem] text-[#8b857a]">{conversationDate(conversation.updatedAt)}</time></span><span className="mt-0.5 block truncate text-xs text-[#777166]">À propos de {conversation.productName}</span></span></button>; })}</div> : <div className="flex min-h-64 flex-col items-center justify-center px-8 text-center"><Inbox className="size-6 text-[#75806d]" /><p className="mt-4 font-display text-2xl tracking-[-.045em]">Aucun message.</p><p className="mt-2 text-xs leading-5 text-[#777167]">Les conversations initiées depuis une annonce apparaîtront ici.</p></div>}</aside>
    <section className={`${selectedId ? "flex" : "hidden lg:flex"} min-h-[570px] flex-col`}>{!selectedId ? <div className="flex flex-1 flex-col items-center justify-center bg-[#f9f8f4] px-8 text-center"><span className="grid size-12 place-items-center rounded-full bg-[#e6ebdf]"><MessageCircle className="size-5 text-[#617057]" /></span><h2 className="mt-5 font-display text-3xl tracking-[-.05em]">Choisissez une conversation</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#726d63]">Sélectionnez un échange dans votre boîte de réception pour consulter l’historique privé.</p></div> : detailLoading ? <div className="grid flex-1 place-items-center"><Loader2 className="size-5 animate-spin text-[#65705e]" /></div> : detailError || !detail ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><p className="text-sm text-[#706b60]">Cette conversation n’est pas disponible.</p><Link href="/messages"><Button variant="outline" className="mt-4 rounded-full">Revenir aux messages</Button></Link></div> : <><div className="flex items-center gap-3 border-b border-[#e7e2d7] px-4 py-3 sm:px-6"><button onClick={() => navigate("/messages")} className="mr-1 rounded-full p-1.5 text-[#626057] hover:bg-[#f0eee7] lg:hidden" aria-label="Retour à la boîte de réception"><ArrowLeft className="size-4" /></button><Avatar className="size-9"><AvatarImage src={counterpart?.photoUrl || undefined} alt="" /><AvatarFallback className="bg-[#e1e8d9] font-mono text-xs text-[#55624d]">{initials(counterpart?.username || counterpart?.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#353630]">{counterpart?.username || counterpart?.name || "Membre Zelko"}</p><Link href={`/annonces/${detail.conversation.productId}`} className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#76806f] hover:text-[#4e5f47]"><ShoppingBag className="size-3" />{detail.conversation.productName}</Link></div></div><div className="flex-1 space-y-4 overflow-y-auto bg-[#fcfbf8] px-4 py-6 sm:px-6">{detail.messages.length ? detail.messages.map((message) => { const mine = message.senderId === user?.id; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${mine ? "rounded-br-sm bg-[#293028] text-[#fbfaf5]" : "rounded-bl-sm bg-[#ece9df] text-[#30312d]"}`}><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><time className={`mt-1.5 block text-right text-[.63rem] ${mine ? "text-[#d9dfd3]" : "text-[#888277]"}`}>{new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</time></div></div>; }) : <div className="grid h-full place-items-center"><p className="text-sm text-[#7b756b]">Envoyez le premier message au sujet de cette annonce.</p></div>}<div ref={messagesEnd} /></div><form onSubmit={submit} className="flex gap-3 border-t border-[#e7e2d7] bg-white p-3 sm:p-4"><Textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event); } }} placeholder="Écrire un message…" maxLength={2000} rows={1} className="min-h-11 max-h-28 resize-none border-[#ded9ce] bg-[#fcfbf8] py-2.5" /><Button type="submit" disabled={!body.trim() || send.isPending} className="btn-ink size-11 shrink-0 rounded-full p-0" aria-label="Envoyer le message">{send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></form></>}</section>
  </div></main></div>;
}
