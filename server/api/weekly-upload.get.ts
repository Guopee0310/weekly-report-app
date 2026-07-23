import { z } from 'zod'

const querySchema = z.object({
  weekStart: z.string().min(1),
  weekEnd: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)

  const upload = await prisma.weeklyUpload.findUnique({
    where: {
      weekStart_weekEnd: {
        weekStart: new Date(query.weekStart),
        weekEnd: new Date(query.weekEnd),
      },
    },
  })

  if (!upload) return null

  return {
    fileName: upload.fileName,
    rawText: upload.rawText,
    createdAt: upload.createdAt,
  }
})
