import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Person } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const { name, type } = await readBody(event)

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
        let people: Person[] = []
        try {
            const data = await fs.readFile(filePath, 'utf-8')
            people = JSON.parse(data)
        }
        catch (error) {
            // File doesn't exist yet, start with empty array
        }

        // Check if trying to create another Principal person
        if (type === 'Principal') {
            const existingPrincipal = people.find(person => person.type === 'Principal')
            if (existingPrincipal) {
                throw createError({
                    statusCode: 400,
                    statusMessage: `Já existe uma pessoa principal: ${existingPrincipal.name}. Apenas uma pessoa pode ser principal.`,
                })
            }
        }

        // Create new person
        const newPerson: Person = {
            id: crypto.randomUUID(),
            name: name.trim(),
            type,
            createdAt: new Date(),
        }

        people.push(newPerson)

        // Save to file
        await fs.writeFile(filePath, JSON.stringify(people, null, 2))

        return newPerson
    }
    catch (error) {
        console.error('Error creating person:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create person',
        })
    }
})
