import type { Measurements } from "@/types";

type MeasurementProfile = {
  height: number; weight: number;
  bust: number; waist: number; hips: number;
  shoulderWidth: number; torsoLength: number; legLength: number;
  armLength: number; armGirth: number; thighGirth: number; calfGirth: number;
};

// Fuente: NCD Risk Factor Collaboration 2023 + ENS Chile
const AVERAGES: Record<string, Record<string, Record<string, MeasurementProfile>>> = {
  adult: {
    male: {
      slim:       { height:173, weight:62,  bust:88,  waist:74,  hips:90,  shoulderWidth:43, torsoLength:59, legLength:83, armLength:59, armGirth:28, thighGirth:50, calfGirth:34 },
      normal:     { height:173, weight:83,  bust:100, waist:88,  hips:98,  shoulderWidth:45, torsoLength:61, legLength:84, armLength:61, armGirth:32, thighGirth:56, calfGirth:37 },
      athletic:   { height:174, weight:82,  bust:104, waist:80,  hips:98,  shoulderWidth:47, torsoLength:61, legLength:85, armLength:62, armGirth:36, thighGirth:58, calfGirth:38 },
      overweight: { height:173, weight:100, bust:114, waist:104, hips:110, shoulderWidth:47, torsoLength:63, legLength:82, armLength:61, armGirth:35, thighGirth:64, calfGirth:41 },
    },
    female: {
      slim:       { height:159, weight:50, bust:84,  waist:64, hips:92,  shoulderWidth:37, torsoLength:55, legLength:77, armLength:53, armGirth:24, thighGirth:50, calfGirth:33 },
      normal:     { height:159, weight:70, bust:98,  waist:80, hips:104, shoulderWidth:39, torsoLength:57, legLength:78, armLength:55, armGirth:27, thighGirth:57, calfGirth:36 },
      athletic:   { height:160, weight:63, bust:92,  waist:68, hips:96,  shoulderWidth:39, torsoLength:56, legLength:79, armLength:55, armGirth:28, thighGirth:54, calfGirth:35 },
      overweight: { height:159, weight:88, bust:112, waist:96, hips:118, shoulderWidth:41, torsoLength:59, legLength:76, armLength:55, armGirth:31, thighGirth:65, calfGirth:40 },
    },
  },
  teen: {
    male: {
      slim:       { height:168, weight:54, bust:82,  waist:68, hips:82,  shoulderWidth:41, torsoLength:56, legLength:80, armLength:56, armGirth:25, thighGirth:48, calfGirth:32 },
      normal:     { height:170, weight:65, bust:90,  waist:76, hips:90,  shoulderWidth:43, torsoLength:58, legLength:82, armLength:58, armGirth:28, thighGirth:52, calfGirth:34 },
      athletic:   { height:171, weight:68, bust:96,  waist:74, hips:92,  shoulderWidth:44, torsoLength:58, legLength:83, armLength:59, armGirth:32, thighGirth:54, calfGirth:36 },
      overweight: { height:168, weight:82, bust:104, waist:90, hips:100, shoulderWidth:44, torsoLength:60, legLength:80, armLength:57, armGirth:31, thighGirth:58, calfGirth:38 },
    },
    female: {
      slim:       { height:156, weight:45, bust:78,  waist:62, hips:86,  shoulderWidth:36, torsoLength:53, legLength:74, armLength:51, armGirth:22, thighGirth:46, calfGirth:31 },
      normal:     { height:158, weight:57, bust:88,  waist:72, hips:96,  shoulderWidth:37, torsoLength:55, legLength:76, armLength:53, armGirth:24, thighGirth:52, calfGirth:33 },
      athletic:   { height:159, weight:56, bust:86,  waist:66, hips:92,  shoulderWidth:38, torsoLength:55, legLength:77, armLength:53, armGirth:25, thighGirth:51, calfGirth:33 },
      overweight: { height:156, weight:72, bust:100, waist:84, hips:108, shoulderWidth:38, torsoLength:57, legLength:74, armLength:52, armGirth:27, thighGirth:59, calfGirth:37 },
    },
  },
  // Niños sin distinción de sexo
  child: {
    any: {
      slim:       { height:132, weight:25, bust:64, waist:56, hips:68, shoulderWidth:30, torsoLength:42, legLength:62, armLength:38, armGirth:17, thighGirth:34, calfGirth:24 },
      normal:     { height:138, weight:33, bust:70, waist:62, hips:74, shoulderWidth:32, torsoLength:44, legLength:66, armLength:40, armGirth:19, thighGirth:38, calfGirth:26 },
      athletic:   { height:140, weight:36, bust:74, waist:62, hips:76, shoulderWidth:33, torsoLength:44, legLength:68, armLength:41, armGirth:20, thighGirth:40, calfGirth:27 },
      overweight: { height:136, weight:44, bust:80, waist:70, hips:84, shoulderWidth:33, torsoLength:46, legLength:64, armLength:40, armGirth:21, thighGirth:44, calfGirth:29 },
    },
  },
  // Mayores (sin "atlético" en la tabla)
  senior: {
    male: {
      slim:       { height:170, weight:66, bust:94,  waist:82,  hips:94,  shoulderWidth:43, torsoLength:59, legLength:80, armLength:57, armGirth:27, thighGirth:48, calfGirth:33 },
      normal:     { height:170, weight:82, bust:104, waist:96,  hips:104, shoulderWidth:44, torsoLength:61, legLength:80, armLength:58, armGirth:30, thighGirth:54, calfGirth:35 },
      overweight: { height:169, weight:98, bust:116, waist:110, hips:112, shoulderWidth:45, torsoLength:62, legLength:78, armLength:58, armGirth:32, thighGirth:60, calfGirth:38 },
    },
    female: {
      slim:       { height:156, weight:56, bust:90,  waist:78,  hips:98,  shoulderWidth:37, torsoLength:54, legLength:73, armLength:51, armGirth:24, thighGirth:50, calfGirth:32 },
      normal:     { height:156, weight:72, bust:104, waist:90,  hips:110, shoulderWidth:38, torsoLength:56, legLength:73, armLength:52, armGirth:27, thighGirth:57, calfGirth:35 },
      overweight: { height:155, weight:88, bust:116, waist:104, hips:122, shoulderWidth:39, torsoLength:58, legLength:71, armLength:52, armGirth:29, thighGirth:64, calfGirth:38 },
    },
  },
};

type AutoFillResult = Pick<
  Measurements,
  "height" | "bust" | "waist" | "hips" | "shoulderWidth" | "torsoLength" |
  "legLength" | "armLength" | "armGirth" | "thighGirth" | "calfGirth" | "weight"
>;

export function getAverageMeasurements(
  sex: string | null | undefined,
  ageGroup: string | null | undefined,
  bodyType: string | null | undefined,
): AutoFillResult | null {
  if (!ageGroup || !bodyType) return null;

  const ageData = AVERAGES[ageGroup];
  if (!ageData) return null;

  // Niños: sin distinción de sexo
  const sexKey = ageGroup === "child" ? "any" : (sex ?? null);
  if (!sexKey) return null;

  const profile = ageData[sexKey]?.[bodyType];
  if (!profile) return null; // e.g., senior + athletic no existe

  return {
    height:       profile.height,
    bust:         profile.bust,
    waist:        profile.waist,
    hips:         profile.hips,
    shoulderWidth: profile.shoulderWidth,
    torsoLength:  profile.torsoLength,
    legLength:    profile.legLength,
    armLength:    profile.armLength,
    armGirth:     profile.armGirth,
    thighGirth:   profile.thighGirth,
    calfGirth:    profile.calfGirth,
    weight:       profile.weight,
  };
}
