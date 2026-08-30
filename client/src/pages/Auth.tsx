import { Button } from "@/components/ui/button";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { startLogin } from "@/const";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";

export default function Auth() {
  return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container grid min-h-[calc(100vh-76px)] items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
    <section className="max-w-2xl"><p className="eyebrow">LA MARKETPLACE CURATÉE</p><h1 className="display-title mt-5">Une seconde vie<br /><i>bien choisie.</i></h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#5f5b52]">Rejoignez une communauté attentive pour publier vos pièces, découvrir des objets singuliers et échanger directement avec leur vendeur.</p><div className="mt-9 grid gap-3 sm:grid-cols-2"><p className="feature-note"><Check className="size-4" />Publiez vos propres annonces</p><p className="feature-note"><ShieldCheck className="size-4" />Échanges privés et sécurisés</p></div></section>
    <section className="relative overflow-hidden rounded-[2rem] border border-[#ded9cd] bg-[#f1eee5] p-7 shadow-[0_24px_80px_-38px_rgba(45,42,32,.35)] sm:p-10"><div className="absolute -right-10 -top-10 size-40 rounded-full bg-[#cdd8c2] opacity-65 blur-2xl" /><div className="relative"><span className="brand-mark">z</span><h2 className="mt-7 font-display text-4xl tracking-[-0.055em] text-[#1b1c19]">Bienvenue<br />sur Zelko.</h2><p className="mt-4 max-w-sm leading-7 text-[#5f5a50]">Votre compte est protégé par une session sécurisée. Aucun mot de passe n’est enregistré par Zelko.</p><Button onClick={() => startLogin()} className="btn-ink mt-9 h-12 w-full rounded-full text-sm">Créer mon compte ou me connecter <ArrowRight className="ml-2 size-4" /></Button><p className="mt-5 text-center text-xs leading-5 text-[#777267]">En continuant, vous acceptez d’utiliser une session sécurisée pour accéder à votre espace Zelko.</p></div></section>
  </main></div>;
}
