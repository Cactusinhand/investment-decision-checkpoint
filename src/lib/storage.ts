import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();

/**
 * Load and parse all JSON files within the specified directory.
 * Returns an array of parsed objects. If the directory doesn't exist, an empty
 * array is returned.
 */
export async function loadJsonDir(dir: string): Promise<any[]> {
  const dirPath = path.resolve(ROOT, dir);
  try {
    const files = await fs.readdir(dirPath);
    const results: any[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(dirPath, file), 'utf8');
        results.push(JSON.parse(content));
      }
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Write a JSON serializable object to the given path. The file extension `.json`
 * is appended automatically if missing.
 */
export async function writeJson(filePath: string, data: any): Promise<void> {
  const fullPath = path.resolve(
    ROOT,
    filePath.endsWith('.json') ? filePath : `${filePath}.json`
  );
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data));
}

/**
 * Remove the specified JSON file from storage. The `.json` extension is
 * appended automatically if missing. Missing files are ignored silently.
 */
export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.resolve(
    ROOT,
    filePath.endsWith('.json') ? filePath : `${filePath}.json`
  );
  try {
    await fs.unlink(fullPath);
  } catch {
    // ignore if file doesn't exist
  }
}
