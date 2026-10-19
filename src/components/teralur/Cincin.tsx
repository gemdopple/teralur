import type { Cincin as DataCincin } from "@/lib/cincin";

export type CincinProps = {
  data: DataCincin;
  className?: string;
};

// TODO: render the progress ring — an SVG arc driven by data.isian, with
// berjalan/total shown in JetBrains Mono, colored by data.keadaan.
export function Cincin({ data, className }: CincinProps) {
  return <div className={className} data-keadaan={data.keadaan} />;
}
