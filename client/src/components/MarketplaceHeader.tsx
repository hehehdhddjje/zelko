import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { Bell, LogOut, Menu, MessageCircle, Plus, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";

type MarketplaceHeaderProps = { onSearch?: (query: string) => void; searchValue?: string };

export function MarketplaceHeader({ onSearch, searchValue = "" }: MarketplaceHeaderProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { data: profile } = trpc.marketplace.profile.me.useQuery(undefined, { enabled: isAuthenticated });
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchValue);

  const navigateWithSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSearch && location === "/") onSearch(localQuery);
    else navigate(`/?q=${encodeURIComponent(localQuery)}`);
    setMobileOpen(false);
  };

  const profileName = profile?.username || user?.username || user?.name || "Mon compte";
  const isMessages = location.startsWith("/messages");

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:rgb(250_248_243_/_0.92)] backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Zelko, retour au catalogue">
          <span className="brand-mark">z</span>
          <span className="font-display text-[1.65rem] leading-none tracking-[-0.07em] text-[#171816]">zelko</span>
        </Link>

        <form onSubmit={navigateWithSearch} className="hidden max-w-[430px] flex-1 items-center lg:flex">
          <label className="search-shell w-full">
            <Search className="size-4 text-[#79746a]" aria-hidden="true" />
            <input value={localQuery} onChange={(event) => setLocalQuery(event.target.value)} placeholder="Rechercher une pièce" aria-label="Rechercher une annonce" />
            <kbd>⌘ K</kbd>
          </label>
        </form>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          <Link href="/" className={`nav-link ${location === "/" ? "nav-link-active" : ""}`}>Explorer</Link>
          {isAuthenticated && <Link href="/messages" className={`nav-link ${isMessages ? "nav-link-active" : ""}`}>Messages</Link>}
          {isAuthenticated ? (
            <>
              <Link href="/publier"><Button className="btn-ink h-10 gap-2 rounded-full px-4"><Plus className="size-4" />Publier</Button></Link>
              <Link href="/profil" className="ml-1 flex size-10 items-center justify-center overflow-hidden rounded-full border border-[#d9d4c9] bg-white transition-transform duration-150 hover:-translate-y-0.5" aria-label="Accéder à mon profil">
                {profile?.photoUrl ? <img src={profile.photoUrl} alt="" className="size-full object-cover" /> : <span className="avatar-initials">{initials(profileName)}</span>}
              </Link>
              <button onClick={() => void logout()} className="ml-1 rounded-full p-2 text-[#6b665c] transition-colors hover:bg-[#ebe8de] hover:text-[#181917]" aria-label="Se déconnecter"><LogOut className="size-4" /></button>
            </>
          ) : !loading ? <Button onClick={() => navigate("/connexion")} variant="outline" className="rounded-full border-[#1d1e1b] px-5 text-[#1d1e1b] hover:bg-[#1d1e1b] hover:text-white">Connexion</Button> : null}
        </nav>

        <button onClick={() => setMobileOpen((current) => !current)} className="rounded-full p-2 text-[#171816] md:hidden" aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}>
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {mobileOpen && <div className="border-t border-[color:var(--line)] bg-[#faf8f3] px-4 pb-5 pt-4 md:hidden">
        <form onSubmit={navigateWithSearch} className="mb-4"><label className="search-shell w-full"><Search className="size-4 text-[#79746a]" /><input value={localQuery} onChange={(event) => setLocalQuery(event.target.value)} placeholder="Rechercher une pièce" aria-label="Rechercher une annonce" /></label></form>
        <div className="grid gap-2">
          <Link href="/" onClick={() => setMobileOpen(false)} className="mobile-nav-link"><Search className="size-4" />Explorer</Link>
          {isAuthenticated ? <>
            <Link href="/publier" onClick={() => setMobileOpen(false)} className="mobile-nav-link"><Plus className="size-4" />Publier une annonce</Link>
            <Link href="/messages" onClick={() => setMobileOpen(false)} className="mobile-nav-link"><MessageCircle className="size-4" />Messages</Link>
            <Link href="/profil" onClick={() => setMobileOpen(false)} className="mobile-nav-link"><UserRound className="size-4" />Mon profil</Link>
            <button onClick={() => void logout()} className="mobile-nav-link text-left"><LogOut className="size-4" />Déconnexion</button>
          </> : <button onClick={() => { navigate("/connexion"); setMobileOpen(false); }} className="mobile-nav-link"><UserRound className="size-4" />Connexion ou inscription</button>}
        </div>
      </div>}
    </header>
  );
}
