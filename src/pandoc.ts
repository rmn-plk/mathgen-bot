import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';


const statAsync = promisify(fs.stat);

const convert = (src: string, args: string | string[], options?: Array<string>): Promise<string | boolean> => {
  return new Promise((resolve, reject) => {
    let result = "";
    let pdSpawn: ChildProcess;
    const onStdOutData = (data: Buffer): void => {
      result += data.toString();
    };

    const onStdOutEnd = (): void => {
      resolve(result || true);
    };

    const onStdErrData = (err: Buffer): void => {
    };

    const isURL = (src: string): boolean => {
      return /^(https?|ftp):\/\//i.test(src);
    };
    if (typeof args === 'string') {
      args = args.split(' ');
    }

    statAsync(src)
      .then((stats) => {
        if ((stats && stats.isFile()) || isURL(src)) {
          (args as string[]).unshift(src);
        }
        pdSpawn = spawn('pandoc', args as string[], options);
        if (!stats && !isURL(src)) {
          pdSpawn.stdin.end(src, 'utf-8');
        }
        pdSpawn.stdout.on('data', onStdOutData);
        pdSpawn.stdout.on('end', onStdOutEnd);
        pdSpawn.stderr.on('data', onStdErrData);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export default convert;
