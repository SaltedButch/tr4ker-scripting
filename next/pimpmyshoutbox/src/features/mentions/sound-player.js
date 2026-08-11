let audioContext = null;

function getAudioContext() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    if (!audioContext) audioContext = new AudioContextConstructor();
    return audioContext;
}

function isPixabayUrl(value) {
    try {
        const url = new URL(String(value || ''));
        return url.protocol === 'https:' && url.hostname.toLowerCase() === 'cdn.pixabay.com';
    } catch {
        return false;
    }
}

function normalizeVolume(value) {
    const parsed = Number(value);
    return Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 100));
}

export function createMentionSoundPlayer({ http }) {
    const customBufferCache = new Map();
    let currentVolumePercent = 100;

    async function playCustom(url) {
        if (!isPixabayUrl(url)) return false;
        const context = getAudioContext();
        if (!context) return false;
        try {
            if (context.state === 'suspended') await context.resume();
            let bufferPromise = customBufferCache.get(url);
            if (!bufferPromise) {
                bufferPromise = http.externalArrayBuffer(url)
                    .then((audioData) => context.decodeAudioData(audioData.slice(0)))
                    .catch((error) => {
                        customBufferCache.delete(url);
                        throw error;
                    });
                customBufferCache.set(url, bufferPromise);
            }
            const source = context.createBufferSource();
            const gain = context.createGain();
            source.buffer = await bufferPromise;
            gain.gain.value = Math.max(0, Math.min(1, currentVolumePercent / 100));
            source.connect(gain);
            gain.connect(context.destination);
            source.start();
            return true;
        } catch {
            return false;
        }
    }

    async function play(settings) {
        currentVolumePercent = normalizeVolume(settings.soundVolumePercent);
        const volume = currentVolumePercent / 100;
        if (volume <= 0) return true;
        if (settings.soundStyle === 'custom') return playCustom(settings.soundCustomUrl);
        const context = getAudioContext();
        if (!context) return false;
        try {
            if (context.state === 'suspended') await context.resume();
        } catch {
            return false;
        }

        const now = context.currentTime;
        function scheduleTone({ type = 'sine', startOffset = 0, duration = .24, fromFrequency = 880, toFrequency = 1320, peakGain = .1, attack = .015, releaseOffset = null }) {
            const start = now + Math.max(0, startOffset);
            const stop = start + Math.max(.05, duration);
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(fromFrequency, start);
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, toFrequency), stop);
            gain.gain.setValueAtTime(.0001, start);
            gain.gain.exponentialRampToValueAtTime(Math.max(.0002, peakGain * volume), start + Math.min(attack, duration / 2));
            gain.gain.exponentialRampToValueAtTime(.0001, releaseOffset === null ? stop : start + Math.min(duration, releaseOffset));
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(start);
            oscillator.stop(stop);
        }

        if (settings.soundStyle === 'soft') {
            scheduleTone({ type: 'triangle', duration: .34, fromFrequency: 440, toFrequency: 700, peakGain: .075, attack: .018, releaseOffset: .3 });
        } else if (settings.soundStyle === 'bell') {
            scheduleTone({ type: 'triangle', duration: .48, fromFrequency: 1040, toFrequency: 1680, peakGain: .095, attack: .01, releaseOffset: .4 });
            scheduleTone({ type: 'sine', startOffset: .025, duration: .42, fromFrequency: 1560, toFrequency: 2280, peakGain: .048, attack: .008, releaseOffset: .32 });
        } else if (settings.soundStyle === 'double') {
            scheduleTone({ type: 'square', duration: .16, fromFrequency: 620, toFrequency: 980, peakGain: .07, attack: .01, releaseOffset: .12 });
            scheduleTone({ type: 'square', startOffset: .2, duration: .17, fromFrequency: 760, toFrequency: 1180, peakGain: .082, attack: .01, releaseOffset: .12 });
        } else if (settings.soundStyle === 'chime') {
            scheduleTone({ type: 'sine', duration: .32, fromFrequency: 660, toFrequency: 990, peakGain: .08, attack: .012, releaseOffset: .27 });
            scheduleTone({ type: 'sine', startOffset: .16, duration: .38, fromFrequency: 990, toFrequency: 1480, peakGain: .07, attack: .012, releaseOffset: .31 });
        } else if (settings.soundStyle === 'pop') {
            scheduleTone({ type: 'triangle', duration: .15, fromFrequency: 310, toFrequency: 540, peakGain: .09, attack: .008, releaseOffset: .11 });
        } else {
            scheduleTone({ type: 'sine', duration: .26, fromFrequency: 920, toFrequency: 1560, peakGain: .09, attack: .012, releaseOffset: .22 });
        }
        return true;
    }

    return Object.freeze({ play });
}
