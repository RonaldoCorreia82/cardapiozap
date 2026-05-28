export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro'

export const FORMAS: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
  outro: 'Outro',
}

export const CORES: Record<FormaPagamento, string> = {
  dinheiro: 'bg-green-100 text-green-700',
  pix: 'bg-blue-100 text-blue-700',
  debito: 'bg-purple-100 text-purple-700',
  credito: 'bg-orange-100 text-orange-700',
  outro: 'bg-gray-100 text-gray-600',
}
