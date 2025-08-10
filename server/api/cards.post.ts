import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Card, Person, Bank } from '~/types'

export default defineEventHandler(async (event) => {
    try {
        const { name, holderId, bankId, finalCartao } = await readBody(event)

        if (!name || typeof name !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Card name is required',
            })
        }

        if (!holderId || typeof holderId !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Holder ID is required',
            })
        }

        if (!bankId || typeof bankId !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bank ID is required',
            })
        }

        if (!finalCartao || typeof finalCartao !== 'string') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Final card digits are required',
            })
        }

        // Verify holder exists
        const peopleFilePath = path.join(process.cwd(), 'storage', 'people.json')
        try {
            const peopleData = await fs.readFile(peopleFilePath, 'utf-8')
            const people: Person[] = JSON.parse(peopleData)
            const holderExists = people.some(person => person.id === holderId)

            if (!holderExists) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Holder not found',
                })
            }
        }
        catch (error) {
            if (error.statusCode)
                throw error
            throw createError({
                statusCode: 400,
                statusMessage: 'Holder not found',
            })
        }

        // Verify bank exists
        const banksFilePath = path.join(process.cwd(), 'storage', 'banks.json')
        try {
            const banksData = await fs.readFile(banksFilePath, 'utf-8')
            const banks: Bank[] = JSON.parse(banksData)
            const bankExists = banks.some(bank => bank.id === bankId)

            if (!bankExists) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Bank not found',
                })
            }
        }
        catch (error) {
            if (error.statusCode)
                throw error
            throw createError({
                statusCode: 400,
                statusMessage: 'Bank not found',
            })
        }

        const filePath = path.join(process.cwd(), 'storage', 'cards.json')

        // Read existing cards
        let cards: Card[] = []
        try {
            const data = await fs.readFile(filePath, 'utf-8')
            cards = JSON.parse(data)
        }
        catch (error) {
            // File doesn't exist yet, start with empty array
        }

        // Check if card with same bankId and finalCartao already exists
        const existingCard = cards.find(card =>
            card.bankId === bankId && card.finalCartao === finalCartao,
        )

        if (existingCard) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Card with this bank and final digits already exists',
            })
        }

        // Create new card
        const newCard: Card = {
            id: crypto.randomUUID(),
            name: name.trim(),
            holderId,
            bankId,
            finalCartao,
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        cards.push(newCard)

        // Save to file
        await fs.writeFile(filePath, JSON.stringify(cards, null, 2))

        return newCard
    }
    catch (error) {
        console.error('Error creating card:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create card',
        })
    }
})
