import { Conf } from "../globals/globals";
import { File } from "../classes/Post";
import Volume from "./Volume";

const Sound = {
  /** Add event listeners for videos with audio from a third party */
  setupSync(video: HTMLVideoElement, audio: HTMLAudioElement) {
    audio.addEventListener('playing', () => {
      video.currentTime = audio.currentTime % video.duration;
      video.play();
    });

    audio.addEventListener('play', () => {
      video.currentTime = audio.currentTime % video.duration;
      video.play();
    });

    audio.addEventListener('pause', () => {
      video.pause();
    });

    audio.addEventListener('seeked', () => {
      video.currentTime = audio.currentTime % video.duration;
    });

    audio.addEventListener('ratechange', () => {
      video.currentTime = audio.currentTime;
      video.playbackRate = audio.playbackRate;
    });

    audio.addEventListener('waiting', () => {
      video.currentTime = audio.currentTime % video.duration;
      video.pause();
    });

    audio.addEventListener('canplay', () => {
      if (audio.currentTime < .1) video.currentTime = 0;
    }, { once: true });
  },

  setupSoundpost(el: HTMLElement, file: File) {
    const soundUrlMatch = file.name.match(/\[sound=([^\]]+)]/i);
    if (!soundUrlMatch) return;

    let src = decodeURIComponent(soundUrlMatch[1]);
    if (!src.startsWith('http')) {
      src = `https://${src}`;
    }

    const audioEl = new Audio(src);
    Volume.setup(audioEl);
    if (el instanceof HTMLVideoElement) {
      Sound.setupSync(el, audioEl);
      el.controls = false;
    }
    audioEl.loop = true;
    audioEl.controls = Conf['Show Controls'];
    audioEl.autoplay = Conf['Autoplay'];

    el.after(audioEl);
    file.audio = audioEl;
  }
};

export default Sound;
