import "dotenv/config";
import mongoose from "mongoose";

import User from "../models/User.js";

const email = process.env.SEED_EMAIL ?? "demo@passup.app";
const name = process.env.SEED_NAME ?? "Demo User";
const password = process.env.SEED_PASSWORD ?? "passup123";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(
        JSON.stringify({
          ok: true,
          created: false,
          id: existing._id.toString(),
          email: existing.email,
          name: existing.name,
        }),
      );
      return;
    }

    const user = await User.create({ email, name, password });
    console.log(
      JSON.stringify({
        ok: true,
        created: true,
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      }),
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
