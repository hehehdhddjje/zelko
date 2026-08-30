import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Listing } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ChevronDown, Loader2, Plus, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [category, setCategory] = useState<string | undefined>();
  const input = useMemo(() => ({ query: query.trim() || undefined, category }), [query, category]);
  const { data: listings, isLoading, error } = trpc.marketplace.catalog.useQuery(input);
  const { data: categories } = trpc.marketplace.categories.useQuery();
  const visibleCategories = categories || [];

  useEffect(() => { const fresh = new URLSearchParams(window.location.search).get("q") || ""; if (fresh !== query) setQuery(fresh); }, [window.location.search]);
  const clearFilters = () => { setQuery(""); setCategory(undefined); navigate("/"); };

  return <div className="min-h-screen overflow-hidden bg-[#faf8f3]"><MarketplaceHeader searchValue={query} onSearch={(value) => { setQuery(value); setCategory(undefined); navigate(value ? `/?q=${encodeURIComponent(value)}` : "/"); }} />
    <main>
      <section className="hero-shell"><div className="container relative grid min-h-[410px] items-end gap-10 pb-12 pt-16 lg:grid-cols-[1fr_0.72fr] lg:pb-16 lg:pt-24"><div className="relative z-10"><p className="eyebrow">OBJETS CHOISIS · VRAIES HISTOIRES</p><h1 className="display-title mt-4 max-w-3xl">Donnez une nouvelle<br /><i>allure</i> à vos trouvailles.</h1><p className="mt-6 max-w-lg text-base leading-7 text-[#5c584f] sm:text-lg">Zelko est l’espace attentif pour trouver, publier et transmettre les pièces qui méritent de continuer leur histoire.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="#catalogue"><Button className="btn-ink h-11 rounded-full px-5">Voir les annonces <ArrowRight className="ml-2 size-4" /></Button></Link><Link href="/publier"><Button variant="outline" className="h-11 rounded-full border-[#bfb9ac] bg-[#faf8f3]/60 px-5 text-[#252622] hover:bg-white">Publier une pièce</Button></Link></div></div><div className="relative hidden h-[295px] overflow-hidden rounded-tl-[7rem] rounded-tr-[1.4rem] bg-[#cbd6c2] lg:block"><div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(253,251,244,.9),transparent_23%),radial-gradient(circle_at_21%_75%,rgba(173,189,160,.8),transparent_33%),linear-gradient(128deg,#dbe2d4_0%,#bdcdb3_57%,#e7dfcc_100%)]" /><div className="absolute bottom-9 left-10 right-8 flex items-end justify-between"><p className="max-w-[11rem] font-display text-2xl leading-7 tracking-[-.04em] text-[#394035]">Le beau, sans l’éphémère.</p><span className="grid size-12 place-items-center rounded-full border border-[#566050]/20 bg-[#f9f6ec]/70"><Sparkles className="size-5 text-[#53604f]" /></span></div></div></div></section>
      <section id="catalogue" className="container pb-20 pt-12 sm:pt-16"><div className="flex flex-col justify-between gap-6 border-b border-[#ddd8cc] pb-7 md:flex-row md:items-end"><div><p className="eyebrow">LE CATALOGUE</p><h2 className="mt-2 font-display text-4xl tracking-[-.055em] text-[#20211e]">À découvrir maintenant</h2></div><Link href="/publier" className="text-sm font-semibold text-[#565c50] underline decoration-[#aebaa5] underline-offset-4 transition hover:text-[#242521]">Vous avez une pièce à proposer ?</Link></div>
        <div className="flex flex-col justify-between gap-4 py-6 sm:flex-row sm:items-center"><div className="flex gap-2 overflow-x-auto pb-1"><button onClick={() => setCategory(undefined)} className={`filter-chip ${!category ? "filter-chip-active" : ""}`}>Tout voir</button>{visibleCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`filter-chip ${category === item ? "filter-chip-active" : ""}`}>{item}</button>)}</div><div className="flex items-center gap-2 text-xs text-[#787368]"><SlidersHorizontal className="size-3.5" />{listings?.length ?? 0} annonce{(listings?.length ?? 0) > 1 ? "s" : ""}</div></div>
        {isLoading ? <div className="grid min-h-[320px] place-items-center"><Loader2 className="size-6 animate-spin text-[#6d7567]" /></div> : error ? <div className="empty-state"><p>Le catalogue ne peut pas être chargé pour le moment.</p><Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-full">Réessayer</Button></div> : listings?.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-6"><>{listings.map((listing) => <ListingCard key={listing.id} listing={listing as Listing} />)}</></div> : <div className="empty-state my-5"><span className="grid size-11 place-items-center rounded-full bg-[#e9e6dc]"><Search className="size-5 text-[#65705d]" /></span><h3 className="mt-5 font-display text-3xl tracking-[-.05em]">Pas encore de pièce ici.</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#6c675d]">{query || category ? "Aucune annonce ne correspond à ces filtres. Essayez une autre recherche." : "Le catalogue s’enrichira avec les annonces réellement publiées par les membres de Zelko."}</p>{query || category ? <Button onClick={clearFilters} variant="outline" className="mt-5 rounded-full">Effacer les filtres</Button> : <Link href="/publier"><Button className="btn-ink mt-5 rounded-full"><Plus className="mr-2 size-4" />Publier la première annonce</Button></Link>}</div>}
      </section>
    </main><footer className="border-t border-[#ddd8cc] bg-[#f3f0e8]"><div className="container flex flex-col gap-3 py-8 text-xs text-[#797368] sm:flex-row sm:items-center sm:justify-between"><span className="font-display text-lg tracking-[-.05em] text-[#353731]">zelko</span><span>Une marketplace pensée pour les pièces qui durent.</span></div></footer>
  </div>;
}
