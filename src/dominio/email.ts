export function normalizarEmail(valor: string): string {
  return valor.trim().toLowerCase();
}

export function emailValido(valor: string): boolean {
  const email = normalizarEmail(valor);
  // Validación práctica: algo@algo.algo, sin espacios.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
