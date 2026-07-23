import { z } from 'zod'

const bodySchema = z.object({
  weekStart: z.string().min(1),
  weekEnd: z.string().min(1),
  fileName: z.string().min(1),
  rawText: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)

  const weekStart = new Date(body.weekStart)
  const weekEnd = new Date(body.weekEnd)

  const upload = await prisma.weeklyUpload.upsert({
    where: { weekStart_weekEnd: { weekStart, weekEnd } },
    update: { fileName: body.fileName, rawText: body.rawText },
    create: { weekStart, weekEnd, fileName: body.fileName, rawText: body.rawText },
  })

  return { fileName: upload.fileName, createdAt: upload.createdAt }
})
