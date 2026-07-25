const DELETED_MOMENTS_KEY = "human-conversation-deleted-feed-moments";
const outputByMoment = {
  "key-takeaway": "A lesson worth remembering.",
  "human-moment": "A moment worth sharing.",
};

let posts = [];
let audios = [];
let currentIndex = 0;
let autoplayFeed = false;
const storySteps = [...document.querySelectorAll(".story-steps li")];
const outputText = document.querySelector("#outputText");
const playFeedButton = document.querySelector("#playFeedButton");
const nextMomentButton = document.querySelector("#nextMomentButton");
const toast = document.querySelector("#toast");

function getDeletedMoments() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DELETED_MOMENTS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveDeletedMoments(deletedMoments) {
  localStorage.setItem(DELETED_MOMENTS_KEY, JSON.stringify([...deletedMoments]));
}

function formatTime(seconds) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 1600);
}

function syncPosts() {
  posts = [...document.querySelectorAll(".feed-post:not([hidden])")];
  audios = posts.map((post) => post.querySelector("audio"));
  posts.forEach((post, index) => {
    post.dataset.post = String(index);
    post.querySelector(".post-number").textContent = String(index + 1).padStart(2, "0");
  });
  storySteps.forEach((step, index) => {
    step.hidden = index >= posts.length;
  });
  currentIndex = Math.min(currentIndex, Math.max(0, posts.length - 1));
}

function setCurrent(index, shouldScroll = false) {
  if (!posts.length) return;
  currentIndex = (index + posts.length) % posts.length;
  posts.forEach((post, postIndex) => post.classList.toggle("is-active", postIndex === currentIndex));
  storySteps.forEach((step, stepIndex) => step.classList.toggle("is-current", stepIndex === currentIndex));
  outputText.textContent = outputByMoment[posts[currentIndex].dataset.momentId];
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
  if (!posts[index]) return;
  setCurrent(index);
  const audio = audios[index];
  if (audio.paused) {
    stopOthers(audio);
    audio.play();
  } else {
    audio.pause();
  }
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

function bindPost(post, initialIndex) {
  buildWaveform(post, initialIndex);
  const audio = post.querySelector("audio");
  const currentTime = post.querySelector(".current-time");
  const bars = [...post.querySelectorAll(".waveform i")];

  post.querySelector(".play-button").addEventListener("click", () => toggleAudio(posts.indexOf(post)));
  audio.addEventListener("play", () => {
    const activeIndex = posts.indexOf(post);
    if (activeIndex < 0) return;
    setCurrent(activeIndex);
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
    const activeIndex = posts.indexOf(post);
    if (autoplayFeed && activeIndex >= 0 && activeIndex < posts.length - 1) {
      setTimeout(() => {
        setCurrent(activeIndex + 1, true);
        audios[activeIndex + 1].play();
      }, 650);
    } else {
      autoplayFeed = false;
    }
  });

  post.querySelector(".keep-button").addEventListener("click", (event) => {
    event.currentTarget.classList.toggle("is-kept");
  });

  post.querySelector(".share-button").addEventListener("click", async () => {
    const activeIndex = posts.indexOf(post);
    const shareData = {
      title: "A human moment worth hearing",
      text: `${post.querySelector(".post-heading h2").textContent} - Human Conversation`,
      url: `${window.location.href.split("#")[0]}#moment-${activeIndex + 1}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast("Link copied");
      }
    } catch (error) {
      if (error.name !== "AbortError") console.error(error);
    }
  });

  post.querySelector(".delete-button").addEventListener("click", () => {
    if (!window.confirm("Remove this clip from your feed?")) return;
    audio.pause();
    const deletedMoments = getDeletedMoments();
    deletedMoments.add(post.dataset.momentId);
    saveDeletedMoments(deletedMoments);
    post.classList.add("is-removing");
    setTimeout(() => {
      post.hidden = true;
      post.classList.remove("is-removing");
      syncPosts();
      if (posts.length) {
        setCurrent(currentIndex);
      } else {
        playFeedButton.disabled = true;
        nextMomentButton.disabled = true;
        outputText.textContent = "Your feed is clear.";
      }
      showToast("Clip removed");
    }, 180);
  });
}

const deletedMoments = getDeletedMoments();
document.querySelectorAll(".feed-post").forEach((post) => {
  if (deletedMoments.has(post.dataset.momentId)) post.hidden = true;
});
syncPosts();
posts.forEach(bindPost);
setCurrent(0);

playFeedButton.addEventListener("click", () => {
  if (!posts.length) return;
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
    const visibleIndex = posts.indexOf(mostVisible.target);
    if (visibleIndex >= 0) setCurrent(visibleIndex);
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
