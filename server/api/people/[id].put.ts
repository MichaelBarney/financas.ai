import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Person } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const personId = getRouterParam(event, 'id')
        const { name, type } = await readBody(event)

        if (!personId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Person ID is required',
            })
        }

        if (!name || typeof name !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Name is required',
            })
        }

        if (!type || !['Principal', 'Dependente', 'Externo'].includes(type)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Type must be Principal, Dependente, or Externo',
            })
        }

        const filePath = path.join(process.cwd(), 'storage', 'people.json')

        // Read existing people
        const data = await fs.readFile(filePath, 'utf-8')
        const people: Person[] = JSON.parse(data)

        // Find person to update
        const personIndex = people.findIndex(person => person.id === personId)
        if (personIndex === -1) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Person not found',
            })
        }

        const currentPerson = people[personIndex]

        // Check if trying to change to Principal when another Principal exists
        if (type === 'Principal' && currentPerson.type !== 'Principal') {
            const existingPrincipal = people.find(person => person.type === 'Principal' && person.id !== personId)
            if (existingPrincipal) {
                throw createError({
                    statusCode: 400,
                    statusMessage: `Já existe uma pessoa principal: ${existingPrincipal.name}. Apenas uma pessoa pode ser principal.`,
                })
            }
        }

        // Update person
        people[personIndex] = {
            ...currentPerson,
            name: name.trim(),
            type,
        }

        // Save to file
        await fs.writeFile(filePath, JSON.stringify(people, null, 2))

        return people[personIndex]
    }
    catch (error) {
        console.error('Error updating person:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to update person',
        })
    }
})
