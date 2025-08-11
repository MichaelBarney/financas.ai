import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { ExtractResult, SavedExtract } from '~/types'

/**
 * Generate a hash for extract data based on transactions content
 * This helps identify duplicate extracts regardless of metadata
 */
export function generateExtractHash(extractData: ExtractResult): string {
    // Create a normalized representation of the transactions for hashing
    const normalizedTransactions = extractData.transacoes
        .map(transaction => ({
            data: transaction.data,
            tipo: transaction.tipo,
            valor: transaction.valor,
            descricao: transaction.descricao,
            cartao: transaction.cartao || null,
        }))
        .sort((a, b) => {
            // Sort by date first, then by value for consistent ordering
            const dateA = a.data
            const dateB = b.data
            if (dateA !== dateB)
                return dateA.localeCompare(dateB)
            return a.valor - b.valor
        })

    const hashContent = JSON.stringify({
        banco: extractData.banco,
        documento: extractData.documento,
        transacoes: normalizedTransactions,
    })

    return createHash('sha256').update(hashContent).digest('hex')
}

/**
 * Check if an extract with the same content hash already exists
 */
export async function checkForDuplicateExtract(
    bankId: string,
    extractData: ExtractResult,
): Promise<boolean> {
    try {
        const contentHash = generateExtractHash(extractData)
        const bankFiles = await findExtractFilesByBank(bankId)

        for (const filePath of bankFiles) {
            try {
                const fileData = await fs.readFile(filePath, 'utf-8')
                const extract: SavedExtract = JSON.parse(fileData)
                const existingHash = generateExtractHash(extract.data)

                if (existingHash === contentHash) {
                    console.warn(`[INFO] Duplicate extract detected. Existing file: ${filePath}`)
                    return true
                }
            }
            catch (error) {
                console.warn(`[WARN] Error reading extract file ${filePath}:`, error)
                // Continue checking other files
            }
        }

        return false
    }
    catch (error) {
        console.error('Error checking for duplicate extract:', error)
        // In case of error, allow the extract to be saved (fail-safe)
        return false
    }
}

/**
 * Find all extract files for a specific bank
 */
async function findExtractFilesByBank(bankId: string): Promise<string[]> {
    const files: string[] = []
    const extractionsDir = join(process.cwd(), 'storage', 'extractions')

    try {
        // Read all extraction files and filter by bankId
        const allFiles = await fs.readdir(extractionsDir)

        for (const file of allFiles) {
            if (!file.endsWith('.json'))
                continue

            const filePath = join(extractionsDir, file)
            const stat = await fs.stat(filePath)

            if (!stat.isFile())
                continue

            try {
                const fileData = await fs.readFile(filePath, 'utf-8')
                const extract: SavedExtract = JSON.parse(fileData)

                // Only include files that belong to the specified bank
                if (extract.bankId === bankId) {
                    files.push(filePath)
                }
            }
            catch (error) {
                console.warn(`[WARN] Error reading extract file ${filePath}:`, error)
                // Continue checking other files
            }
        }
    }
    catch (error) {
        // Extractions directory doesn't exist yet - this is normal for first upload
    }

    return files
}
