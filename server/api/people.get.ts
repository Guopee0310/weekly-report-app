export default defineEventHandler(async () => {
  const people = await prisma.person.findMany({ orderBy: { createdAt: 'asc' } })
  return people.map((p) => ({
    name: p.name,
    title: p.title,
    filenameLabel: p.filenameLabel,
    department: p.department,
  }))
})
