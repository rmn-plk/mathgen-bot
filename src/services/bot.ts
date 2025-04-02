import { Bot, Context, InputFile } from "grammy";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { recognizeFile } from "./mistral";
import { uploadPath, saveFile, ensureDirExists } from "./files";
import convertFile from "./pandoc";
import { UPLOAD_DIR } from "../constants";

type FileContext = FileFlavor<Context>;
var bot: Bot<FileContext>;

async function processFile(ctx: Context, isImage: boolean) {
  try {
    const userDir = ctx.me.id;
    const timestamp = Date.now();
    const docxFilePath = uploadPath(`${userDir}/${timestamp}.docx`);
    const mdFileName = `${userDir}/${timestamp}.md`;
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    const recognizingMessage = await ctx.reply(
      "Recognizing math in the file..."
    );

    const extractedText = await recognizeFile(fileUrl, isImage);
    const filePath = await saveFile(mdFileName, extractedText);
    await ctx.api.editMessageText(
      recognizingMessage.chat.id,
      recognizingMessage.message_id,
      "Math recognized!"
    );

    const convertingMessage = await ctx.reply("Converting file...");

    await convertFile(filePath, `-f markdown -t docx -o ${docxFilePath}`);

    await ctx.api.editMessageText(
      convertingMessage.chat.id,
      convertingMessage.message_id,
      "File converted!"
    );

    await ctx.replyWithDocument(new InputFile(docxFilePath));
  } catch (error) {
    console.error("OCR processing error:", error);
    await ctx.reply("❌ Failed to process the file.");
  }
}

async function initBot() {
  bot = new Bot<FileContext>(process.env.BOT_TOKEN!);
  bot.api.config.use(hydrateFiles(bot.token));

  bot.command("start", async (ctx: Context) => {
    await ensureDirExists(`${UPLOAD_DIR}/${ctx.me.id}`);
    ctx.reply("Welcome! Up and running.");
  });

  bot.command("help", (ctx: Context) => {
    ctx.reply("Please send a PDF, PNG, or JPG file.");
  });

  bot.on(":document", async (ctx: Context) => {
    const file = ctx?.message?.document;
    if (
      !["application/pdf", "image/png", "image/jpeg"].includes(file?.mime_type)
    ) {
      return ctx.reply("Only PDF, PNG, and JPG files are allowed.");
    }
    await processFile(ctx, false);
  });

  bot.on(":photo", async (ctx: Context) => {
    await processFile(ctx, true);
  });
  await bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "help", description: "Show help text" },
    { command: "settings", description: "Open settings" },
  ]);
  bot.start();
}

export { initBot };
