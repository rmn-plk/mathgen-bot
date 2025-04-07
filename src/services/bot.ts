import { Bot, Context, InputFile } from "grammy";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { recognizeFile } from "./mistral";
import { uploadPath, saveFile, ensureDirExists, removeFile } from "./files";
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
      "🔎 Распознавание текста в файле..."
    );

    const extractedText = await recognizeFile(fileUrl, isImage);
    const markdownFilePath = await saveFile(mdFileName, extractedText);
    await ctx.api.editMessageText(
      recognizingMessage.chat.id,
      recognizingMessage.message_id,
      "✔️ Файл успешно распознан!"
    );

    const convertingMessage = await ctx.reply("⌛ Конвертирование файла...");

    await convertFile(markdownFilePath, `-f markdown -t docx -o ${docxFilePath}`);

    await ctx.api.editMessageText(
      convertingMessage.chat.id,
      convertingMessage.message_id,
      "✔️ Файл сконвертирован!"
    );

    await ctx.replyWithDocument(new InputFile(docxFilePath));
    if (process.env.DEVELOPMENT !== "true") {
      await removeFile(docxFilePath);
      await removeFile(markdownFilePath);
    }
  } catch (error) {
    console.error("OCR processing error:", error);
    await ctx.reply("❌ Бот не смог конвертировать ваш файл");
  }
}

async function initBot() {
  bot = new Bot<FileContext>(process.env.BOT_TOKEN!);
  bot.api.config.use(hydrateFiles(bot.token));

  bot.command("start", async (ctx: Context) => {
    await ensureDirExists(`${UPLOAD_DIR}/${ctx.me.id}`);
    ctx.reply("👋 Добро пожаловать!");
  });

  bot.command("help", (ctx: Context) => {
    ctx.reply("🙏🏼 Бот поддерживает конвертацию PDF, PNG, or JPG файлов.");
  });

  bot.command("contact", (ctx: Context) => {
    ctx.reply("🤔 Обратная связь");
  });


  bot.on(":document", async (ctx: Context) => {
    const file = ctx?.message?.document;
    if (
      !["application/pdf", "image/png", "image/jpeg"].includes(file?.mime_type)
    ) {
      return ctx.reply("🙏🏼 Бот поддерживает только конвертацию PDF, PNG, or JPG файлов.");
    }
    await processFile(ctx, false);
  });

  bot.on(":photo", async (ctx: Context) => {
    await processFile(ctx, true);
  });
  await bot.api.setMyCommands([
    { command: "start", description: "Запустить бота." },
    { command: "help", description: "Вопросы и ответы" },
    { command: "contact", description: "Обратная связь" },
  ]);
  bot.start();
}

export { initBot };
