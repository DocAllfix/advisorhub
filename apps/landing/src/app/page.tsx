import { DatiStrutturati } from "@/components/dati-strutturati";
import { Hero, Intestazione, Prospetto } from "@/components/sezioni/apertura";
import { Chiusura, Piede } from "@/components/sezioni/chiusura";
import { Domande, Metodo, Riservatezza, SezioneAnteprima } from "@/components/sezioni/fiducia";
import { Passi } from "@/components/sezioni/passi";
import { Funzioni, Report } from "@/components/sezioni/prodotto";
import { schemaHome } from "@/lib/schema";

export default function Home() {
  return (
    <>
      <DatiStrutturati dati={schemaHome()} />
      <Intestazione />
      <main id="contenuto">
        <Hero />
        <Prospetto />
        <Passi />
        <Funzioni />
        <Report />
        <SezioneAnteprima />
        <Metodo />
        <Riservatezza />
        <Domande />
        <Chiusura />
      </main>
      <Piede />
    </>
  );
}
