import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, initials, Listing } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, BadgeCheck, ChevronRight, Loader2, MessageCircle, PackageOpen, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

export default function ListingDetail() {
  const [, params] = useRoute("/annonces/:id");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const listingId = Number(params?.id);
  const { data: listing, isLoading, error } = trpc.marketplace.listing.useQuery({ id: listingId }, { enabled: Number.isInteger(listingId) && listingId > 0 });
  const openConversation = trpc.marketplace.conversations.open.useMutation({
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
    onError: (error) => { if (error.data?.code === "PRECONDITION_FAILED") navigate("/profil"); else toast.error(error.message); },
  });

  if (isLoading) return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><div className="grid min-h-[70vh] place-items-center"><Loader2 className="size-6 animate-spin text-[#65705c]" /></div></div>;
  if (error || !listing) return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container py-20"><section className="empty-state"><PackageOpen className="size-7 text-[#64705c]" /><h1 className="mt-5 font-display text-4xl tracking-[-.05em]">Annonce introuvable</h1><p className="mt-3 text-sm text-[#716c62]">Cette pièce a peut-être été retirée du catalogue.</p><Link href="/"><Button className="btn-ink mt-6 rounded-full"><ArrowLeft className="mr-2 size-4" />Revenir au catalogue</Button></Link></section></main></div>;
  const item = listing as Listing;
  const contactSeller = () => { if (!isAuthenticated) navigate("/connexion"); else openConversation.mutate({ productId: item.id }); };
  return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container pb-20 pt-7 sm:pt-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#69655b] transition hover:text-[#242521]"><ArrowLeft className="size-4" />Retour au catalogue</Link><div className="mt-7 grid gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.75fr)] lg:gap-14"><div className="overflow-hidden rounded-[1.6rem] bg-[#ece8de]"><img src={item.imageUrl} alt={item.name} className="aspect-[4/4.55] size-full object-cover" /></div><section className="flex flex-col lg:py-4"><div className="flex items-center justify-between gap-4"><span className="rounded-full bg-[#e6ece0] px-3 py-1 text-[.65rem] font-semibold uppercase tracking-[.13em] text-[#506049]">{item.category}</span><p className="text-xs text-[#7b766b]">Publiée le {formatDate(item.createdAt)}</p></div><h1 className="mt-5 font-display text-5xl leading-[.95] tracking-[-.065em] text-[#20211e] sm:text-6xl">{item.name}</h1><p className="mt-5 font-display text-3xl tracking-[-.04em] text-[#5f7057]">{formatPrice(item.priceCents, item.currency)}</p><div className="mt-7 border-y border-[#ded9cd] py-6"><p className="whitespace-pre-wrap leading-7 text-[#5e5a51]">{item.description}</p></div><div className="mt-7 flex items-center gap-3"><Avatar className="size-11 border border-[#dfdacd]"><AvatarImage src={item.sellerPhotoUrl || undefined} alt="" /><AvatarFallback className="bg-[#e4e9dc] font-mono text-xs text-[#52614a]">{initials(item.sellerUsername)}</AvatarFallback></Avatar><div><p className="text-[.68rem] font-medium uppercase tracking-[.13em] text-[#7f796e]">Proposée par</p><p className="mt-0.5 font-medium text-[#343530]">{item.sellerUsername || "Membre Zelko"}</p></div></div>{item.sellerBio && <p className="mt-4 rounded-xl bg-[#f0ede5] px-4 py-3 text-sm leading-6 text-[#676258]">{item.sellerBio}</p>}<Button onClick={contactSeller} disabled={openConversation.isPending} className="btn-ink mt-8 h-12 w-full rounded-full"><MessageCircle className="mr-2 size-4" />{openConversation.isPending ? "Ouverture de la conversation…" : "Contacter le vendeur"}</Button><div className="mt-6 grid grid-cols-2 gap-4"><p className="flex gap-2 text-xs leading-5 text-[#767166]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#69775e]" />Échangez directement avec le vendeur.</p><p className="flex gap-2 text-xs leading-5 text-[#767166]"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-[#69775e]" />Annonce publiée par un membre Zelko.</p></div></section></div></main></div>;
}
