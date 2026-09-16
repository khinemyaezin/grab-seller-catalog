export function generateSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}
