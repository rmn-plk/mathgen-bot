import { config } from "dotenv";
import { initBot } from "./services/bot";
import { initMistral } from "./services/mistral";
import { ensureDirExists } from "./services/files";
import { UPLOAD_DIR } from "./constants";
ensureDirExists(UPLOAD_DIR);
config();
initBot();
initMistral();

console.log("Bot is running...");
