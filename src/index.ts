import { Bot, Context, InputFile } from "grammy";
import * as dotenv from "dotenv";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { Mistral } from "@mistralai/mistralai";
import { saveFile, uploadPath } from "./services/files";
import convert from "./pandoc";

dotenv.config();
type FileContext = FileFlavor<Context>;
const bot = new Bot<FileContext>(process.env.BOT_TOKEN!);
bot.api.config.use(hydrateFiles(bot.token));

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.command("upload", async (ctx) => {
  await ctx.reply("Please send a PDF, PNG, or JPG file.");
});

bot.on(":document", async (ctx) => {
  const file = ctx.message.document;
  if (
    !["application/pdf", "image/png", "image/jpeg"].includes(file.mime_type)
  ) {
    return ctx.reply("Only PDF, PNG, and JPG files are allowed.");
  }
  await processFile(ctx, file.file_id, file.file_name, false);
});

bot.on(":photo", async (ctx) => {
  const file = ctx.message.photo.pop();
  await processFile(ctx, file.file_id, `photo_${Date.now()}.jpg`, true);
});

async function processFile(
  ctx: FileContext,
  fileId: string,
  fileName: string,
  isImage: boolean
) {
  try {
    const file = await ctx.getFile();
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: isImage ? (
       {
            type: "image_url",
            imageUrl: fileUrl,
      }): ({
        type: "document_url",
        documentUrl: fileUrl,
      }),
      includeImageBase64: false,
    });

    let extractedText = ocrResponse.pages
      .map((page) => page.markdown)
      .join("\n");

    const timestamp = Date.now();
    const mdFileName = `ocr_${timestamp}.md`;
    const docxFilePath = uploadPath(`ocr_${timestamp}.docx`);
    const filePath = await saveFile(mdFileName, extractedText);
    await convert(filePath, `-f markdown -t docx -o ${docxFilePath}`);
    await ctx.replyWithDocument(new InputFile(docxFilePath));
  } catch (error) {
    console.error("OCR processing error:", error);
    await ctx.reply("❌ Failed to process the file.");
  }
}

bot.start();
console.log("Bot is running...");
