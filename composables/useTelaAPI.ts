import type { ExtractResult } from '~/types'

type UploadResponse =
    | { status: 'success'; completionId: string; message: string }
    | { status: 'password_required'; message: string; requiresPassword: boolean }

export function useTelaAPI() {
    const uploadPdfToServer = async (file: File, registeredBanks: string[], password?: string): Promise<UploadResponse> => {
        const formData = new FormData()
        formData.append('pdf', file)
        formData.append('registeredBanks', JSON.stringify(registeredBanks))

        if (password) {
            formData.append('password', password)
        }

        return $fetch('/api/process-pdf', {
            method: 'POST',
            body: formData,
        })
    }

    const pollExtractResult = async (completionId: string): Promise<ExtractResult> => {
        return $fetch(`/api/extracts/${completionId}`)
    }

    return {
        uploadPdfToServer,
        pollExtractResult,
    }
}
