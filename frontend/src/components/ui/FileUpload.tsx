/**
 * File Upload Component
 * Drag-and-drop file upload with preview and validation
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, File, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  multiple?: boolean;
}

interface FilePreview {
  file: File;
  preview?: string;
  id: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf'],
  className,
  multiple = true,
}) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`;
    }

    if (acceptedTypes.length > 0) {
      const fileType = file.type;
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return `File ${file.name} type is not accepted`;
      }
    }

    return null;
  };

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: FilePreview[] = [];
    const filesArray = Array.from(fileList);

    if (!multiple && filesArray.length > 1) {
      setError('Only one file can be uploaded');
      return;
    }

    if (files.length + filesArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of filesArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const id = Math.random().toString(36).substring(7);
      const filePreview: FilePreview = { file, id };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, preview: reader.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(filePreview);
    }

    setFiles(prev => [...prev, ...newFiles]);
    setError('');
    
    const allFiles = [...files.map(f => f.file), ...newFiles.map(f => f.file)];
    onFilesSelected(allFiles);
  }, [files, maxFiles, multiple, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  }, [processFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      onFilesSelected(updated.map(f => f.file));
      return updated;
    });
  }, [onFilesSelected]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          className="hidden"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Drag and drop {multiple ? 'files' : 'a file'} here, or click to select
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          {acceptedTypes.join(', ')} up to {maxSize / 1024 / 1024}MB
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((filePreview) => (
            <div
              key={filePreview.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {filePreview.preview ? (
                  <div className="relative h-10 w-10 rounded overflow-hidden">
                    <Image
                      src={filePreview.preview}
                      alt={filePreview.file.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : filePreview.file.type.startsWith('image/') ? (
                  <FileImage className="h-10 w-10 text-gray-400" />
                ) : (
                  <File className="h-10 w-10 text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(filePreview.id);
                }}
                className="flex-shrink-0 ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Remove file"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
