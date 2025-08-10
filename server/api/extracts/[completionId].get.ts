import { getFromTela } from '~/server/utils/tela'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { Bank } from '~/types'
import { savePasswordForBank, getPendingPassword, removePendingPassword } from '~/server/utils/passwords'

async function ensureBankExists(bankName: string): Promise<Bank> {
    const banksPath = join(process.cwd(), 'storage', 'banks.json')

    // Read existing banks
    let banks: Bank[] = []
    try {
        const data = await fs.readFile(banksPath, 'utf-8')
        banks = JSON.parse(data)
    }
    catch {
        // File doesn't exist, start with empty array
        banks = []
    }

    // Check if bank already exists
    const existingBank = banks.find(bank =>
        bank.name.toLowerCase() === bankName.toLowerCase(),
    )

    if (existingBank) {
        return existingBank
    }

    // Create new bank
    const newBank: Bank = {
        id: crypto.randomUUID(),
        name: bankName,
        createdAt: new Date(),
    }

    banks.push(newBank)

    // Save banks
    await fs.writeFile(banksPath, JSON.stringify(banks, null, 2))

    console.log(`[INFO] Auto-added new bank: ${bankName}`)
    return newBank
}

export default defineEventHandler(async (event) => {
    try {
        const completionId = event.context.params?.completionId as string

        if (!completionId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Completion ID is required.',
            })
        }

        let result: any = null
        let attempts = 0
        const maxAttempts = 30 // 30 attempts with 2-second intervals = 1 minute max

        while (attempts < maxAttempts && !result) {
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

            try {
                const response = await getFromTela(completionId)
                console.log(`Polling attempt ${attempts + 1}: Status = ${response?.status}`)

                if (response && response.status === 'succeeded') {
                    // Success status - extract the result
                    const extractResult = response.outputContent?.content || response.outputContent || response.data || response

                    // If the result contains a bank name, ensure it exists in our banks list
                    if (extractResult && extractResult.banco) {
                        await ensureBankExists(extractResult.banco)

                        // Check if there's a pending password for this completion and save it
                        const pendingPassword = getPendingPassword(completionId)
                        if (pendingPassword) {
                            await savePasswordForBank(extractResult.banco, pendingPassword)
                            removePendingPassword(completionId)
                        }
                    }

                    result = extractResult
                    break
                }
                else if (response && response.status === 'failed') {
                    throw createError({
                        statusCode: 422,
                        statusMessage: 'Extract processing failed - the document could not be processed by Tela API',
                        data: response,
                    })
                }
                else if (response && (response.status === 'created' || response.status === 'running')) {
                    // Still processing - continue polling
                    console.log(`Extract still processing (${response.status}), continuing to poll...`)
                }
                else {
                    // Unexpected status or response format
                    console.warn('Unexpected Tela response format:', response)
                }
            }
            catch (pollError) {
                console.warn(`Polling attempt ${attempts + 1} failed:`, pollError.message || pollError)

                // If it's a known error (like failed processing), re-throw immediately
                if (pollError.statusCode === 422) {
                    throw pollError
                }

                // For other errors, continue polling unless it's the last attempt
                if (attempts >= maxAttempts - 1) {
                    throw createError({
                        statusCode: 500,
                        statusMessage: 'Failed to poll extract result after multiple attempts',
                        data: pollError,
                    })
                }
            }

            attempts++
        }

        if (!result) {
            throw new Error('Extract processing timeout - please try again')
        }

        return result
    }
    catch (error) {
        console.error('Error getting extract result:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to get extract result.',
        })
    }
})
