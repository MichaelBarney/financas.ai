import { promises as fs } from 'fs'
import path from 'path'
import type { Person } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const filePath = path.join(process.cwd(), 'storage', 'people.json')
    const data = await fs.readFile(filePath, 'utf-8')
    const people: Person[] = JSON.parse(data)
    
    // Ensure dates are properly formatted
    return people.map(person => ({
      ...person,
      createdAt: new Date(person.createdAt)
    }))
  } catch (error) {
    console.error('Error reading people:', error)
    return []
  }
})
