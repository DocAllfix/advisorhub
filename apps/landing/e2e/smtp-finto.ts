import { createServer as creaHttp, type Server as ServerHttp } from "node:http";
import { createServer as creaTcp, type Server as ServerTcp, type Socket } from "node:net";

/**
 * Un ricevitore SMTP minimo per i test: accetta la conversazione di un client
 * (EHLO, MAIL, RCPT, DATA), tiene i messaggi in memoria e li espone in JSON su
 * HTTP. Serve a provare che il modulo della landing SPEDISCE DAVVERO, senza
 * Docker e senza dipendenze.
 *
 * Non offre STARTTLS, come Mailpit: il modulo non lo chiede verso un host
 * locale (GUASTI G-23).
 */
export const PORTA_SMTP = 2526;
export const PORTA_HTTP = 2527;

export interface Messaggio {
  da: string;
  a: string[];
  grezzo: string;
}

export function avviaSmtpFinto(): Promise<{ chiudi: () => Promise<void> }> {
  const ricevuti: Messaggio[] = [];

  const smtp: ServerTcp = creaTcp((socket: Socket) => {
    let corrente: Messaggio = { da: "", a: [], grezzo: "" };
    let inDati = false;
    let buffer = "";
    const rispondi = (riga: string) => socket.write(`${riga}\r\n`);
    rispondi("220 smtp-finto pronto");

    socket.on("data", (pezzo) => {
      buffer += pezzo.toString("utf8");
      let fine: number;
      while ((fine = buffer.indexOf("\r\n")) !== -1) {
        const riga = buffer.slice(0, fine);
        buffer = buffer.slice(fine + 2);
        if (inDati) {
          if (riga === ".") {
            inDati = false;
            ricevuti.push(corrente);
            corrente = { da: "", a: [], grezzo: "" };
            rispondi("250 messaggio accettato");
          } else {
            corrente.grezzo += `${riga.startsWith("..") ? riga.slice(1) : riga}\n`;
          }
          continue;
        }
        const comando = riga.slice(0, 4).toUpperCase();
        if (comando === "EHLO" || comando === "HELO") rispondi("250 smtp-finto");
        else if (comando === "MAIL") {
          corrente.da = riga.replace(/^MAIL FROM:\s*/i, "");
          rispondi("250 ok");
        } else if (comando === "RCPT") {
          corrente.a.push(riga.replace(/^RCPT TO:\s*/i, ""));
          rispondi("250 ok");
        } else if (comando === "DATA") {
          inDati = true;
          rispondi("354 termina con <CRLF>.<CRLF>");
        } else if (comando === "QUIT") {
          rispondi("221 ciao");
          socket.end();
        } else rispondi("250 ok");
      }
    });
    socket.on("error", () => {});
  });

  const http: ServerHttp = creaHttp((req, res) => {
    if (req.method === "DELETE") ricevuti.length = 0;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(ricevuti));
  });

  return new Promise((pronto) => {
    smtp.listen(PORTA_SMTP, "127.0.0.1", () => {
      http.listen(PORTA_HTTP, "127.0.0.1", () => {
        pronto({
          chiudi: () =>
            new Promise<void>((fatto) => {
              http.close(() => smtp.close(() => fatto()));
            }),
        });
      });
    });
  });
}
