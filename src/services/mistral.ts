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
    includeImageBase64: true,
  });
  return ocrResponse.pages
    .map((page) => {
      let markdown = page.markdown;
      page.images?.forEach((image) => {
        const width = Math.abs(image.bottomRightX - image.topLeftX) / 2;
        const height = Math.abs(image.topLeftY - image.bottomRightY) / 2;
        markdown = markdown.replace(`![${image.id}](${image.id})`, `![](${image?.imageBase64}){width=${width}px height=${height}px}`);
      });
      return markdown;
    })
    .join("\n");
}
export { initMistral, recognizeFile };
