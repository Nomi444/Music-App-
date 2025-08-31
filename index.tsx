/**
 * @fileoverview Control real time music with a MIDI controller
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlaybackState, Prompt } from './types';
import { GoogleGenAI, LiveMusicFilteredPrompt } from '@google/genai';
import { PromptDjMidi } from './components/PromptDjMidi';
import { ToastMessage } from './components/ToastMessage';
import { LiveMusicHelper } from './utils/LiveMusicHelper';
import { AudioAnalyser } from './utils/AudioAnalyser';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'lyria-realtime-exp';

function main() {
  const allPrompts = buildInitialPrompts();
  const liveMusicHelper = new LiveMusicHelper(ai, model);

  const pdjMidi = new PromptDjMidi(allPrompts, liveMusicHelper);
  document.body.appendChild(pdjMidi);

  const toastMessage = new ToastMessage();
  document.body.appendChild(toastMessage);

  liveMusicHelper.setWeightedPrompts(allPrompts);

  const audioAnalyser = new AudioAnalyser(liveMusicHelper.audioContext);
  liveMusicHelper.extraDestination = audioAnalyser.node;

  pdjMidi.addEventListener('prompts-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<Map<string, Prompt>>;
    const prompts = customEvent.detail;
    liveMusicHelper.setWeightedPrompts(prompts);
  }));

  pdjMidi.addEventListener('volume-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<number>;
    liveMusicHelper.setVolume(customEvent.detail);
  }));

  pdjMidi.addEventListener('play-pause', () => {
    liveMusicHelper.playPause();
  });

  liveMusicHelper.addEventListener('playback-state-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<PlaybackState>;
    const playbackState = customEvent.detail;
    pdjMidi.playbackState = playbackState;
    playbackState === 'playing' ? audioAnalyser.start() : audioAnalyser.stop();
  }));

  liveMusicHelper.addEventListener('filtered-prompt', ((e: Event) => {
    const customEvent = e as CustomEvent<LiveMusicFilteredPrompt>;
    const filteredPrompt = customEvent.detail;
    toastMessage.show(filteredPrompt.filteredReason!)
    pdjMidi.addFilteredPrompt(filteredPrompt.text!);
  }));

  const errorToast = ((e: Event) => {
    const customEvent = e as CustomEvent<string>;
    const error = customEvent.detail;
    toastMessage.show(error);
  });

  liveMusicHelper.addEventListener('error', errorToast);
  pdjMidi.addEventListener('error', errorToast);

  audioAnalyser.addEventListener('audio-level-changed', ((e: Event) => {
    const customEvent = e as CustomEvent<number>;
    const level = customEvent.detail;
    pdjMidi.audioLevel = level;
  }));

}

function buildInitialPrompts() {
  // Pick 3 random prompts to start at weight = 1
  const startOn = [...DEFAULT_PROMPTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const prompts = new Map<string, Prompt>();

  for (let i = 0; i < DEFAULT_PROMPTS.length; i++) {
    const promptId = `prompt-${i}`;
    const prompt = DEFAULT_PROMPTS[i];
    const { text, color, category, artist, imageUrl } = prompt;
    prompts.set(promptId, {
      promptId,
      text,
      weight: startOn.includes(prompt) ? 1 : 0,
      cc: i,
      color,
      category,
      artist,
      imageUrl,
    });
  }

  return prompts;
}

const DEFAULT_PROMPTS = [
  // English
  { color: '#814094', text: 'Synth Pop waves', category: 'English', artist: 'The Weeknd', imageUrl: 'https://picsum.photos/seed/synthpop/64' },
  { color: '#B6334D', text: 'Dreamy Alt-Pop', category: 'English', artist: 'Billie Eilish', imageUrl: 'https://picsum.photos/seed/dreampop/64' },
  { color: '#2B73B4', text: 'Indie Folk harmony', category: 'English', artist: 'Bon Iver', imageUrl: 'https://picsum.photos/seed/indiefolk/64' },
  { color: '#E19534', text: 'Catchy Pop anthem', category: 'English', artist: 'Taylor Swift', imageUrl: 'https://picsum.photos/seed/popanthem/64' },
  { color: '#4C917F', text: 'Psychedelic Rock solo', category: 'English', artist: 'Tame Impala', imageUrl: 'https://picsum.photos/seed/psychrock/64' },
  { color: '#D44F6A', text: 'Funk bassline', category: 'English', artist: 'Dua Lipa', imageUrl: 'https://picsum.photos/seed/funkbass/64' },
  { color: '#1E3264', text: 'Soaring Arena Rock', category: 'English', artist: 'Coldplay', imageUrl: 'https://picsum.photos/seed/arenarock/64' },
  { color: '#F59B23', text: 'Acoustic Singer-Songwriter', category: 'English', artist: 'Ed Sheeran', imageUrl: 'https://picsum.photos/seed/acoustic/64' },

  // Punjabi
  { color: '#F4981C', text: 'Modern Bhangra', category: 'Punjabi', artist: 'Diljit Dosanjh', imageUrl: 'https://picsum.photos/seed/modernbhangra/64' },
  { color: '#509BF5', text: 'Punjabi Pop anthem', category: 'Punjabi', artist: 'AP Dhillon', imageUrl: 'https://picsum.photos/seed/punjabipop/64' },
  { color: '#AF2896', text: 'Folk rhythm', category: 'Punjabi', artist: 'Sidhu Moose Wala', imageUrl: 'https://picsum.photos/seed/punjabifolk/64' },
  { color: '#777777', text: 'Sufi Soul', category: 'Punjabi', artist: 'Satinder Sartaaj', imageUrl: 'https://picsum.photos/seed/sufisoul/64' },

  // Urdu
  { color: '#4B9084', text: 'Modern Ghazal', category: 'Urdu', artist: 'Atif Aslam', imageUrl: 'https://picsum.photos/seed/ghazal/64' },
  { color: '#B4304D', text: 'Mystical Qawwali', category: 'Urdu', artist: 'Nusrat Fateh Ali Khan', imageUrl: 'https://picsum.photos/seed/qawwali/64' },
  { color: '#FF4632', text: 'Urdu Rock ballad', category: 'Urdu', artist: 'Ali Zafar', imageUrl: 'https://picsum.photos/seed/urdurock/64' },
  { color: '#0D72EC', text: 'Classical Fusion', category: 'Urdu', artist: 'Abida Parveen', imageUrl: 'https://picsum.photos/seed/classical/64' },
  
  // Hip Hop
  { color: '#BA5D07', text: 'Lyrical Conscious Rap', category: 'Hip Hop', artist: 'Kendrick Lamar', imageUrl: 'https://picsum.photos/seed/consciousrap/64' },
  { color: '#8D67AB', text: 'Chill Lo-fi Beat', category: 'Hip Hop', artist: 'J Dilla', imageUrl: 'https://picsum.photos/seed/lofi/64' },
  { color: '#8C1932', text: 'Melodic Trap', category: 'Hip Hop', artist: 'Travis Scott', imageUrl: 'https://picsum.photos/seed/melodictrap/64' },
  { color: '#1E3264', text: 'Atmospheric Toronto Sound', category: 'Hip Hop', artist: 'Drake', imageUrl: 'https://picsum.photos/seed/torontosound/64' },
  { color: '#E8115B', text: 'Jazz Rap flow', category: 'Hip Hop', artist: 'J. Cole', imageUrl: 'https://picsum.photos/seed/jazzrap/64' },
];


main();