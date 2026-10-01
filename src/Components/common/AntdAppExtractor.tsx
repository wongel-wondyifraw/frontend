'use client';

import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';
import { useEffect } from 'react';

// Export global references for context-aware static methods
export let globalMessage: MessageInstance | null = null;
export let globalModal: Omit<ModalStaticFunctions, 'warn'> | null = null;
export let globalNotification: NotificationInstance | null = null;

export function AntdAppExtractor() {
  const { message, modal, notification } = App.useApp();
  
  useEffect(() => {
    globalMessage = message;
    globalModal = modal;
    globalNotification = notification;
  }, [message, modal, notification]);

  return null;
}
