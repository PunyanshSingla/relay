import nspell from "nspell";

type NSpellInstance = ReturnType<typeof nspell>;

let spellcheckerPromise: NSpellInstance | null = null;

async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.arrayBuffer();
}

export async function getSpellchecker(): Promise<NSpellInstance> {
  if (!spellcheckerPromise) {
    const [affBuffer, dicBuffer] = await Promise.all([
      fetchArrayBuffer("/dictionary-en.aff"),
      fetchArrayBuffer("/dictionary-en.dic"),
    ]);

    spellcheckerPromise = nspell(
      Buffer.from(affBuffer),
      Buffer.from(dicBuffer),
    );
  }
  return spellcheckerPromise;
}

export async function isKnownWord(word: string): Promise<boolean> {
  if (!word || word.length < 2) return true;
  const sc = await getSpellchecker();
  return sc.correct(word.toLowerCase());
}

export async function getSuggestions(word: string): Promise<string[]> {
  if (!word) return [];
  const sc = await getSpellchecker();
  return sc.suggest(word.toLowerCase());
}
