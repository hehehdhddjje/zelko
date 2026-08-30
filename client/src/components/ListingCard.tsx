import { formatPrice, Listing } from "@/lib/marketplace";
import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/annonces/${listing.id}`} className="listing-card group" aria-label={`Voir l’annonce ${listing.name}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ebe7dd]">
        <img src={listing.imageUrl} alt={listing.name} className="size-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        <span className="absolute left-3 top-3 rounded-full bg-[#faf8f3]/90 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#2a2b28] backdrop-blur">{listing.category}</span>
        <span className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-[#1a1b18] text-white opacity-0 transition duration-200 group-hover:opacity-100"><ArrowUpRight className="size-4" /></span>
      </div>
      <div className="flex items-start justify-between gap-4 px-1 pb-1 pt-3">
        <div className="min-w-0"><p className="truncate font-medium tracking-[-0.015em] text-[#242521]">{listing.name}</p><p className="mt-1 text-xs text-[#777267]">par {listing.sellerUsername || "Membre Zelko"}</p></div>
        <p className="shrink-0 font-semibold tracking-[-0.025em] text-[#242521]">{formatPrice(listing.priceCents, listing.currency)}</p>
      </div>
    </Link>
  );
}
