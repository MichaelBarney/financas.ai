import { getPasswordsForBanks } from '~/server/utils/passwords'

export default defineEventHandler(async (event) => {
    try {
        const passwords = await getPasswordsForBanks()
        return passwords
    }
    catch (error) {
        console.error('Error getting passwords:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to get passwords',
        })
    }
})
