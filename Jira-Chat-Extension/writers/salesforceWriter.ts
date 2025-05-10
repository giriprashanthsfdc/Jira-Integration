import * as path from 'path';
import * as fs from 'fs/promises';
import { LanguageSpecificCodeWriter } from '../utils/fileWriter';

const SALESFORCE_FOLDERS = {
  apex: 'classes',
  trigger: 'triggers',
  html: 'lwc',
  js: 'lwc',
  xml: 'objects'
};

function resolvePathFor(codeLang: string): string {
  return SALESFORCE_FOLDERS[codeLang.toLowerCase()] || 'unclassified';
}

function extractFileName(code: string, lang: string): string {
  if (lang === 'apex' || lang === 'trigger') {
    const match = code.match(/(class|trigger)\s+(\w+)/i);
    return match?.[2] || 'Unnamed';
  }
  return 'Component';
}

const salesforceWriter: LanguageSpecificCodeWriter = {
  async write(code, language, rootFolder) {
    const folder = resolvePathFor(language);
    const name = extractFileName(code, language);
    const extension = language === 'apex' ? 'cls' : language;
    const filePath = path.join(rootFolder, 'force-app', 'main', 'default', folder, `${name}.${extension}`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, code, 'utf8');
    return filePath;
  }
};

export default salesforceWriter;
