import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { ListingCard } from "@/components/ListingCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initials, Listing, readImageFile } from "@/lib/marketplace";
import { trpc } from "@/lib/trpc";
import { Camera, Check, Loader2, LogIn, PencilLine, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Profile() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading: profileLoading, error: profileError } = trpc.marketplace.profile.me.useQuery(undefined, { enabled: isAuthenticated });
  const { data: listings, error: listingsError } = trpc.marketplace.products.mine.useQuery(undefined, { enabled: isAuthenticated });
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setPhotoPreview(profile.photoUrl || null);
      setPhotoDataUrl(undefined);
    }
  }, [profile]);

  const saveProfile = trpc.marketplace.profile.save.useMutation({
    onSuccess: async () => {
      await utils.marketplace.profile.me.invalidate();
      toast.success("Votre profil a été mis à jour.");
    },
    onError: (error) => toast.error(error.message),
  });

  async function choosePhoto(file?: File) {
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      setPhotoDataUrl(dataUrl);
      setPhotoPreview(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image indisponible.");
    }
  }

  if (!loading && !isAuthenticated) return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container py-20"><section className="empty-state"><LogIn className="size-6 text-[#64705c]" /><h1 className="mt-5 font-display text-4xl tracking-[-.05em]">Votre espace personnel</h1><p className="mt-3 max-w-md leading-7 text-[#69645a]">Connectez-vous pour modifier votre profil et retrouver vos annonces publiées.</p><Link href="/connexion"><Button className="btn-ink mt-6 rounded-full">Connexion ou inscription</Button></Link></section></main></div>;

  return <div className="min-h-screen bg-[#faf8f3]"><MarketplaceHeader /><main className="container pb-20 pt-10 sm:pt-14">
    <div className="flex flex-col justify-between gap-4 border-b border-[#ddd8cc] pb-7 sm:flex-row sm:items-end"><div><p className="eyebrow">MON ESPACE</p><h1 className="mt-2 font-display text-5xl tracking-[-.06em]">Mon profil</h1></div><Link href="/publier"><Button className="btn-ink rounded-full"><Plus className="mr-2 size-4" />Publier une annonce</Button></Link></div>
    {profileLoading ? <div className="grid min-h-[340px] place-items-center"><Loader2 className="size-6 animate-spin text-[#67705e]" /></div> : profileError ? <section className="empty-state mt-8"><p>Votre profil ne peut pas être chargé pour le moment.</p><Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-full">Réessayer</Button></section> : <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)]"><aside className="rounded-[1.5rem] bg-[#eeeade] p-7 sm:p-9"><p className="eyebrow">VOTRE VITRINE</p><div className="mt-8 flex items-center gap-4"><div className="relative"><Avatar className="size-20 border-2 border-[#faf8f3] shadow-sm"><AvatarImage src={photoPreview || undefined} alt="Votre photo de profil" /><AvatarFallback className="bg-[#d5ddcc] font-mono text-base text-[#55604e]">{initials(username)}</AvatarFallback></Avatar><label className="absolute -bottom-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-[#20211e] text-white shadow-sm transition hover:bg-[#505649]"><Camera className="size-3.5" /><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void choosePhoto(event.target.files?.[0])} className="sr-only" /></label></div><div><p className="font-display text-2xl tracking-[-.045em]">{username || "Votre nom"}</p><p className="mt-1 text-xs text-[#716c61]">Ajoutez une photo qui vous ressemble</p></div></div><div className="mt-10 border-t border-[#d9d4c7] pt-6"><p className="text-sm leading-6 text-[#635e54]">Votre profil accompagne chacune de vos annonces et inspire confiance lors des échanges.</p><p className="mt-5 rounded-xl bg-[#faf8f3]/75 p-4 text-xs leading-5 text-[#69645b]"><Check className="mr-1 inline size-3.5 text-[#617055]" /> Les informations que vous choisissez de renseigner sont visibles sur vos annonces.</p></div></aside>
      <section className="rounded-[1.5rem] border border-[#e0dbcf] bg-white p-6 sm:p-9"><div className="flex items-center gap-2"><PencilLine className="size-4 text-[#67705e]" /><h2 className="font-display text-3xl tracking-[-.045em]">Personnaliser mon profil</h2></div><form className="mt-8 grid gap-6" onSubmit={(event) => { event.preventDefault(); saveProfile.mutate({ username, bio, photoDataUrl }); }}><div className="grid gap-2"><Label htmlFor="username">Nom d’utilisateur</Label><Input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ex. Camille_Paris" minLength={3} maxLength={30} required className="h-11 border-[#ded9ce] bg-[#fcfbf8]" /><p className="text-xs text-[#807a70]">3 à 30 caractères, lettres, chiffres, tirets et tirets bas.</p></div><div className="grid gap-2"><Label htmlFor="bio">Biographie</Label><Textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Présentez votre univers en quelques mots…" maxLength={500} rows={5} className="resize-none border-[#ded9ce] bg-[#fcfbf8]" /><p className="text-right text-xs text-[#807a70]">{bio.length}/500</p></div><Button type="submit" disabled={saveProfile.isPending || username.trim().length < 3} className="btn-ink h-11 w-fit rounded-full px-5">{saveProfile.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}Enregistrer</Button></form></section></div>}
    <section className="mt-16"><div className="flex items-end justify-between border-b border-[#ddd8cc] pb-5"><div><p className="eyebrow">MES PUBLICATIONS</p><h2 className="mt-2 font-display text-3xl tracking-[-.05em]">Mes annonces</h2></div><span className="text-xs text-[#7d776c]">{listings?.length ?? 0} annonce{(listings?.length ?? 0) > 1 ? "s" : ""}</span></div>{listingsError ? <div className="mt-6 rounded-2xl border border-dashed border-[#dad5c8] bg-[#f5f2ea] p-8 text-center"><p className="text-sm text-[#716c62]">Vos annonces ne peuvent pas être chargées pour le moment.</p><Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-full">Réessayer</Button></div> : listings?.length ? <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-6">{listings.map((listing) => <ListingCard key={listing.id} listing={{ ...listing, sellerUsername: profile?.username || null, sellerPhotoUrl: profile?.photoUrl || null, sellerBio: profile?.bio || null } as Listing} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-[#dad5c8] bg-[#f5f2ea] p-8 text-center"><p className="font-display text-2xl tracking-[-.04em]">Votre vitrine est encore vide.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#716c62]">Les annonces que vous publierez apparaîtront ici, sans aucun contenu prérempli.</p><Link href="/publier"><Button variant="outline" className="mt-5 rounded-full border-[#b9bcae]"><Plus className="mr-2 size-4" />Publier une annonce</Button></Link></div>}</section>
  </main></div>;
}
