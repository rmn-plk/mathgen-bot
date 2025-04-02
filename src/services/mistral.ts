import { Mistral } from "@mistralai/mistralai";

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
  return extractedText;
}
export { initMistral, recognizeFile };
