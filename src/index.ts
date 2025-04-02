import { config } from "dotenv";
import { initBot } from "./services/bot";
import { initMistral } from "./services/mistral";

config();
initBot();
initMistral();

console.log("Bot is running...");
