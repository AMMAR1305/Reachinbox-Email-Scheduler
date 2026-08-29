import { prisma } from './backend/src/db/prisma';

async function checkJobs() {
  const jobs = await prisma.emailJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log(JSON.stringify(jobs, null, 2));
  process.exit(0);
}

checkJobs().catch((err) => {
  console.error(err);
  process.exit(1);
});
