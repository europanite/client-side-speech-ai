/** Voices supported by the pinned kokoro-js-jp@0.2.0 browser runtime. */
export type TtsVoice = { id: string; label: string; language: "en" | "ja" };

export const TTS_VOICE_GROUPS = [
  { prefix: "af_", label: "English (US) — female" },
  { prefix: "am_", label: "English (US) — male" },
  { prefix: "bf_", label: "English (UK) — female" },
  { prefix: "bm_", label: "English (UK) — male" },
  { prefix: "jf_", label: "Japanese — female" },
  { prefix: "jm_", label: "Japanese — male" },
] as const;

export const TTS_VOICES: readonly TtsVoice[] = [
  // American English
  { id: "af_heart", label: "Heart", language: "en" },
  { id: "af_alloy", label: "Alloy", language: "en" },
  { id: "af_aoede", label: "Aoede", language: "en" },
  { id: "af_bella", label: "Bella", language: "en" },
  { id: "af_jessica", label: "Jessica", language: "en" },
  { id: "af_kore", label: "Kore", language: "en" },
  { id: "af_nicole", label: "Nicole", language: "en" },
  { id: "af_nova", label: "Nova", language: "en" },
  { id: "af_river", label: "River", language: "en" },
  { id: "af_sarah", label: "Sarah", language: "en" },
  { id: "af_sky", label: "Sky", language: "en" },
  { id: "am_adam", label: "Adam", language: "en" },
  { id: "am_echo", label: "Echo", language: "en" },
  { id: "am_eric", label: "Eric", language: "en" },
  { id: "am_fenrir", label: "Fenrir", language: "en" },
  { id: "am_liam", label: "Liam", language: "en" },
  { id: "am_michael", label: "Michael", language: "en" },
  { id: "am_onyx", label: "Onyx", language: "en" },
  { id: "am_puck", label: "Puck", language: "en" },
  { id: "am_santa", label: "Santa", language: "en" },
  // British English
  { id: "bf_alice", label: "Alice", language: "en" },
  { id: "bf_emma", label: "Emma", language: "en" },
  { id: "bf_isabella", label: "Isabella", language: "en" },
  { id: "bf_lily", label: "Lily", language: "en" },
  { id: "bm_daniel", label: "Daniel", language: "en" },
  { id: "bm_fable", label: "Fable", language: "en" },
  { id: "bm_george", label: "George", language: "en" },
  { id: "bm_lewis", label: "Lewis", language: "en" },
  // Japanese
  { id: "jf_alpha", label: "Alpha", language: "ja" },
  { id: "jf_gongitsune", label: "Gongitsune", language: "ja" },
  { id: "jf_nezumi", label: "Nezumi", language: "ja" },
  { id: "jf_tebukuro", label: "Tebukuro", language: "ja" },
  { id: "jm_kumo", label: "Kumo", language: "ja" },
];
