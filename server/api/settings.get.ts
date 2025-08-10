import { promises as fs } from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
    try {
        const filePath = path.join(process.cwd(), 'storage', 'settings.json')
        const data = await fs.readFile(filePath, 'utf-8')
        return JSON.parse(data)
    }
    catch (error) {
        console.error('Error reading settings:', error)
        // Return default settings if file doesn't exist
        return { primaryPersonId: null }
    }
})
