// Sport-to-image mapping for luxury league cards
// Using Unsplash images with a warm, editorial aesthetic

const SPORT_IMAGES: Record<string, string[]> = {
  badminton: [
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1613918431703-aa50889e3be4?auto=format&fit=crop&w=800&q=80",
  ],
  football: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=800&q=80",
  ],
  tennis: [
    "https://images.unsplash.com/photo-1595435064212-362637873301?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
  ],
  cricket: [
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=800&q=80",
  ],
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1461896836934-bd45ba8fcb67?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
];

export function getSportImage(sportName: string, index: number = 0): string {
  const key = sportName.toLowerCase();
  const images = SPORT_IMAGES[key] || FALLBACK_IMAGES;
  return images[index % images.length];
}
