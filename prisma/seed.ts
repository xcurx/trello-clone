import { PrismaClient } from "@prisma/client";
import { LABEL_COLORS } from "../lib/constants";

const prisma = new PrismaClient({});

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing data ──
  await prisma.comment.deleteMany();
  await prisma.cardMember.deleteMany();
  await prisma.cardLabel.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.label.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.member.deleteMany();

  // ── Create Members ──
  const alex = await prisma.member.create({
    data: {
      id: "default-user",
      name: "Alex Rivera",
      email: "alex@trello-clone.dev",
      avatarUrl: null,
    },
  });

  const sarah = await prisma.member.create({
    data: {
      name: "Sarah Chen",
      email: "sarah@trello-clone.dev",
      avatarUrl: null,
    },
  });

  const marcus = await prisma.member.create({
    data: {
      name: "Marcus Johnson",
      email: "marcus@trello-clone.dev",
      avatarUrl: null,
    },
  });

  console.log("  ✅ Created 3 members");

  // ── Create Board ──
  const board = await prisma.board.create({
    data: {
      title: "Q4 Brand Campaign",
      backgroundColor: "ocean",
    },
  });

  // ── Associate Members with Board ──
  await prisma.boardMember.createMany({
    data: [
      { boardId: board.id, memberId: alex.id, role: "OWNER" },
      { boardId: board.id, memberId: sarah.id, role: "MEMBER" },
      { boardId: board.id, memberId: marcus.id, role: "MEMBER" },
    ],
  });

  console.log("  ✅ Created board: Q4 Brand Campaign");

  // ── Create Labels ──
  const labelRecords = await Promise.all(
    LABEL_COLORS.slice(0, 6).map((lc) =>
      prisma.label.create({
        data: {
          boardId: board.id,
          title: lc.name,
          color: lc.color,
        },
      }),
    ),
  );
  const [greenLabel, yellowLabel, orangeLabel, redLabel, purpleLabel, blueLabel] =
    labelRecords;

  console.log("  ✅ Created 6 labels");

  // ── Create Lists ──
  const todoList = await prisma.list.create({
    data: { boardId: board.id, title: "To Do", position: 0 },
  });
  const inProgressList = await prisma.list.create({
    data: { boardId: board.id, title: "In Progress", position: 1 },
  });
  const inReviewList = await prisma.list.create({
    data: { boardId: board.id, title: "In Review", position: 2 },
  });
  const doneList = await prisma.list.create({
    data: { boardId: board.id, title: "Done", position: 3 },
  });

  console.log("  ✅ Created 4 lists");

  // ── Create Cards ──
  // --- To Do ---
  const card1 = await prisma.card.create({
    data: {
      listId: todoList.id,
      title: "Design system setup",
      description:
        "Set up the foundational design tokens including colors, typography, and spacing scale. Reference DESIGN.md for exact specifications.",
      position: 0,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      coverColor: "#0079bf",
    },
  });

  const card2 = await prisma.card.create({
    data: {
      listId: todoList.id,
      title: "API documentation",
      description: "Document all REST endpoints with request/response examples.",
      position: 1,
    },
  });

  const card3 = await prisma.card.create({
    data: {
      listId: todoList.id,
      title: "User research synthesis",
      description:
        "Compile findings from 12 user interviews into actionable insights document.",
      position: 2,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  // --- In Progress ---
  const card4 = await prisma.card.create({
    data: {
      listId: inProgressList.id,
      title: "Authentication flow",
      description:
        "Implement OAuth2 login flow with Google and GitHub providers. Include token refresh logic.",
      position: 0,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days overdue
    },
  });

  const card5 = await prisma.card.create({
    data: {
      listId: inProgressList.id,
      title: "Dashboard layout",
      description: "Build the main dashboard view with responsive grid system.",
      position: 1,
    },
  });

  // --- In Review ---
  const card6 = await prisma.card.create({
    data: {
      listId: inReviewList.id,
      title: "Database schema design",
      description:
        "PostgreSQL schema with proper indexing strategy and migration plan.",
      position: 0,
    },
  });

  const card7 = await prisma.card.create({
    data: {
      listId: inReviewList.id,
      title: "Landing page hero section",
      description: "Responsive hero with animated gradient background and CTA.",
      position: 1,
      dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      coverColor: "#c377e0",
    },
  });

  // --- Done ---
  const card8 = await prisma.card.create({
    data: {
      listId: doneList.id,
      title: "Project initialization",
      description:
        "Set up Next.js project with TypeScript, Tailwind CSS, Prisma, and Biome.",
      position: 0,
    },
  });

  console.log("  ✅ Created 8 cards");

  // ── Card Labels ──
  await prisma.cardLabel.createMany({
    data: [
      { cardId: card1.id, labelId: blueLabel.id },
      { cardId: card2.id, labelId: greenLabel.id },
      { cardId: card2.id, labelId: yellowLabel.id },
      { cardId: card3.id, labelId: purpleLabel.id },
      { cardId: card4.id, labelId: redLabel.id },
      { cardId: card5.id, labelId: greenLabel.id },
      { cardId: card6.id, labelId: yellowLabel.id },
      { cardId: card7.id, labelId: blueLabel.id },
      { cardId: card7.id, labelId: greenLabel.id },
      { cardId: card8.id, labelId: greenLabel.id },
    ],
  });

  // ── Card Members ──
  await prisma.cardMember.createMany({
    data: [
      { cardId: card1.id, memberId: alex.id },
      { cardId: card3.id, memberId: sarah.id },
      { cardId: card4.id, memberId: alex.id },
      { cardId: card4.id, memberId: marcus.id },
      { cardId: card5.id, memberId: sarah.id },
      { cardId: card6.id, memberId: marcus.id },
      { cardId: card7.id, memberId: alex.id },
      { cardId: card8.id, memberId: alex.id },
    ],
  });

  // ── Checklist Items ──
  await prisma.checklistItem.createMany({
    data: [
      // card2: API documentation checklist
      { cardId: card2.id, title: "Document boards API", isCompleted: true, position: 0 },
      { cardId: card2.id, title: "Document lists API", isCompleted: true, position: 1 },
      { cardId: card2.id, title: "Document cards API", isCompleted: false, position: 2 },
      { cardId: card2.id, title: "Document labels API", isCompleted: false, position: 3 },
      { cardId: card2.id, title: "Add example requests", isCompleted: false, position: 4 },
      // card5: Dashboard layout checklist
      { cardId: card5.id, title: "Header component", isCompleted: true, position: 0 },
      { cardId: card5.id, title: "Sidebar navigation", isCompleted: true, position: 1 },
      { cardId: card5.id, title: "Board grid layout", isCompleted: true, position: 2 },
      { cardId: card5.id, title: "Responsive breakpoints", isCompleted: false, position: 3 },
      // card8: Project init checklist (all done)
      { cardId: card8.id, title: "Initialize Next.js", isCompleted: true, position: 0 },
      { cardId: card8.id, title: "Configure TypeScript", isCompleted: true, position: 1 },
      { cardId: card8.id, title: "Set up Prisma", isCompleted: true, position: 2 },
      { cardId: card8.id, title: "Configure Biome", isCompleted: true, position: 3 },
      { cardId: card8.id, title: "Add Tailwind CSS", isCompleted: true, position: 4 },
    ],
  });

  // ── Comments ──
  await prisma.comment.createMany({
    data: [
      {
        cardId: card4.id,
        memberId: marcus.id,
        content:
          "The token refresh logic needs to handle edge cases when the user has multiple tabs open. I suggest using a broadcast channel to sync across tabs.",
      },
      {
        cardId: card4.id,
        memberId: alex.id,
        content:
          "Good point — I'll look into the BroadcastChannel API. We should also add a retry mechanism for failed refresh attempts.",
      },
      {
        cardId: card6.id,
        memberId: sarah.id,
        content:
          "The indexing strategy looks solid. One suggestion: add a composite index on (listId, position) for the cards table to optimize the kanban query.",
      },
    ],
  });

  console.log("  ✅ Created labels, members, checklists, and comments");

  // ── Create a second board ──
  const board2 = await prisma.board.create({
    data: {
      title: "Sprint Retrospective",
      backgroundColor: "lavender",
    },
  });

  await prisma.boardMember.create({
    data: { boardId: board2.id, memberId: alex.id, role: "OWNER" },
  });

  await Promise.all(
    LABEL_COLORS.slice(0, 6).map((lc) =>
      prisma.label.create({
        data: { boardId: board2.id, title: lc.name, color: lc.color },
      }),
    ),
  );

  const wentWell = await prisma.list.create({
    data: { boardId: board2.id, title: "Went Well", position: 0 },
  });
  const toImprove = await prisma.list.create({
    data: { boardId: board2.id, title: "To Improve", position: 1 },
  });
  const actionItems = await prisma.list.create({
    data: { boardId: board2.id, title: "Action Items", position: 2 },
  });

  await prisma.card.createMany({
    data: [
      { listId: wentWell.id, title: "Sprint velocity improved by 15%", position: 0 },
      { listId: wentWell.id, title: "Zero critical bugs in production", position: 1 },
      { listId: toImprove.id, title: "Code review turnaround time", position: 0 },
      { listId: toImprove.id, title: "Test coverage below 70%", position: 1 },
      { listId: actionItems.id, title: "Set up automated code review reminders", position: 0 },
    ],
  });

  console.log("  ✅ Created board: Sprint Retrospective");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
