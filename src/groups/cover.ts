import path from 'path';

import nconf from 'nconf';

import db from '../database';
import image from '../image';
import file from '../file';

interface groups {
    removeCover: (data: Data) => Promise<void>;
    getGroupFields(groupName: string, fields: string[]): Promise<string[]>;
    updateCover: (uid: string, data: Data) => Promise<void | { url: string; }>;
    setGroupField(groupName: string, arg1: string, position: string): unknown;
    updateCoverPosition: (groupName: string, position: string) => Promise<void>;
}

interface Data {
    groupName: string;
    file: { path: string; type: string; };
    imageData: string;
    position: string;
    url: string;
}

export = function (Groups: groups) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/bmp'];
    Groups.updateCoverPosition = async function (groupName, position) {
        if (!groupName) {
            throw new Error('[[error:invalid-data]]');
        }
        await Groups.setGroupField(groupName, 'cover:position', position);
    };

    Groups.updateCover = async function (uid, data) {
        let tempPath = data.file ? data.file.path : '';
        try {
            // Position only? That's fine
            if (!data.imageData && !data.file && data.position) {
                return await Groups.updateCoverPosition(data.groupName, data.position);
            }
            const type = data.file ? data.file.type : image.mimeFromBase64(data.imageData) as string;
            if (!type || !allowedTypes.includes(type)) {
                throw new Error('[[error:invalid-image]]');
            }

            if (!tempPath) {
                tempPath = await image.writeImageDataToTempFile(data.imageData);
            }

            const filename = `groupCover-${data.groupName}${path.extname(tempPath)}`;
            const uploadData = await image.uploadImage(filename, 'files', {
                path: tempPath,
                uid: uid,
                name: 'groupCover',
            }) as Data;
            const { url } = uploadData;
            await Groups.setGroupField(data.groupName, 'cover:url', url);

            await image.resizeImage({
                path: tempPath,
                width: 358,
            });
            const thumbUploadData = await image.uploadImage(`groupCoverThumb-${data.groupName}${path.extname(tempPath)}`, 'files', {
                path: tempPath,
                uid: uid,
                name: 'groupCover',
            }) as Data;
            await Groups.setGroupField(data.groupName, 'cover:thumb:url', thumbUploadData.url);

            if (data.position) {
                await Groups.updateCoverPosition(data.groupName, data.position);
            }

            return { url: url };
        } finally {
            file.delete(tempPath) as void;
        }
    };

    Groups.removeCover = async function (data: Data) {
        const fields = ['cover:url', 'cover:thumb:url'];
        const values = await Groups.getGroupFields(data.groupName, fields);
        await Promise.all(fields.map((field) => {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (!values[field] || !values[field].startsWith(`${nconf.get('relative_path') as string}/assets/uploads/files/`)) {
                return;
            }
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const filename = values[field].split('/').pop() as string;
            const filePath = path.join(nconf.get('upload_path') as string, 'files', filename);
            return file.delete(filePath);
        }));
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteObjectFields(`group:${data.groupName}`, ['cover:url', 'cover:thumb:url', 'cover:position']);
    };
};
