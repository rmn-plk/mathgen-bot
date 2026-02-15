import { access, mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { UPLOAD_DIR } from "../constants";

function uploadPath(name: string) {
  return join(UPLOAD_DIR, name);
}
async function saveFile(name: string, data: string | Buffer) {
  const filePath = uploadPath(name);
  return writeFile(filePath, data);
}

async function ensureDirExists(dirPath: string) {
  try {
    return access(dirPath);
  } catch {
    return mkdir(dirPath, { recursive: true });
  }
}

async function removeFile(filePath: string) {
  try {
    await access(filePath);
    return unlink(filePath);
  } catch {
    return;
  }
}

async function removeConvertedFiles(markdownFilePath: string, docxFilePath: string) {
  if (process.env.DEVELOPMENT !== "true") {
    await removeFile(docxFilePath);
    return removeFile(markdownFilePath);
  }
}

export { saveFile, uploadPath, ensureDirExists, removeFile, removeConvertedFiles };
