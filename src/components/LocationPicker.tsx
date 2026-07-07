// Map-based location chooser — a React Native port of
// coterie-ios/Circle/Views/Onboarding/LocationPicker.swift. Search a place (live
// autocomplete), detect your current location, or drag the map under a fixed
// pin. Everything resolves to a city name.
//
// Uses react-native-maps (Apple Maps on iOS, mirroring MapKit) + expo-location
// for detect / reverse-geocode, and OpenStreetMap (Nominatim) for search
// autocomplete. Requires a dev build — the native map is not in Expo Go.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { grotesk, useTheme, type Palette } from '../theme';
import { Text, TextInput } from './ui';

const DEFAULT_REGION: Region = {
  latitude: 51.5074, longitude: -0.1278, // London
  latitudeDelta: 0.5, longitudeDelta: 0.5,
};
const CLOSE_DELTA = 0.08;

interface Suggestion { name: string; subtitle: string; lat: number; lon: number; }

function metersBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function LocationPicker({ value, onChange }: { value: string; onChange: (city: string) => void }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [focused, setFocused] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  const lastGeocoded = useRef({ lat: DEFAULT_REGION.latitude, lon: DEFAULT_REGION.longitude });
  const programmatic = useRef(false);     // suppress autocomplete on programmatic text set
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showResults = focused && results.length > 0;

  // Center the map on the existing city when opening.
  useEffect(() => {
    if (value.trim()) forwardGeocode(value.trim(), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- text + autocomplete -------------------------------------------------

  const setText = (t: string) => { programmatic.current = true; setQuery(t); };

  const onType = (t: string) => {
    setQuery(t);
    if (programmatic.current) { programmatic.current = false; return; }
    onChange(t);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const trimmed = t.trim();
    if (!trimmed) { setResults([]); return; }
    searchTimer.current = setTimeout(() => searchPlaces(trimmed), 420);
  };

  async function searchPlaces(q: string) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'CircleApp/1.0' } });
      const json: any[] = await res.json();
      setResults(json.map((r) => {
        const a = r.address ?? {};
        const name = a.city || a.town || a.village || a.county || (r.display_name?.split(',')[0] ?? r.name);
        const subtitle = [a.state, a.country].filter(Boolean).join(', ');
        return { name, subtitle, lat: parseFloat(r.lat), lon: parseFloat(r.lon) } as Suggestion;
      }));
    } catch {
      setResults([]);
    }
  }

  function pick(s: Suggestion) {
    setFocused(false);
    setResults([]);
    setText(s.name);
    onChange(s.name);
    flyTo(s.lat, s.lon);
  }

  // ---- geocoding -----------------------------------------------------------

  async function forwardGeocode(q: string, updateCity: boolean) {
    try {
      const [hit] = await Location.geocodeAsync(q);
      if (hit) {
        lastGeocoded.current = { lat: hit.latitude, lon: hit.longitude };
        mapRef.current?.animateToRegion({ latitude: hit.latitude, longitude: hit.longitude, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA }, 500);
        if (updateCity) reverseGeocode(hit.latitude, hit.longitude);
      }
    } catch { /* ignore */ }
  }

  async function reverseGeocode(lat: number, lon: number) {
    setResolving(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      const name = place?.city || place?.subregion || place?.region || place?.country;
      if (name) { setText(name); onChange(name); }
    } catch { /* ignore */ } finally {
      setResolving(false);
    }
  }

  function flyTo(lat: number, lon: number) {
    setLocating(false);
    lastGeocoded.current = { lat, lon };
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lon, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA }, 600);
    reverseGeocode(lat, lon);
  }

  const onRegionChangeComplete = (r: Region) => {
    const d = metersBetween(r.latitude, r.longitude, lastGeocoded.current.lat, lastGeocoded.current.lon);
    if (d > 60) {
      lastGeocoded.current = { lat: r.latitude, lon: r.longitude };
      reverseGeocode(r.latitude, r.longitude);
    }
  };

  // ---- detect location -----------------------------------------------------

  async function detect() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setDenied(true); setLocating(false); return; }
      setDenied(false);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      flyTo(pos.coords.latitude, pos.coords.longitude);
    } catch {
      setLocating(false);
    }
  }

  // ---- render --------------------------------------------------------------

  return (
    <View style={{ gap: 14 }}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={onType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search a city or place"
          placeholderTextColor={C.faint}
          autoCorrect={false}
          style={[grotesk(16), styles.searchInput]}
        />
        {query.length > 0 && (
          <Pressable hitSlop={8} onPress={() => { setText(''); onChange(''); setResults([]); }}>
            <Ionicons name="close-circle" size={18} color={C.faint} />
          </Pressable>
        )}
      </View>

      {showResults ? (
        <View style={styles.results}>
          {results.map((r, i) => (
            <Pressable key={`${r.lat}-${r.lon}-${i}`} onPress={() => pick(r)}
              style={({ pressed }) => [styles.resultRow, i > 0 && styles.resultDivider, pressed && { backgroundColor: C.fill }]}>
              <Ionicons name="location" size={20} color={C.accent} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[grotesk(15, 'medium'), { color: C.ink }]}>{r.name}</Text>
                {!!r.subtitle && <Text numberOfLines={1} style={[grotesk(12.5), { color: C.muted, marginTop: 2 }]}>{r.subtitle}</Text>}
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          {/* Detect */}
          <Pressable onPress={detect} style={({ pressed }) => [styles.detect, pressed && { opacity: 0.85 }]}>
            {locating
              ? <ActivityIndicator size="small" color={C.accent} />
              : <Ionicons name="navigate-circle" size={18} color={C.accent} />}
            <Text style={[grotesk(14, 'semibold'), { color: C.accent, letterSpacing: 0.3 }]}>
              {locating ? 'Detecting…' : 'Detect my location'}
            </Text>
          </Pressable>

          {/* Map with a fixed center pin */}
          <View style={styles.mapCard}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={DEFAULT_REGION}
              onRegionChangeComplete={onRegionChangeComplete}
              showsPointsOfInterests={false}
              showsCompass={false}
              toolbarEnabled={false}
              userInterfaceStyle={C.paper === '#100F0D' ? 'dark' : 'light'}
            />
            <View style={styles.pinWrap} pointerEvents="none">
              <Ionicons name="location-sharp" size={38} color={C.accent} style={styles.pin} />
            </View>
            <Pressable onPress={detect} style={styles.recenter} hitSlop={6}>
              <Ionicons name="locate" size={18} color={C.accent} />
            </Pressable>
            {resolving && (
              <View style={styles.badge}>
                <ActivityIndicator size="small" color={C.accent} />
                <Text style={[grotesk(11, 'medium'), { color: C.ink70 }]}>Locating…</Text>
              </View>
            )}
          </View>

          {denied && (
            <Text style={[grotesk(12), { color: C.muted }]}>
              Location is off. Enable it in Settings, or search / drag the map.
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.ink, padding: 0 },
  results: {
    backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, paddingHorizontal: 15 },
  resultDivider: { borderTopWidth: 1, borderTopColor: C.hairline },
  detect: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    paddingVertical: 14, borderRadius: 999, backgroundColor: C.accentSoft,
  },
  mapCard: {
    height: 300, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    backgroundColor: C.photoEmpty,
  },
  pinWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  pin: { marginBottom: 34, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 2 } },
  recenter: {
    position: 'absolute', bottom: 12, right: 12,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: C.surface,
  },
});
