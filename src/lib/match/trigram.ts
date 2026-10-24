// pg_trgm-style trigram similarity: lowercase, split into words, pad each word with
// spaces, collect the set of 3-grams, and return the Jaccard-like ratio of the sets.
// Padding follows PRD Lampiran F.2 / pg_trgm: two spaces in front, one behind.

function kumpulkanGram(teks: string): Set<string> {
  const gram = new Set<string>();
  const kataKata = teks
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  for (const kata of kataKata) {
    const pad = `  ${kata} `;
    for (let i = 0; i + 3 <= pad.length; i++) {
      gram.add(pad.slice(i, i + 3));
    }
  }
  return gram;
}

export function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const gramA = kumpulkanGram(a);
  const gramB = kumpulkanGram(b);
  if (gramA.size === 0 || gramB.size === 0) return 0;
  let irisan = 0;
  for (const g of gramA) {
    if (gramB.has(g)) irisan += 1;
  }
  return irisan / (gramA.size + gramB.size - irisan);
}
