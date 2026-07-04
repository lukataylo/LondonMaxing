import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  PermissionsAndroid,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import type {
  WebViewMessageEvent,
  WebViewNavigation
} from "react-native-webview";

/**
 * The deployed/served Grudge Map PWA the shell embeds.
 *
 * Set EXPO_PUBLIC_WEBAPP_URL in apps/mobile/.env (see .env.example).
 *
 * IMPORTANT: on a real phone running Expo Go, "localhost" points at the phone
 * itself, not your dev machine. Use either:
 *   - your machine's LAN IP, e.g. http://192.168.1.42:5173  (run `pnpm --filter @grudgemap/web dev`)
 *   - or the deployed HTTPS URL, e.g. https://grudgemap.up.railway.app
 * Browser geolocation/camera are most reliable over HTTPS.
 */
const DEFAULT_WEBAPP_URL = "http://localhost:5173";

const WEBAPP_URL = process.env.EXPO_PUBLIC_WEBAPP_URL ?? DEFAULT_WEBAPP_URL;

// Grudge Map brand palette (mirrors apps/web theme-color / index.css).
const COLORS = {
  bg: "#f7f6ef",
  ink: "#191816",
  muted: "#7a756c",
  accent: "#af3850"
};

export function WebViewShell() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Request native foreground location on launch so the WebView's
  // navigator.geolocation calls resolve immediately (no double-prompt).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch {
        // Permission denial is handled by the PWA's own fallback UI.
      }
      // Android: the WKWebView file chooser / getUserMedia needs the OS
      // CAMERA permission for the selfie challenge.
      if (Platform.OS === "android" && !cancelled) {
        try {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          ]);
        } catch {
          // Ignore; the PWA degrades gracefully without the camera.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReload = useCallback(() => {
    setErrored(false);
    setLoading(true);
    // Remounting guarantees a clean reload even after a hard network failure.
    setReloadKey((k) => k + 1);
  }, []);

  // Keep external links (mailto:, tel:, other origins) out of the WebView.
  const onShouldStartLoadWithRequest = useCallback(
    (request: WebViewNavigation) => {
      const { url } = request;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        // Allow same-app navigation; open clearly-external schemes elsewhere.
        return true;
      }
      Linking.openURL(url).catch(() => undefined);
      return false;
    },
    []
  );

  const onMessage = useCallback((_event: WebViewMessageEvent) => {
    // Reserved for a future postMessage bridge (native GPS/audio handoff).
  }, []);

  const source = useMemo(() => ({ uri: WEBAPP_URL }), []);

  return (
    <View style={styles.container}>
      {!errored && (
        <WebView
          key={reloadKey}
          ref={webViewRef}
          source={source}
          originWhitelist={["http://*", "https://*"]}
          // --- Core web platform parity ---
          javaScriptEnabled
          domStorageEnabled
          // --- Geolocation passthrough (navigator.geolocation) ---
          // Android's native WebChromeClient auto-handles
          // onGeolocationPermissionsShowPrompt: it grants the web origin once
          // the OS ACCESS_FINE_LOCATION permission is held — which we request
          // upfront on launch (see useEffect). iOS uses native CoreLocation
          // gated by NSLocationWhenInUseUsageDescription in app.json.
          geolocationEnabled
          // --- Camera / mic for the selfie <input capture> + getUserMedia ---
          // Android's native onPermissionRequest auto-grants camera/mic to the
          // web origin when the OS CAMERA/RECORD_AUDIO permissions are held
          // (requested upfront). iOS grants via mediaCapturePermissionGrantType
          // gated by NSCamera/NSMicrophone usage strings in app.json.
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          // --- UX ---
          pullToRefreshEnabled={false}
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          startInLoadingState
          // --- Lifecycle ---
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onMessage={onMessage}
          onLoadStart={() => {
            setErrored(false);
            setLoading(true);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setErrored(true);
            setLoading(false);
          }}
          onHttpError={(e) => {
            // Treat server/4xx-5xx on the main document as unreachable.
            if (e.nativeEvent.url === WEBAPP_URL) {
              setErrored(true);
              setLoading(false);
            }
          }}
          style={styles.webview}
        />
      )}

      {loading && !errored && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.brand}>Grudge Map</Text>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.subtle}>Finding nearby history…</Text>
        </View>
      )}

      {errored && (
        <View style={styles.overlay}>
          <Text style={styles.brand}>Grudge Map</Text>
          <Text style={styles.errorTitle}>Can't reach the app</Text>
          <Text style={styles.subtle}>{WEBAPP_URL}</Text>
          <Text style={styles.hint}>
            On a phone, set EXPO_PUBLIC_WEBAPP_URL to your machine's LAN IP
            (e.g. http://192.168.x.x:5173) or the deployed HTTPS URL — not
            localhost.
          </Text>
          <Pressable
            style={styles.retry}
            onPress={handleReload}
            accessibilityRole="button"
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
    backgroundColor: COLORS.bg
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: COLORS.ink,
    marginBottom: 8
  },
  subtle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center"
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 4
  },
  retry: {
    marginTop: 12,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 999
  },
  retryLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  }
});
