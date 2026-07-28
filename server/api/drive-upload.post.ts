import { z } from 'zod'

const bodySchema = z.object({
  weekLabel: z.string().min(1),
  fileName: z.string().min(1),
  pdfBase64: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  const result = await $fetch<{ fileId: string; url: string; folderUrl: string }>(process.env.GAS_DRIVE_UPLOAD_URL!, {
    method: 'POST',
    body: { ...body, secret: process.env.GAS_SHARED_SECRET },
  })

  return result
})
