import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const newEmail = process.env.NEW_ADMIN_EMAIL;
  const newPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!newEmail || !newPassword) {
    throw new Error("Defina NEW_ADMIN_EMAIL e NEW_ADMIN_PASSWORD antes de rodar.");
  }

  // Remove todos os admins antigos
  const deleted = await db.user.deleteMany({ where: { role: "ADMIN" } });
  console.log(`🗑  Admins removidos: ${deleted.count}`);

  // Cria o novo admin
  const hashed = await bcrypt.hash(newPassword, 10);
  const created = await db.user.create({
    data: {
      email: newEmail,
      password: hashed,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`✔ Novo admin criado: ${created.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
