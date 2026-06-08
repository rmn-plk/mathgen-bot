const UPLOAD_DIR = "./uploads";

function getTelegramApiRoot(): string {
  return (process.env.TELEGRAM_API_ROOT ?? "https://api.telegram.org").replace(
    /\/$/,
    "",
  );
}

export { UPLOAD_DIR, getTelegramApiRoot };