import { createTelaClient } from '@meistrari/tela-sdk-js'
import type { TelaSDK } from '@meistrari/tela-sdk-js'
import { Buffer } from 'node:buffer'

let tela: TelaSDK

function getTelaClient() {
    if (!tela) {
        const config = useRuntimeConfig()
        
        if (!config.public.telaApiKey) {
            throw new Error('TELA_API_KEY environment variable is required')
        }
        
        tela = createTelaClient({
            apiKey: config.public.telaApiKey,
        })
    }
    return tela
}

async function replaceFilePathsWithDataUrls(variables: Record<string, any>): Promise<Record<string, any>> {
    const newVars = { ...variables }
    for (const key in newVars) {
        if (Object.prototype.hasOwnProperty.call(newVars, key)) {
            const value = newVars[key]
            if (typeof value === 'object' && value !== null && 'file_url' in value && typeof value.file_url === 'string' && !value.file_url.startsWith('data:')) {
                const fileContent = await useStorage().getItem(value.file_url)
                if (fileContent) {
                    const base64 = Buffer.from(fileContent as string, 'binary').toString('base64')
                    newVars[key].file_url = `data:application/octet-stream;base64,${base64}`
                }
            }
            else if (typeof value === 'object' && value !== null) {
                newVars[key] = await replaceFilePathsWithDataUrls(value)
            }
        }
    }
    return newVars
}

export async function postToTela(canvasId: string, variables: Record<string, any>, isAsync: boolean = false) {
    const client = getTelaClient()
    const processedVariables = await replaceFilePathsWithDataUrls(variables)

    // Log whether we're sending a data URL or file path
    if (processedVariables.fatura?.file_url) {
        const isDataUrl = processedVariables.fatura.file_url.startsWith('data:')
        console.log(`[INFO] Sending ${isDataUrl ? 'data URL' : 'file path'} to Tela API`)
        if (isDataUrl) {
            const urlPrefix = processedVariables.fatura.file_url.substring(0, 50)
            console.log(`[INFO] Data URL prefix: ${urlPrefix}...`)
        }
    }

    const data = await client.completions.create({
        canvasId,
        variables: processedVariables,
        async: isAsync,
    } as any)

    return data
}

export async function getFromTela(completionId: string) {
    const config = useRuntimeConfig()
    const apiKey = config.public.telaApiKey
    
    if (!apiKey) {
        throw new Error('TELA_API_KEY environment variable is required')
    }

    const url = `https://api.tela.com/v2/chat/completions/${completionId}`
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    }

    try {
        const response = await fetch(url, options)

        if (!response.ok) {
            throw new Error(`Tela API request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Log the response for debugging (but don't log the full content for security)
        console.log('Tela API response:', {
            id: data.id,
            status: data.status,
            hasOutputContent: !!data.outputContent,
            creditsUsed: data.creditsUsed,
            updatedAt: data.updatedAt,
        })

        return data
    }
    catch (error) {
        console.error('Error fetching from Tela API:', error)
        throw error
    }
}
