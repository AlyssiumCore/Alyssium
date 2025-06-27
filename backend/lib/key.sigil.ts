export function generateSigil(id: string): string {
  return id
    .split("")
    .reverse()
    .map((char, i) => char.charCodeAt(0) + i)
    .join("-")
}