// Standalone test for IMDB scraping logic
// Run with: node imdb-scraper-test.mjs
//
// Expected:
//   image: https://m.media-amazon.com/images/M/MV5BMzAwNDIzMzEtZDZkNC00ZDQ4LTk3ZDMtZjVhMTU2YzgzZTZiXkEyXkFqcGc@._V1_QL75_UX190_CR0,0,190,281_.jpg
//   description: Una ex cantante de pop que ahora es actriz es acosada por un fan obsesionado y un fantasma de su pasado.

const URL = 'https://www.imdb.com/es/title/tt0156887/';

const res = await fetch(URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
});

console.log('HTTP status:', res.status);
const html = await res.text();
console.log('HTML length:', html.length);

// ── Poster image ─────────────────────────────────────────────────────────────
console.log('\n--- IMAGE ---');

const posterBlock = html.match(/data-testid="hero-media__poster"[\s\S]*?<img[^>]+class="ipc-image"[^>]+>/)?.[0] ?? '';
console.log('posterBlock found:', posterBlock.length > 0);

const image = posterBlock.match(/src="([^"]+)"/)?.[1] ?? null;
console.log('image:', image);

// Also try without class constraint in case class order differs
const posterBlock2 = html.match(/data-testid="hero-media__poster"[\s\S]*?<img[^>]+>/)?.[0] ?? '';
const image2 = posterBlock2.match(/src="([^"]+)"/)?.[1] ?? null;
console.log('image (loose):', image2);

// ── Description ──────────────────────────────────────────────────────────────
console.log('\n--- DESCRIPTION ---');

const plotBlock = html.match(/data-testid="plot"[\s\S]*?<\/p>/)?.[0] ?? '';
console.log('plotBlock found:', plotBlock.length > 0);
if (plotBlock) console.log('plotBlock snippet:', plotBlock.slice(0, 300));

let description = null;
for (const slot of ['plot-xl', 'plot-l', 'plot-xs_to_m']) {
  const match = plotBlock.match(new RegExp(`data-testid="${slot}"[^>]*>[\\s\\S]*?<span[^>]*><span[^>]*><span[^>]*>([^<]+)<\\/span>`))?.[1];
  console.log(`  slot "${slot}" match:`, match ?? 'null');
  if (match) { description = match.trim(); break; }
}
console.log('description:', description);

// Broader fallback: any text inside the plot block
console.log('\n--- FALLBACK: all text in plotBlock ---');
const allText = plotBlock.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
console.log(allText.slice(0, 300));
