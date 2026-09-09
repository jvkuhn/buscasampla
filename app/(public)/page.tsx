export { default } from "@/components/public/HomePageContent";

// ISR em vez de force-dynamic: a home era renderizada a cada visita (inclusive de
// bot) e acordava o Neon. 5 min de cache basta pra vitrine.
export const revalidate = 300;
