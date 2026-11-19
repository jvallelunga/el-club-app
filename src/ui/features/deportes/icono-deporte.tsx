import {
  Bike,
  Dumbbell,
  Footprints,
  Goal,
  HandFist,
  HockeyStick,
  Kayak,
  Mountain,
  RugbyBall,
  Sailboat,
  SportShoe,
  Swords,
  Target,
  Trophy,
  Volleyball,
  WavesLadder,
  type LucideIcon,
} from "lucide-react";
import type { ClaveIconoDeporte } from "@/dominio/deportes";

/** El ícono de lucide de cada clave del set (ICONOS_DEPORTE en dominio). */
const ICONOS: Record<ClaveIconoDeporte, LucideIcon> = {
  rugby: RugbyBall,
  hockey: HockeyStick,
  futbol: Goal,
  voley: Volleyball,
  natacion: WavesLadder,
  atletismo: Footprints,
  running: SportShoe,
  ciclismo: Bike,
  remo: Kayak,
  vela: Sailboat,
  montania: Mountain,
  gimnasio: Dumbbell,
  tiro: Target,
  esgrima: Swords,
  boxeo: HandFist,
  trofeo: Trophy,
};

export function IconoDeporte({
  clave,
  className,
}: {
  clave: ClaveIconoDeporte;
  className?: string;
}) {
  const Icono = ICONOS[clave];
  return <Icono className={className} aria-hidden />;
}
