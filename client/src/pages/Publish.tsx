import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, readImageFile } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, ArrowLeft, ImagePlus, Loader2, LogIn, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function Publish() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: profile, isLoading: profileLoading } = trpc.marketplace.profile.me.useQuery(undefined, { enabled: isAuthenticated });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const publish = trpc.marketplace.products.publish.useMutation({
    onSuccess: async (listing) => {
      await Promise.all([utils.marketplace.catalog.invalidate(), utils.marketplace.categories.invalidate(), utils.marketplace.products.mine.invalidate()]);
      toast.success("Votre annonce est maintenant publiée.");
      navigate(`/annonces/${listing?.id}`);
    },
    onError: (error) => {
      if (error.data?.code === "PRECONDITION_FAILED") navigate("/profil");
      else toast.error(error.message);
    },
  });

  async function selectImage(file?: File) {
    if (!file) return;
    try { setImageDataUrl(await readImageFile(file)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "L’image est indisponible."); }
  }

  const priceCents = Math.round(Number(price.replace(",", ".")) * 100);
  const validPrice = Number.isSafeInteger(priceCents) && priceCents >= 0;
  const canPublish = Boolean(imageDataUrl && name.trim().length >= 3 && description.trim().length >= 10 && category.trim().length >= 2 && validPrice);

  if (!loading && !isAuthenticated) return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container py-20"><section className="empty-state"><LogIn className="size-6 text-[#64705c]" /><h1 className="mt-5 font-display text-4xl tracking-[-.05em]">Publiez votre première pièce</h1><p className="mt-3 max-w-md leading-7 text-[#69645a]">Connectez-vous ou créez un compte pour proposer une annonce à la communauté Zelko.</p><Link href="/connexion"><Button className="btn-ink mt-6 rounded-full">Connexion ou inscription</Button></Link></section></main></div>;
  if (profileLoading) return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><div className="grid min-h-[70vh] place-items-center"><Loader2 className="size-6 animate-spin text-[#65705c]" /></div></div>;
  if (isAuthenticated && !profile?.username) return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container py-20"><section className="empty-state"><AlertCircle className="size-6 text-[#64705c]" /><h1 className="mt-5 font-display text-4xl tracking-[-.05em]">Votre profil vous attend</h1><p className="mt-3 max-w-md leading-7 text-[#69645a]">Avant de publier, choisissez un nom d’utilisateur et, si vous le souhaitez, ajoutez une biographie et une photo.</p><Link href="/profil"><Button className="btn-ink mt-6 rounded-full">Compléter mon profil</Button></Link></section></main></div>;

  return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container max-w-5xl pb-20 pt-7 sm:pt-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#69655b] transition hover:text-[#242521]"><ArrowLeft className="size-4" />Retour au catalogue</Link><div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.75fr)] lg:gap-14"><section><p className="eyebrow">NOUVELLE ANNONCE</p><h1 className="mt-2 font-display text-5xl tracking-[-.06em] text-[#20211e]">Mettre en vente<br /><i className="text-[#68745f]">une belle pièce.</i></h1><p className="mt-5 max-w-lg leading-7 text-[#625e55]">Décrivez votre article avec précision pour faciliter une rencontre entre vous et le futur acheteur.</p><form className="mt-10 grid gap-6" onSubmit={(event) => { event.preventDefault(); if (!canPublish || !imageDataUrl) return; publish.mutate({ name: name.trim(), description: description.trim(), category: category.trim(), priceCents, imageDataUrl }); }}><div className="grid gap-2"><Label htmlFor="listing-name">Nom de l’annonce</Label><Input id="listing-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Lampe italienne des années 70" maxLength={140} minLength={3} required className="h-11 border-[#ded9ce] bg-white" /></div><div className="grid gap-2"><Label htmlFor="listing-category">Catégorie</Label><Input id="listing-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex. Mobilier, Mode, Livres…" maxLength={60} minLength={2} required className="h-11 border-[#ded9ce] bg-white" /></div><div className="grid gap-2"><Label htmlFor="listing-price">Prix</Label><div className="relative"><Input id="listing-price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0,00" required className="h-11 border-[#ded9ce] bg-white pr-12" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#6d685e]">EUR</span></div></div><div className="grid gap-2"><Label htmlFor="listing-description">Description</Label><Textarea id="listing-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="État, dimensions, histoire de la pièce, modalités de remise…" minLength={10} maxLength={4000} rows={7} required className="resize-y border-[#ded9ce] bg-white" /><p className="text-right text-xs text-[#817b71]">{description.length}/4000</p></div><Button type="submit" disabled={!canPublish || publish.isPending} className="btn-ink h-12 w-fit rounded-full px-6">{publish.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}{publish.isPending ? "Publication en cours…" : "Publier l’annonce"}</Button></form></section>
    <aside className="lg:pt-5"><div className="sticky top-24 rounded-[1.5rem] border border-[#ded9ce] bg-[#f0ede4] p-5 sm:p-6"><p className="eyebrow">L’IMAGE DE VOTRE ANNONCE</p><div className="relative mt-5 aspect-[4/4.6] overflow-hidden rounded-[1.1rem] border border-dashed border-[#cbc5b7] bg-[#e6e2d8]">{imageDataUrl ? <><img src={imageDataUrl} alt="Aperçu de votre annonce" className="size-full object-cover" /><button type="button" onClick={() => setImageDataUrl(null)} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[#1e1f1b] text-white shadow-sm" aria-label="Retirer l’image"><X className="size-4" /></button></> : <label className="flex size-full cursor-pointer flex-col items-center justify-center px-6 text-center"><span className="grid size-12 place-items-center rounded-full bg-[#fbfaf6] text-[#68745f]"><ImagePlus className="size-5" /></span><span className="mt-4 font-medium text-[#44463f]">Choisir une photo</span><span className="mt-2 max-w-[13rem] text-xs leading-5 text-[#777167]">PNG, JPEG ou WebP. 4 Mo maximum.</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectImage(event.target.files?.[0])} className="sr-only" /></label>}</div><div className="mt-5 border-t border-[#d8d2c6] pt-5"><p className="text-xs leading-5 text-[#6b665d]">Cette image sera enregistrée de manière sécurisée avec votre annonce. Vous restez maître des informations que vous choisissez de partager.</p>{validPrice && price && <p className="mt-4 font-display text-2xl tracking-[-.045em] text-[#4d5d47]">Prix affiché : {formatPrice(priceCents)}</p>}</div></div></aside></div></main></div>;
}
