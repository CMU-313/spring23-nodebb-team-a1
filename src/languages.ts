import fs from 'fs';
import path from 'path';
import utils from './utils';
import { paths } from './constants';
import plugins from './plugins';

type Language = {
    code: number;
    name: string;
    dir: number;
    languages: string[];
}

const languagesPath: string = path.join(__dirname, '../build/public/language');

const files: string[] = fs.readdirSync(path.join(paths.nodeModules, '/timeago/locales'));
const timeagoCodes: string[] = files.filter(f => f.startsWith('jquery.timeago')).map(f => f.split('.')[2]);

export async function get(language: string, namespace: string): Promise<paths> {
    const pathToLanguageFile: string = path.join(languagesPath, language, `${namespace}.json`);
    if (!pathToLanguageFile.startsWith(languagesPath)) {
        throw new Error('[[error:invalid-path]]');
    }
    const data: string = await fs.promises.readFile(pathToLanguageFile, 'utf8');
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed: paths = JSON.parse(data) || {};
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await plugins.hooks.fire('filter:languages.get', {
        language,
        namespace,
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: parsed,
    });
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return result.data;
}

let codeCache: string[] = null;
export async function listCodes(): Promise<string[]> {
    if (codeCache && codeCache.length) {
        return codeCache;
    }
    try {
        const file: string = await fs.promises.readFile(path.join(languagesPath, 'metadata.json'), 'utf8');
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed: Language = JSON.parse(file) as Language;

        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        codeCache = parsed.languages;
        return codeCache;
    } catch (err) {
        if (err instanceof Error) {
            return [];
        }
        throw err;
    }
}

let listCache: Language[] | null = null;
export async function list(): Promise<Language[]> {
    if (listCache && listCache.length) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return listCache;
    }

    const codes: string[] = await listCodes();

    let languages: Language[] = await Promise.all(codes.map(async (folder: string) => {
        try {
            const configPath: string = path.join(languagesPath, folder, 'language.json');
            const file: string = await fs.promises.readFile(configPath, 'utf8');
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const lang: Language = JSON.parse(file) as Language;
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return lang;
        } catch (err) {
            if (err instanceof Error) {
                console.log(err.message);
                return;
            }
            throw err;
        }
    }));

    // filter out invalid ones
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    languages = languages.filter(lang => lang && lang.code && lang.name && lang.dir);

    listCache = languages;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return languages;
}

export async function userTimeagoCode(userLang: string): Promise<string> {
    const languageCodes: string[] = await listCodes();
    const timeagoCode: string = utils.userLangToTimeagoCode(userLang) as string;
    if (languageCodes.includes(userLang) && timeagoCodes.includes(timeagoCode)) {
        return timeagoCode;
    }
    return '';
}
