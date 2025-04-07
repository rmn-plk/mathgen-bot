import fs from "fs";
import { access, mkdir, unlink } from "fs/promises";
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
    return access(dirPath);
  } catch {
    return mkdir(dirPath, { recursive: true });
  }
};

async function removeFile(filePath: string) {
  return unlink(filePath);
}

export { saveFile, readFile, uploadPath, ensureDirExists, removeFile };
