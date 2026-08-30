export type Listing = {
  id: number;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  createdAt: Date | string;
  sellerId: number;
  sellerUsername: string | null;
  sellerPhotoUrl: string | null;
  sellerBio: string | null;
};

export function formatPrice(priceCents: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(priceCents / 100);
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function initials(value?: string | null) {
  return (value?.trim().slice(0, 2) || "Z").toUpperCase();
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      reject(new Error("Choisissez une image PNG, JPEG ou WebP."));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      reject(new Error("L’image doit faire au maximum 4 Mo."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("La lecture de l’image a échoué."));
    reader.readAsDataURL(file);
  });
}
