import type { Papan } from "./match/types";

// TODO (task T-03): implement with the vision provider chosen by the PM. The provider
// key lives in MODEL_API_KEY (server env only — never NEXT_PUBLIC_*).
export async function extractPapan(image: Buffer): Promise<Papan> {
  void image;
  throw new Error("not implemented");
}
