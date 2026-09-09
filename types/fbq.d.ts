// fbq e injetado pelo snippet inline do Meta Pixel, entao nao existe em tempo de
// compilacao. Opcional porque a pagina precisa funcionar se o pixel for
// bloqueado por adblock — que e o caso de uma fatia real do trafego.
interface Window {
  fbq?: (...args: unknown[]) => void;
}
