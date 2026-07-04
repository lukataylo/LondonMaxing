/**
 * NativeMapScreen — Grudge Map full-screen native map UI
 * Matches the Corner Maps glassmorphic aesthetic.
 * Runs via dev build only (react-native-maps requires native build):
 *   npx expo run:ios
 */
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import type { Region } from "react-native-maps";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CHARACTERS } from "@grudgemap/shared";

const { width: SW } = Dimensions.get("window");

// ─── Colours ────────────────────────────────────────────────────────────────
const C = {
  blue: "#4B7CF4",
  blueLight: "#E8EFFE",
  blueChip: "#3A6EF0",
  white: "#FFFFFF",
  textDark: "#1A1A1A",
  textMid: "#555555",
  textLight: "#888888",
  glass: "rgba(255,255,255,0.78)",
  glassBorder: "rgba(255,255,255,0.65)",
  overlay: "rgba(255,255,255,0.28)",
  shadow: "#000",
} as const;

// ─── Map initial region — central London ────────────────────────────────────
const INITIAL_REGION: Region = {
  latitude: 51.512,
  longitude: -0.083,
  latitudeDelta: 0.024,
  longitudeDelta: 0.019,
};

// ─── Category stickers ───────────────────────────────────────────────────────
const STICKERS = [
  { id: "top-picks", label: "top picks", emoji: "⭐" },
  { id: "historic", label: "historic", emoji: "🏛️" },
  { id: "eat", label: "eat", emoji: "🍽️" },
  { id: "cafes", label: "cafes", emoji: "☕" },
  { id: "bars", label: "bars", emoji: "🍸" },
  { id: "bathrooms", label: "bathrooms", emoji: "🚻" },
  { id: "shops", label: "shops", emoji: "🛍️" },
  { id: "hotels", label: "hotels", emoji: "🛎️" },
  { id: "leisure", label: "leisure", emoji: "🎾" },
] as const;

type StickerId = (typeof STICKERS)[number]["id"];

// ─── Tab bar items ────────────────────────────────────────────────────────────
const TABS = [
  { id: "people", emoji: "👥", label: "People" },
  { id: "map", emoji: "🗺", label: "Map" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "profile", emoji: "👤", label: "Profile" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Character category → emoji ───────────────────────────────────────────────
const CAT_EMOJI: Record<string, string> = {
  science: "🔬",
  arts: "🎨",
  music: "🎸",
  politics: "📜",
  literature: "📚",
  history: "⚔️",
};

// ─── Glass container helper ────────────────────────────────────────────────────
interface GlassProps {
  style: object;
  children: React.ReactNode;
  intensity?: number;
}
function Glass({ style, children, intensity = 70 }: GlassProps) {
  return (
    <View style={[styles.shadow, style]}>
      <View style={[styles.glassClip, StyleSheet.absoluteFill]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={intensity}
          tint="systemUltraThinMaterialLight"
        />
        <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
      </View>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function NativeMapScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [activeSticker, setActiveSticker] = useState<StickerId | null>(null);
  const mapRef = useRef<MapView>(null);

  const handleLocate = useCallback(() => {
    mapRef.current?.animateToRegion(INITIAL_REGION, 400);
  }, []);

  // ── Layout measurements ──────────────────────────────────────────────────
  const tabBarBottom = insets.bottom + 12;
  const tabBarH = 54;
  const stickerRowBottom = tabBarBottom + tabBarH + 10;
  const bottomChipsBottom = stickerRowBottom + 72;
  const topControlsTop = insets.top + 10;
  const topFadeH = insets.top + 80;
  const bottomFadeH = tabBarBottom + tabBarH + 72 + 44 + 28;

  return (
    <View style={styles.root}>
      {/* ── Full-screen map ───────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests
        showsScale={false}
      >
        {CHARACTERS.map((c) => (
          <Marker
            key={c.id}
            coordinate={{ latitude: c.lat, longitude: c.lng }}
            title={c.name}
            description={c.era}
          >
            <View style={styles.pinOuter}>
              <View style={styles.pinInner}>
                <Text style={styles.pinEmoji}>
                  {CAT_EMOJI[c.category] ?? "📍"}
                </Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Top gradient fade ─────────────────────────────────────────── */}
      <LinearGradient
        colors={["rgba(252,252,252,0.92)", "transparent"]}
        style={[styles.topFade, { height: topFadeH }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* ── Top controls row ─────────────────────────────────────────── */}
      <View
        style={[styles.topRow, { top: topControlsTop }]}
        pointerEvents="box-none"
      >
        {/* Left: people button */}
        <Glass style={styles.topCircle}>
          <Text style={styles.iconMd}>👥</Text>
        </Glass>

        {/* Right: share + bell pill */}
        <Glass style={styles.topPill}>
          <Pressable style={styles.topPillBtn} hitSlop={8}>
            <Text style={styles.iconMd}>✈️</Text>
          </Pressable>
          <View style={styles.topDivider} />
          <Pressable style={styles.topPillBtn} hitSlop={8}>
            <View>
              <Text style={styles.iconMd}>🔔</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>12</Text>
              </View>
            </View>
          </Pressable>
        </Glass>
      </View>

      {/* ── Search here pill ─────────────────────────────────────────── */}
      <View style={styles.searchWrap} pointerEvents="box-none">
        <Pressable style={styles.searchPill} hitSlop={8}>
          <Text style={styles.searchDot}>●</Text>
          <Text style={styles.searchLabel}>search here</Text>
        </Pressable>
      </View>

      {/* ── Bottom map controls ───────────────────────────────────────── */}
      <View
        style={[styles.bottomControls, { bottom: bottomChipsBottom }]}
        pointerEvents="box-none"
      >
        {/* Left chips */}
        <View style={styles.chipRow} pointerEvents="box-none">
          {/* everyone ▾ */}
          <Glass style={styles.chipEveryone}>
            <Text style={styles.chipEveryoneText}>everyone </Text>
            <Text style={styles.chipArrow}>▾</Text>
          </Glass>
          {/* open now */}
          <Glass style={styles.chipOpenNow}>
            <Text style={styles.chipIcon}>🕐</Text>
            <Text style={styles.chipText}>open now</Text>
          </Glass>
        </View>

        {/* Right: locate button */}
        <Pressable onPress={handleLocate} hitSlop={8}>
          <Glass style={styles.locateBtn}>
            <Text style={styles.locateArrow}>◎</Text>
          </Glass>
        </Pressable>
      </View>

      {/* ── Bottom gradient fade ──────────────────────────────────────── */}
      <LinearGradient
        colors={["transparent", "rgba(248,248,250,0.97)"]}
        style={[styles.bottomFade, { height: bottomFadeH }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* ── Category sticker row ──────────────────────────────────────── */}
      <View
        style={[styles.stickerRow, { bottom: stickerRowBottom }]}
        pointerEvents="box-none"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stickerScroll}
          pointerEvents="box-none"
        >
          {STICKERS.map((s) => {
            const isActive = activeSticker === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() =>
                  setActiveSticker((prev) => (prev === s.id ? null : s.id))
                }
                style={styles.stickerItemWrap}
              >
                <View
                  style={[
                    styles.stickerIcon,
                    isActive && styles.stickerIconActive,
                  ]}
                >
                  <Text style={styles.stickerEmoji}>{s.emoji}</Text>
                </View>
                <Text
                  style={[
                    styles.stickerLabel,
                    isActive && styles.stickerLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Bottom tab bar ────────────────────────────────────────────── */}
      <View
        style={[styles.tabBarArea, { bottom: tabBarBottom }]}
        pointerEvents="box-none"
      >
        {/* Glass pill */}
        <View style={styles.tabBarShadowWrap}>
          <View style={[styles.tabBarPillClip, { height: tabBarH }]}>
            <BlurView
              style={StyleSheet.absoluteFill}
              intensity={80}
              tint="systemUltraThinMaterialLight"
            />
            <View style={[StyleSheet.absoluteFill, styles.tabBarOverlay]} />
            <View style={styles.tabBarPillContent}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={styles.tabItem}
                    hitSlop={6}
                  >
                    <View
                      style={[
                        styles.tabIconWrap,
                        active && styles.tabIconActive,
                      ]}
                    >
                      {tab.id === "profile" ? (
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarEmoji}>👤</Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.tabEmoji,
                            active && styles.tabEmojiActive,
                          ]}
                        >
                          {tab.emoji}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Plus button */}
        <View style={styles.plusShadowWrap}>
          <View style={styles.plusBtnClip}>
            <BlurView
              style={StyleSheet.absoluteFill}
              intensity={75}
              tint="systemUltraThinMaterialLight"
            />
            <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
            <Pressable style={styles.plusContent} hitSlop={8}>
              <Text style={styles.plusIcon}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const GLASS_SHADOW = {
  shadowColor: C.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },

  // ── Glass helpers ──────────────────────────────────────────────────────────
  shadow: {
    ...GLASS_SHADOW,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  glassClip: {
    borderRadius: 9999, // will be overridden per usage
    overflow: "hidden",
  },
  glassOverlay: {
    backgroundColor: C.overlay,
  },

  // ── Top gradient ───────────────────────────────────────────────────────────
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },

  // ── Top controls ──────────────────────────────────────────────────────────
  topRow: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.glass,
  },

  topPill: {
    height: 38,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    backgroundColor: C.glass,
  },
  topPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  topDivider: {
    width: 0.5,
    height: 18,
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  // Badge
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: C.blue,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 10,
  },

  // ── Search here pill ──────────────────────────────────────────────────────
  searchWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "52%",
    alignItems: "center",
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.blue,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 9,
    gap: 6,
    shadowColor: C.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  searchDot: {
    color: C.white,
    fontSize: 10,
  },
  searchLabel: {
    color: C.white,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  // ── Bottom controls (chips + locate) ─────────────────────────────────────
  bottomControls: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },

  chipEveryone: {
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.blueChip,
    borderColor: "transparent",
  },
  chipEveryoneText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "600",
  },
  chipArrow: {
    color: C.white,
    fontSize: 11,
  },

  chipOpenNow: {
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.glass,
  },
  chipIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  chipText: {
    color: C.textDark,
    fontSize: 13,
    fontWeight: "500",
  },

  locateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.glass,
  },
  locateArrow: {
    fontSize: 18,
    color: C.blue,
  },

  // ── Bottom gradient ───────────────────────────────────────────────────────
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  // ── Sticker row ───────────────────────────────────────────────────────────
  stickerRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 72,
  },
  stickerScroll: {
    paddingHorizontal: 14,
    alignItems: "flex-start",
    gap: 6,
  },
  stickerItemWrap: {
    width: 58,
    alignItems: "center",
    gap: 4,
  },
  stickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.06)",
  },
  stickerIconActive: {
    backgroundColor: C.blueLight,
    borderColor: C.blue,
  },
  stickerEmoji: {
    fontSize: 22,
  },
  stickerLabel: {
    fontSize: 10,
    color: C.textMid,
    fontWeight: "500",
    textAlign: "center",
  },
  stickerLabelActive: {
    color: C.blue,
    fontWeight: "600",
  },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBarArea: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  tabBarShadowWrap: {
    flex: 1,
    borderRadius: 999,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  tabBarPillClip: {
    borderRadius: 999,
    overflow: "hidden",
  },
  tabBarOverlay: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  tabBarPillContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: {
    backgroundColor: C.blue,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabEmojiActive: {
    // tint via container background; emoji itself keeps original colour
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarEmoji: {
    fontSize: 18,
  },

  // Plus button
  plusShadowWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: C.glassBorder,
  },
  plusBtnClip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
  },
  plusContent: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    fontSize: 22,
    color: C.textDark,
    fontWeight: "300",
    lineHeight: 26,
  },

  // ── Map pins ──────────────────────────────────────────────────────────────
  pinOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: C.blue,
  },
  pinEmoji: {
    fontSize: 16,
  },

  // ── Text helpers ──────────────────────────────────────────────────────────
  iconMd: {
    fontSize: 17,
  },
});
