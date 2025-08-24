import type { Person } from '~/types'

export function usePersonHelpers() {
  function getPersonByCard(finalCartao?: string): Person | null {
    if (!finalCartao || finalCartao === 'N/A') return null
    
    const { people, cards } = useFinanceStore()
    const card = cards.value.find(c => c.finalCartao === finalCartao)
    if (card) {
      return people.value.find(p => p.id === card.holderId) || null
    }
    return null
  }

  function getPersonName(finalCartao?: string): string | null {
    const person = getPersonByCard(finalCartao)
    return person ? person.name : null
  }

  return {
    getPersonByCard,
    getPersonName
  }
}