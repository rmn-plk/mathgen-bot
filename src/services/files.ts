import fs from "fs";
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

export { saveFile, readFile, uploadPath };
