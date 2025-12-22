import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { WebView } from 'react-native-webview';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export type RichTextRendererProps = {
  html: string;
  contentWidth?: number;
};

export default function RichTextRenderer({ html, contentWidth }: RichTextRendererProps) {
  const { width } = useWindowDimensions();
  const resolvedContentWidth = contentWidth ?? Math.max(320, width - 32);
  const safe = useMemo(() => sanitizeHtml(html || ''), [html]);
  const hasIframe = /<iframe\b/i.test(safe);

  if (hasIframe) {
    const doc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body{margin:0;padding:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;font-size:14px;line-height:1.7;color:#333;background:#fff;}
      img{max-width:100%;height:auto;}
      iframe{width:100%;border:0;}
      a{color:#8B4513;text-decoration:none;}
    </style>
  </head>
  <body>${safe}</body>
</html>`;

    return (
      <View style={[styles.webDocWrap, { width: resolvedContentWidth }]}>
        <WebView
          originWhitelist={['*']}
          source={{ html: doc }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <RenderHTML
        contentWidth={resolvedContentWidth}
        source={{ html: safe }}
        baseStyle={styles.base}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  base: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  webDocWrap: {
    height: 520,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
  },
});
