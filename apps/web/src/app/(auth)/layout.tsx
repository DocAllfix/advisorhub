/**
 * Prima impressione dello studio: qui vale il respiro della scena, non la
 * densità delle schermate di lavoro. Nessun pannello promozionale di fianco al
 * form: la sobrietà è parte del posizionamento.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-14">
      <div className="w-full max-w-[26rem]">
        <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-primary">
          FinBeacon
        </p>
        <div className="mt-9">{children}</div>
        <p className="mt-12 border-t border-hairline pt-5 text-xs leading-relaxed text-muted-foreground">
          Monitoraggio continuo della salute economico-finanziaria del portafoglio clienti dello
          studio: indicatori, soglie di allerta e report da consegnare.
        </p>
      </div>
    </main>
  );
}
