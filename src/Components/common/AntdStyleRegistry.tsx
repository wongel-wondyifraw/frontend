'use client';

import React, { useRef, useState, type ReactNode } from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';

export default function AntdStyleRegistry({
  children,
}: {
  children: ReactNode;
}) {
  const [cache] = useState(() => createCache());
  const isServerInserted = useRef(false);

  useServerInsertedHTML(() => {
    if (isServerInserted.current) {
      return null;
    }
    isServerInserted.current = true;
    return (
      <style
        id="antd"
        dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }}
      />
    );
  });

  return <StyleProvider cache={cache}>{children}</StyleProvider>;
}

