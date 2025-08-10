import { PassThrough } from 'node:stream'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { postToTela } from '~/server/utils/tela'
import { savePasswordForBank, storePendingPassword } from '~/server/utils/passwords'
import { info, decrypt } from 'node-qpdf2'

async function processExtractAsync(fileBase64: string, registeredBanks: string[], password?: string): Promise<{ id: string }> {
    try {
        const canvasId = '1f35b75d-7f16-426a-8a66-827b778d1877'

        const variables = {
            fatura: { file_url: fileBase64 },
            bancos: JSON.stringify(registeredBanks),
        }

        const data = await postToTela(canvasId, variables, true)
        console.warn('Tela API Async Response:', data)

        // Store password and completion ID for later use when processing completes
        if (password) {
            // We'll save the password after we know which bank was detected
            // This will be handled in the completion endpoint
            console.log('[INFO] Password will be saved when processing completes and bank is detected')
        }

        return data as { id: string }
    }
    catch (error) {
        console.error('Error processing extract async with Tela API:', error)
        throw error
    }
}

async function checkPdfEncryption(pdfPath: string): Promise<boolean> {
    try {
        const encryptionInfo = await info({ input: pdfPath })
        return encryptionInfo !== 'File is not encrypted'
    }
    catch (error) {
        console.error('Error checking PDF encryption:', error)
        return false
    }
}

async function decryptPdf(pdfPath: string, password: string): Promise<string> {
    try {
        const decryptedDir = join(process.cwd(), 'storage', 'decryptedPDFs')
        await fs.mkdir(decryptedDir, { recursive: true })

        const fileName = `decrypted-${Date.now()}.pdf`
        const decryptedPath = join(decryptedDir, fileName)

        await decrypt({
            input: pdfPath,
            output: decryptedPath,
            password,
        })

        console.log(`[INFO] PDF decrypted and saved at: ${decryptedPath}`)
        return decryptedPath
    }
    catch (error) {
        console.error('Error decrypting PDF:', error)
        throw new Error('Failed to decrypt PDF. Please check the password.')
    }
}

export default defineEventHandler(async (event) => {
    try {
        const multipart = await readMultipartFormData(event)

        const pdfFile = multipart?.find(item => item.name === 'pdf')
        const registeredBanksData = multipart?.find(item => item.name === 'registeredBanks')
        const password = multipart?.find(item => item.name === 'password')?.data?.toString()

        if (!pdfFile || !pdfFile.data || !registeredBanksData || !registeredBanksData.data) {
            throw createError({
                statusCode: 400,
                statusMessage: 'PDF file and registered banks are required.',
            })
        }

        const registeredBanks = JSON.parse(registeredBanksData.data.toString())

        // Save the PDF to a permanent file
        const pdfDir = join(process.cwd(), 'storage', 'pdf')
        await fs.mkdir(pdfDir, { recursive: true })
        const pdfFilePath = join(pdfDir, `upload-${Date.now()}.pdf`)
        await fs.writeFile(pdfFilePath, pdfFile.data)
        console.log(`[INFO] PDF saved at: ${pdfFilePath}`)

        // Check if PDF is encrypted
        const isEncrypted = await checkPdfEncryption(pdfFilePath)

        if (isEncrypted && !password) {
            // PDF is encrypted but no password provided
            return {
                status: 'password_required',
                message: 'This PDF is password protected. Please provide the password.',
                requiresPassword: true,
            }
        }

        let finalPdfPath = pdfFilePath

        if (isEncrypted && password) {
            try {
                // Decrypt the PDF
                finalPdfPath = await decryptPdf(pdfFilePath, password)
            }
            catch (error) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Invalid password or failed to decrypt PDF.',
                })
            }
        }

        // Convert file to base64
        const fileContent = await fs.readFile(finalPdfPath)
        const base64 = fileContent.toString('base64')
        const dataUrl = `data:application/pdf;base64,${base64}`

        console.log(`[INFO] Sending ${isEncrypted ? 'decrypted' : 'original'} PDF to Tela API`)
        console.log(`[INFO] File path being processed: ${finalPdfPath}`)

        // Start async processing with Tela API
        const asyncResponse = await processExtractAsync(dataUrl, registeredBanks, password)
        const completionId = asyncResponse.id

        // Store password for later use when bank is detected
        if (isEncrypted && password) {
            storePendingPassword(completionId, password)
        }

        return {
            status: 'success',
            message: 'PDF received and is being processed.',
            completionId,
        }
    }
    catch (error) {
        console.error('Error processing PDF:', error)
        if (error.statusCode) {
            throw error
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to process PDF.',
        })
    }
})
