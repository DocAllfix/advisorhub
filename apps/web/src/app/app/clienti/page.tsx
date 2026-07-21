import { listClienti } from "@/lib/clienti/queries";

import { Portafoglio } from "./portafoglio";

export default async function ClientiPage() {
  const clienti = await listClienti();
  return <Portafoglio clienti={clienti} />;
}
