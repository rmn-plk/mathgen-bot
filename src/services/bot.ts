import { Bot, Context, InputFile } from "grammy";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { recognizeFile } from "./mistral";
import {
  uploadPath,
  saveFile,
  ensureDirExists,
  removeConvertedFiles,
} from "./files";
import convertFile from "./pandoc";
import { UPLOAD_DIR, getTelegramApiRoot } from "../constants";

type FileContext = FileFlavor<Context>;
var bot: Bot<FileContext>;

async function processFile(ctx: Context, isImage: boolean) {
  await ensureDirExists(`${UPLOAD_DIR}/${ctx.from.id}`);
  const userDir = ctx.from.id;
  const timestamp = Date.now();
  const fileName = `${userDir}/${timestamp}`;
  const markdownFilePath: string = uploadPath(`${fileName}.md`),
    docxFilePath = uploadPath(`${fileName}.docx`);

  try {
    const file = await ctx.getFile();
    const fileUrl = `${getTelegramApiRoot()}/file/bot${bot.token}/${file.file_path}`;

    const recognizingMessage = await ctx.reply(
      "🔎 Распознавание текста в файле...",
    );

    const extractedText = await recognizeFile(fileUrl, isImage);

    await saveFile(`${fileName}.md`, extractedText);
    await ctx.api.editMessageText(
      recognizingMessage.chat.id,
      recognizingMessage.message_id,
      "✔️ Файл успешно распознан!",
    );

    const convertingMessage = await ctx.reply("⌛ Конвертирование файла...");

    await convertFile(
      markdownFilePath,
      `-f markdown -t docx -o ${docxFilePath}`,
    );

    await ctx.api.editMessageText(
      convertingMessage.chat.id,
      convertingMessage.message_id,
      "✔️ Файл сконвертирован!",
    );

    ctx.replyWithDocument(new InputFile(docxFilePath));
  } catch (error) {
    console.error("OCR processing error:", error);
    await ctx.reply("❌ Не получилось cконвертировать ваш файл");
  }
  await removeConvertedFiles(markdownFilePath, docxFilePath);
}

function checkIfUsageNotAvailable(ctx: Context) {
  if (process.env.DEVELOPMENT == "true") return false;
  const username = ctx.from?.username;
  const availableUsers = process.env.AVAILABLE_USERS.split(",");
  if (!availableUsers || !availableUsers.includes(username)) {
    return true;
  }
  return false;
}

async function initBot() {
  bot = new Bot<FileContext>(process.env.BOT_TOKEN!, {
    client: { apiRoot: getTelegramApiRoot() },
  });
  bot.api.config.use(hydrateFiles(bot.token));

  bot.command("start", async (ctx: Context) => {
    await ensureDirExists(`${UPLOAD_DIR}/${ctx.from.id}`);
    await saveFile(`${ctx.from.id}/user.json`, JSON.stringify(ctx.from));

    ctx.reply("👋 Добро пожаловать!");
  });

  bot.command("help", (ctx: Context) => {
    ctx.reply(
      "🙏🏼 Поддерживается конвертация PDF, PNG, or JPG файлов. Максимальный допустимый размер файлов - 20MB.",
    );
  });

  bot.command("contact", (ctx: Context) => {
    ctx.reply("🤔 Обратная связь");
  });

  bot.on(":document", async (ctx: Context) => {
    const file = ctx?.message?.document;
    if (checkIfUsageNotAvailable(ctx)) {
      return ctx.reply("🙏🏼 У вас нет прав, для использования этого бота.");
    }
    if (
      !["application/pdf", "image/png", "image/jpeg"].includes(file?.mime_type)
    ) {
      return ctx.reply(
        "🙏🏼 Пподдерживается конвертация PDF, PNG, or JPG файлов.",
      );
    }
    await processFile(ctx, false);
  });

  bot.on(":photo", async (ctx: Context) => {
    if (checkIfUsageNotAvailable(ctx)) {
      return ctx.reply("🙏🏼 У вас нет прав, для использования этого бота.");
    }
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
