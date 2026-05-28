// ============================================================
// Converte um nome em slug URL-amigável
// Ex: "Restaurante do João & Maria" → "restaurante-do-joao-maria"
// ============================================================
export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')                        // separa caracteres acentuados
    .replace(/[̀-ͯ]/g, '')         // remove os diacríticos (acentos)
    .replace(/[^a-z0-9\s-]/g, '')           // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')                    // espaços viram hifens
    .replace(/-{2,}/g, '-')                  // hifens duplos viram um só
}

// ============================================================
// Verifica se um slug tem formato válido
// ============================================================
export function slugValido(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
