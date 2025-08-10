import { promises as fs } from 'node:fs'
import { join } from 'node:path'

interface StoredPasswords {
    [bankName: string]: string
}

interface PendingPassword {
    [completionId: string]: string
}

// Temporary in-memory storage for passwords waiting for bank detection
const pendingPasswords: PendingPassword = {}

export async function savePasswordForBank(bankName: string, password: string): Promise<void> {
    try {
        const passwordsPath = join(process.cwd(), 'storage', 'passwords.json')

        // Read existing passwords
        let passwords: StoredPasswords = {}
        try {
            const data = await fs.readFile(passwordsPath, 'utf-8')
            passwords = JSON.parse(data)
        }
        catch {
            // File doesn't exist, start with empty object
            passwords = {}
        }

        // Update password for this bank
        passwords[bankName] = password

        // Save passwords
        await fs.writeFile(passwordsPath, JSON.stringify(passwords, null, 2))

        console.log(`[INFO] Saved password for bank: ${bankName}`)
    }
    catch (error) {
        console.error('Error saving password:', error)
        // Don't throw error to avoid breaking the main flow
    }
}

export async function getPasswordsForBanks(): Promise<StoredPasswords> {
    try {
        const passwordsPath = join(process.cwd(), 'storage', 'passwords.json')

        const data = await fs.readFile(passwordsPath, 'utf-8')
        return JSON.parse(data)
    }
    catch {
        // File doesn't exist or error reading, return empty object
        return {}
    }
}

export async function getPasswordForBank(bankName: string): Promise<string | null> {
    const passwords = await getPasswordsForBanks()
    return passwords[bankName] || null
}

export function storePendingPassword(completionId: string, password: string): void {
    pendingPasswords[completionId] = password
    console.log(`[INFO] Stored pending password for completion ID: ${completionId}`)
}

export function getPendingPassword(completionId: string): string | null {
    return pendingPasswords[completionId] || null
}

export function removePendingPassword(completionId: string): void {
    delete pendingPasswords[completionId]
}
