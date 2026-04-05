// ─── YARDIMCILAR ──────────────────────────────────────────────────

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]
const getVolume  = ()    => parseFloat(localStorage.getItem('escord_volume') ?? '0.8')
const isMuted    = (key) => localStorage.getItem(`escord_sound_${key}`) === 'false'

function playSound(src) {
  if (!src) return
  const audio = new Audio(src)
  audio.volume = getVolume()
  audio.play().catch(() => {})
  return audio
}

// ─── RİNGTONE (rastgele) ─────────────────────────────────────────

const RINGTONES = [
  '/sounds/ringtones/bedelini-odedigimiz-hayati-baskalari-yasiyor.mp3',
  '/sounds/ringtones/efendim-burhan-abi-meme-hastane.mp3',
  '/sounds/ringtones/emir-sovuss.mp3',
  '/sounds/ringtones/kotu-cocuk.mp3',
  '/sounds/ringtones/lvbel-c5-muzik.mp3',
  '/sounds/ringtones/manifest.mp3',
  '/sounds/ringtones/pantolonlarim-yuktu.mp3',
  '/sounds/ringtones/telefonum-caliyor.mp3',
  '/sounds/ringtones/testo-taylan-ev-ziyareti.mp3',
  '/sounds/ringtones/youre-phone-is-ringing.mp3',
  '/sounds/ringtones/zoktayyyy.mp3',
]

let activeRingtone = null

export function startRingtone() {
  stopRingtone()
  if (isMuted('ringtone')) return
  activeRingtone = new Audio(pickRandom(RINGTONES))
  activeRingtone.loop = true
  activeRingtone.volume = getVolume()
  activeRingtone.play().catch(() => {})
}

export function stopRingtone() {
  if (activeRingtone) {
    activeRingtone.pause()
    activeRingtone.currentTime = 0
    activeRingtone = null
  }
}

// ─── BİLDİRİM (rastgele, aynı ses art arda çalmaz) ───────────────

const NOTIFICATIONS = [
  '/sounds/notifications/notification_1.mp3',
]

let lastNotifIndex = -1

export function playMessageNotification() {
  if (isMuted('message')) return
  let i
  do { i = Math.floor(Math.random() * NOTIFICATIONS.length) }
  while (i === lastNotifIndex && NOTIFICATIONS.length > 1)
  lastNotifIndex = i
  playSound(NOTIFICATIONS[i])
}

// ─── ARAMA KABUL — HER İKİ TARAFA ────────────────────────────────

export function playCallJoined() {
  stopRingtone()
  if (isMuted('voice')) return
  playSound('/sounds/join.mp3')
}

// ─── ARAMA REDDEDİLDİ ────────────────────────────────────────────

export function playCallDeclined() {
  stopRingtone()
  if (isMuted('voice')) return
  playSound('/sounds/decline.mp3')
}

// ─── DİĞER SESLER ────────────────────────────────────────────────

export function playLeaveSound() {
  if (isMuted('voice')) return
  playSound('/sounds/leave.mp3')
}

export function playMentionSound() {
  if (isMuted('mention')) return
  playSound('/sounds/mention.mp3')
}

// ─── AYARLAR ─────────────────────────────────────────────────────

export function setMasterVolume(val) {
  localStorage.setItem('escord_volume', String(val))
}

export function toggleSound(key, enabled) {
  localStorage.setItem(`escord_sound_${key}`, String(enabled))
}

// Backward compatibility for VoiceRoom.jsx
export const sounds = {
  voiceJoin: playCallJoined,
  voiceLeave: playLeaveSound
}
