import { listClienti, listClientiArchiviati } from "@/lib/clienti/queries";

import { Portafoglio } from "./portafoglio";

export default async function ClientiPage() {
  const [clienti, archiviati] = await Promise.all([listClienti(), listClientiArchiviati()]);
  return <Portafoglio clienti={clienti} archiviati={archiviati} />;
}
