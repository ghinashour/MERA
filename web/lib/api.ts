export const API = process.env.NEXT_PUBLIC_API || 'http://localhost:3000/api';
export type Product = { id: string; title: string; slug: string; description?: string; priceCents: number; images?: string[]; stock: number };
export async function getProducts(q?: string): Promise<Product[]> {
  const term = (q || '').trim().toLowerCase();
  try {
    const r = await fetch(`${API}/products${term ? `?q=${encodeURIComponent(term)}` : ''}`, { cache: 'no-store' });
    if (!r.ok) throw 0;
    const list: Product[] = await r.json();
    if (!Array.isArray(list)) throw 0;
    // Backend already filters, but double-guard so UI never shows unfiltered results
    if (!term) return list;
    return list.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.slug?.toLowerCase().includes(term),
    );
  } catch {
    if (!term) return fallbackProducts;
    return fallbackProducts.filter(
      (p) =>
        p.title?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.slug?.toLowerCase().includes(term),
    );
  }
}
// Fetch one product by slug. Returns null (no throw) when missing so pages can
// render a "not found + related items" state instead of crashing on r.json().
export async function getProduct(slug: string): Promise<Product | null> {
  const s = (slug || '').trim();
  if (!s) return null;
  try {
    const r = await fetch(`${API}/products/${encodeURIComponent(s)}`, { cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw 0;
    const text = await r.text();
    if (!text) return null; // legacy empty-200 body for missing products
    const j = JSON.parse(text);
    if (!j || typeof j !== 'object' || !j.id) return null;
    return j as Product;
  } catch {
    // Offline/API-down: resolve well-known slugs from the local fallback set
    // so search results stay clickable even without a backend.
    const hit = fallbackProducts.find((p) => p.slug === s);
    return hit || null;
  }
}
export function imgFor(p: Product, i = 0): string {
  if (p.images?.[i]) {
    const u = p.images[i];
    if (u.startsWith('/public/')) return u.replace('/public/', '/');
    return u;
  }
  return '/hero-home.png';
}
export function money(cents: number, cur = 'USD') { return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: cur }); }
// WhatsApp click-to-chat: set NEXT_PUBLIC_WHATSAPP=96170123456 (no +, no spaces)
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '96181580436';
export function waLink(text: string): string {
  const msg = encodeURIComponent(text);
  return WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${msg}` : `https://wa.me/?text=${msg}`;
}
const fallbackProducts: Product[] = [
  { id: 'p1', title: 'Linen Journal', slug: 'linen-journal', priceCents: 2800, images: ['/product-journal.png'], stock: 100 },
  { id: 'p2', title: 'Stoneware Mug', slug: 'stoneware-mug', priceCents: 2400, images: ['/product-mug.png'], stock: 100 },
  { id: 'p3', title: 'Silk Scarf', slug: 'silk-scarf', priceCents: 6800, images: ['/product-scarf.png'], stock: 100 },
  { id: 'p4', title: 'Scented Candle', slug: 'scented-candle', priceCents: 3600, images: ['/product-candle.png'], stock: 100 },
];
export function sid(): string {
  if (typeof window === 'undefined') return 'anon';
  let s = localStorage.getItem('mera-sid');
  if (!s) { s = Math.random().toString(36).slice(2); localStorage.setItem('mera-sid', s); }
  return s;
}
