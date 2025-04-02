import fs from "fs";
import { access, mkdir } from "fs/promises";
import { join } from "path";
import { UPLOAD_DIR } from "../constants";
function uploadPath(name: string) {
  return join(UPLOAD_DIR, name);
}
function saveFile(name: string, data: string | Buffer) {
  const filePath = uploadPath(name);

  fs.writeFile(filePath, data, (err) => {
    if (err) throw err;
  });
  return filePath;
}
function readFile(name: string) {
  const filePath = uploadPath(name);
  return fs.readFileSync(filePath);
}

async function ensureDirExists (dirPath: string) {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
};

export { saveFile, readFile, uploadPath, ensureDirExists };
