const posts = [...document.querySelectorAll(".feed-post")];
const audios = posts.map((post) => post.querySelector("audio"));
const storySteps = [...document.querySelectorAll(".story-steps li")];
const outputText = document.querySelector("#outputText");
const playFeedButton = document.querySelector("#playFeedButton");
const nextMomentButton = document.querySelector("#nextMomentButton");
const toast = document.querySelector("#toast");
const outputs = [
  "A reason to join the class.",
  "A lesson worth remembering.",
  "A moment worth sharing.",
];

let currentIndex = 0;
let autoplayFeed = false;

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function buildWaveform(post, postIndex) {
  const waveform = post.querySelector(".waveform");
  const heights = Array.from({ length: 44 }, (_, index) => {
    const wave = Math.sin((index + 1) * (0.67 + postIndex * 0.08));
    const pulse = Math.sin((index + 3) * 1.71);
    return Math.round(13 + Math.abs(wave * 23) + Math.abs(pulse * 9));
  });
  waveform.innerHTML = heights.map((height) => `<i style="--height:${height}px"></i>`).join("");
  waveform.addEventListener("click", (event) => {
    const audio = post.querySelector("audio");
    if (!audio.duration) return;
    const bounds = waveform.getBoundingClientRect();
    audio.currentTime = ((event.clientX - bounds.left) / bounds.width) * audio.duration;
  });
}

function setCurrent(index, shouldScroll = false) {
  currentIndex = (index + posts.length) % posts.length;
  posts.forEach((post, postIndex) => post.classList.toggle("is-active", postIndex === currentIndex));
  storySteps.forEach((step, stepIndex) => step.classList.toggle("is-current", stepIndex === currentIndex));
  outputText.textContent = outputs[currentIndex];
  if (shouldScroll) posts[currentIndex].scrollIntoView({ behavior: "smooth", block: "center" });
}

function stopOthers(activeAudio) {
  audios.forEach((audio, index) => {
    if (audio !== activeAudio) {
      audio.pause();
      posts[index].classList.remove("is-playing");
    }
  });
}

function toggleAudio(index) {
  setCurrent(index);
  const audio = audios[index];
  if (audio.paused) {
    stopOthers(audio);
    audio.play();
  } else {
    audio.pause();
  }
}

posts.forEach((post, index) => {
  buildWaveform(post, index);
  const audio = audios[index];
  const button = post.querySelector(".play-button");
  const currentTime = post.querySelector(".current-time");
  const bars = [...post.querySelectorAll(".waveform i")];

  button.addEventListener("click", () => toggleAudio(index));
  audio.addEventListener("play", () => {
    setCurrent(index);
    post.classList.add("is-playing");
  });
  audio.addEventListener("pause", () => post.classList.remove("is-playing"));
  audio.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(audio.currentTime);
    const progress = audio.duration ? audio.currentTime / audio.duration : 0;
    bars.forEach((bar, barIndex) => bar.classList.toggle("is-past", barIndex / bars.length <= progress));
  });
  audio.addEventListener("ended", () => {
    post.classList.remove("is-playing");
    if (autoplayFeed && index < posts.length - 1) {
      setTimeout(() => {
        setCurrent(index + 1, true);
        audios[index + 1].play();
      }, 650);
    } else {
      autoplayFeed = false;
    }
  });

  post.querySelector(".keep-button").addEventListener("click", (event) => {
    event.currentTarget.classList.toggle("is-kept");
  });

  post.querySelector(".share-button").addEventListener("click", async () => {
    const shareData = {
      title: "A human moment worth hearing",
      text: `${post.querySelector(".post-heading h2").textContent} - Human Conversation`,
      url: `${window.location.href.split("#")[0]}#moment-${index + 1}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.classList.add("is-visible");
        setTimeout(() => toast.classList.remove("is-visible"), 1600);
      }
    } catch (error) {
      if (error.name !== "AbortError") console.error(error);
    }
  });
});

playFeedButton.addEventListener("click", () => {
  autoplayFeed = true;
  setCurrent(0, true);
  audios[0].currentTime = 0;
  audios[0].play();
});

nextMomentButton.addEventListener("click", () => setCurrent(currentIndex + 1, true));
storySteps.forEach((step, index) => step.addEventListener("click", () => setCurrent(index, true)));

const dialog = document.querySelector("#aboutDialog");
document.querySelector("#infoButton").addEventListener("click", () => dialog.showModal());
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

const hashMatch = window.location.hash.match(/moment-(\d)/);
if (hashMatch) setCurrent(Number(hashMatch[1]) - 1, true);

const observer = new IntersectionObserver((entries) => {
  const mostVisible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (mostVisible && mostVisible.intersectionRatio > 0.55) {
    setCurrent(Number(mostVisible.target.dataset.post));
  }
}, { threshold: [0.55, 0.75] });
posts.forEach((post) => observer.observe(post));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowRight") setCurrent(currentIndex + 1, true);
  if (event.key === "ArrowUp" || event.key === "ArrowLeft") setCurrent(currentIndex - 1, true);
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    toggleAudio(currentIndex);
  }
});
