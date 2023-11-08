import { useCallback } from 'react';

import { useNotificationsStore } from '@douglasneuroinformatics/ui';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { type FileRejection, useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

export type DropzoneProps = {
  file: File | null;
  setFile: (file: File) => void;
};

export const Dropzone = ({ file, setFile }: DropzoneProps) => {
  const notifications = useNotificationsStore();
  const { t } = useTranslation();

  const handleDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      for (const { errors, file } of rejections) {
        console.error(errors);
        for (const e of errors) {
          if (e.code === 'too-many-files') {
            notifications.addNotification({ message: t('tooManyFilesError'), type: 'error' });
            break;
          }
          if (e.code === 'file-invalid-type') {
            notifications.addNotification({ message: t('notCSVorTSV', { filename: file.name }), type: 'error' });
          } else {
            notifications.addNotification({ message: t('invalidFileError', { filename: file.name }), type: 'error' });
            break;
          }
        }
      }
      setFile(acceptedFiles[0]!);
    },
    [notifications, setFile]
  );

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv', '.tsv']
    },
    maxFiles: 1,
    onDrop: handleDrop
  });

  return (
    <div className="flex h-full flex-col items-center justify-center" {...getRootProps()}>
      <CloudArrowUpIcon height={40} width={40} />
      <p className="mt-1 text-center text-sm">
        {file ? file.name : isDragActive ? t('releaseToUpload') : t('dropHere')}
      </p>
      <input {...getInputProps()} />
    </div>
  );
};
