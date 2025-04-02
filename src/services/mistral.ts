import { Mistral } from "@mistralai/mistralai";
import { saveFile } from "./files";

var mistral: Mistral;

function initMistral() {
    const apiKey = process.env.MISTRAL_API_KEY;
    mistral = new Mistral({ apiKey: apiKey });
}

async function recognizeFile(fileUrl: string, isImage: boolean) {
  const ocrResponse = await mistral.ocr.process({
    model: "mistral-ocr-latest",
    document: isImage
      ? {
          type: "image_url",
          imageUrl: fileUrl,
        }
      : {
          type: "document_url",
          documentUrl: fileUrl,
        },
    includeImageBase64: false,
  });

  const extractedText = ocrResponse.pages
    .map((page) => page.markdown)
    .join("\n");
  const timestamp = Date.now();
  const mdFileName = `ocr_${timestamp}.md`;
  const filePath = await saveFile(mdFileName, extractedText);
  return filePath;
}
export { initMistral, recognizeFile };
