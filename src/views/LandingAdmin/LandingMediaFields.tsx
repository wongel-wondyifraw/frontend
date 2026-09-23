'use client';

import React from 'react';
import { Button, Input, Upload } from 'antd';
import { message } from '@/lib/app-message';
import {
  UploadOutlined,
  FileOutlined,
  DeleteOutlined,
  LinkOutlined,
  VideoCameraOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { uploadDocument, uploadMemberImage } from '@/services/api';
import { getImageUrl } from '@/lib/media-url';
import { getApiErrorMessage } from '@/lib/errors';
import { confirmDelete } from '@/lib/confirm-delete';

type MediaFieldsProps = {
  imageUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  videoUrl?: string | null;
  videoFileUrl?: string | null;
  onChange: (patch: {
    image_url?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    video_url?: string | null;
    video_file_url?: string | null;
  }) => void;
  compact?: boolean;
};

export default function LandingMediaFields({
  imageUrl,
  fileUrl,
  fileName,
  videoUrl,
  videoFileUrl,
  onChange,
}: MediaFieldsProps) {
  const uploadImage = async (file: File) => {
    try {
      const url = await uploadMemberImage(file);
      onChange({ image_url: url });
      message.success('Image uploaded');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Image upload failed'));
    }
    return false;
  };

  const uploadFile = async (file: File) => {
    try {
      const url = await uploadDocument(file);
      onChange({ file_url: url, file_name: file.name });
      message.success('File uploaded');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'File upload failed'));
    }
    return false;
  };

  const uploadVideoFile = async (file: File) => {
    try {
      const url = await uploadDocument(file);
      onChange({ video_file_url: url });
      message.success('Video file uploaded');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Video upload failed'));
    }
    return false;
  };

  const preview = getImageUrl(imageUrl);

  return (
    <div className="la-media-layout">
      <div className="la-media-card">
        <div className="la-media-card-header">
          <PictureOutlined />
          <div>
            <div className="la-media-card-title">Image</div>
            <div className="la-media-card-hint">Upload a file or paste an image URL</div>
          </div>
        </div>
        <div className="la-media-preview-box">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" />
          ) : (
            <span className="la-media-preview-empty">No image selected</span>
          )}
        </div>
        <div className="la-media-toolbar">
          <Upload accept="image/*" showUploadList={false} beforeUpload={uploadImage}>
            <Button icon={<UploadOutlined />}>Upload image</Button>
          </Upload>
          {imageUrl && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                confirmDelete({
                  title: 'Remove image?',
                  content: 'The image will be cleared from this field.',
                  onOk: () => onChange({ image_url: null }),
                })
              }
            >
              Remove
            </Button>
          )}
        </div>
        <Input
          prefix={<LinkOutlined style={{ color: '#94a3b8' }} />}
          placeholder="https://… or uploaded path"
          value={imageUrl || ''}
          onChange={(e) => onChange({ image_url: e.target.value || null })}
        />
      </div>

      <div className="la-media-stack">
        <div className="la-media-card">
          <div className="la-media-card-header">
            <LinkOutlined />
            <div>
              <div className="la-media-card-title">Video link</div>
              <div className="la-media-card-hint">YouTube or Vimeo URL</div>
            </div>
          </div>
          <Input
            placeholder="https://youtube.com/watch?v=…"
            value={videoUrl || ''}
            onChange={(e) => onChange({ video_url: e.target.value || null })}
          />
        </div>

        <div className="la-media-card">
          <div className="la-media-card-header">
            <VideoCameraOutlined />
            <div>
              <div className="la-media-card-title">Video file</div>
              <div className="la-media-card-hint">Upload an MP4 or similar file</div>
            </div>
          </div>
          <div className="la-media-toolbar">
            <Upload accept="video/*" showUploadList={false} beforeUpload={uploadVideoFile}>
              <Button icon={<UploadOutlined />}>Upload video</Button>
            </Upload>
            {videoFileUrl && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  confirmDelete({
                    title: 'Remove video file?',
                    onOk: () => onChange({ video_file_url: null }),
                  })
                }
              >
                Remove
              </Button>
            )}
          </div>
          {videoFileUrl && <div className="la-media-file-name">{videoFileUrl}</div>}
        </div>

        <div className="la-media-card">
          <div className="la-media-card-header">
            <FileOutlined />
            <div>
              <div className="la-media-card-title">Attachment</div>
              <div className="la-media-card-hint">PDF, document, or other file</div>
            </div>
          </div>
          <div className="la-media-toolbar">
            <Upload showUploadList={false} beforeUpload={uploadFile}>
              <Button icon={<FileOutlined />}>Upload file</Button>
            </Upload>
            {fileUrl && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  confirmDelete({
                    title: 'Remove attachment?',
                    onOk: () => onChange({ file_url: null, file_name: null }),
                  })
                }
              >
                Remove
              </Button>
            )}
          </div>
          {fileUrl && (
            <a
              className="la-media-file-link"
              href={getImageUrl(fileUrl) || undefined}
              target="_blank"
              rel="noreferrer"
            >
              {fileName || 'Download attachment'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
