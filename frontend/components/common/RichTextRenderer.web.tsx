import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export type RichTextRendererProps = {
  html: string;
  contentWidth?: number;
};

export default function RichTextRenderer({ html }: RichTextRendererProps) {
  const safe = useMemo(() => sanitizeHtml(html || ''), [html]);
  return (
    <View style={styles.wrap}>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: '#333',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
