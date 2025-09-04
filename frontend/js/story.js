const API = (typeof window !== "undefined" && window.API_BASE) ? window.API_BASE : "/api/stories";

// אלמנטים (בטוח: לא ניפול אם חלק לא קיימים בעמוד)
const els = {
  rail: document.getElementById("stories-rail"),
  caption: document.getElementById("caption"),
  media: document.getElementById("media"),
  postBtn: document.getElementById("post-story"),
  viewer: document.getElementById("viewer"),
  viewerMedia: document.getElementById("viewer-media"),
  viewerName: document.getElementById("viewer-name"),
  viewerTime: document.getElementById("viewer-time"),
  viewerAvatar: document.getElementById("viewer-avatar"),
  viewerClose: document.getElementById("viewer-close"),
  currentUserName: document.getElementById("current-user-name"),
  currentUserPic: document.getElementById("current-user-pic"),
  progress: document.getElementById("progress"),
};

// -------- helpers --------
function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem("loggedInUser") || "{}"); }
  catch { return {}; }
}

function fmtTimeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "לפני רגע";
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שעות`;
  const day = Math.floor(hr / 24);
  return `לפני ${day} ימים`;
}

function renderRing(story) {
  const wrap = document.createElement("div");
  wrap.className = "story-ring";
  wrap.dataset.id = story._id;

  const ring = document.createElement("div");
  ring.className = "ring";
  const inner = document.createElement("div");
  inner.className = "inner";

  const img = document.createElement("img");
  img.src = story.profilePic || "/assets/Photos/defaultprfl.png";
  img.alt = story.username;

  inner.appendChild(img);
  ring.appendChild(inner);
  wrap.appendChild(ring);

  const uname = document.createElement("div");
  uname.className = "story-username";
  uname.textContent = story.username;
  wrap.appendChild(uname);

  wrap.addEventListener("click", () => openViewer(story));
  return wrap;
}

// -------- API --------
async function loadStories() {
  if (!els.rail) return;
  els.rail.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#9aa4b2">טוען סטוריז…</div>`;
  try {
    const res = await fetch(API, { cache: "no-store" });
    if (!res.ok) throw new Error("שגיאה בטעינת סטוריז");
    const stories = await res.json();
    els.rail.innerHTML = "";
    if (!stories.length) {
      els.rail.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#9aa4b2">אין עדיין סטוריז. תעלה אחד 😉</div>`;
      return;
    }
    for (const s of stories) els.rail.appendChild(renderRing(s));
  } catch (e) {
    console.error(e);
    els.rail.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#e68484">נכשלה טעינת הסטוריז</div>`;
  }
}

async function uploadStory() {
  const user = getLoggedInUser();
  if (!user?._id || !user?.username) {
    alert("לא זוהה משתמש מחובר (חסר _id/username ב-localStorage.loggedInUser)");
    return;
  }
  if (!els.media) {
    alert("לא נמצא input#media בעמוד");
    return;
  }
  const file = els.media.files?.[0];
  if (!file) {
    // אם אין קובץ נבחר – נפתח את בוחר הקבצים
    els.media.click();
    return;
  }

  const fd = new FormData();
  fd.append("userId", user._id);
  fd.append("username", user.username);
  if (user.profilePic) fd.append("profilePic", user.profilePic);
  if (els.caption && els.caption.value) fd.append("caption", els.caption.value);
  fd.append("media", file); // חייב להיקרא 'media' – לפי הראוטר

  if (els.postBtn) {
    els.postBtn.disabled = true;
    els.postBtn.dataset.prevText = els.postBtn.textContent || "";
    els.postBtn.textContent = "מעלה...";
  }

  try {
    const res = await fetch(API, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "שגיאה בהעלאה");

    // ניקוי קלטים
    if (els.caption) els.caption.value = "";
    els.media.value = "";

    // רענון ה־rail
    await loadStories();

    if (els.postBtn) {
      els.postBtn.textContent = "עלה! ✅";
      setTimeout(() => {
        els.postBtn.textContent = els.postBtn.dataset.prevText || "פרסם סטורי";
      }, 800);
    }
  } catch (err) {
    console.error(err);
    alert(err.message || "שגיאה בהעלאה");
    if (els.postBtn) {
      els.postBtn.textContent = "נכשל ❌";
      setTimeout(() => {
        els.postBtn.textContent = els.postBtn.dataset.prevText || "פרסם סטורי";
      }, 1200);
    }
  } finally {
    if (els.postBtn) els.postBtn.disabled = false;
  }
}

// -------- viewer --------
function openViewer(story) {
  if (!els.viewer) return;
  if (els.viewerName) els.viewerName.textContent = story.username;
  if (els.viewerAvatar) els.viewerAvatar.src = story.profilePic || "/assets/Photos/defaultprfl.png";
  if (els.viewerTime) els.viewerTime.textContent = fmtTimeAgo(story.createdAt);

  if (els.viewerMedia) {
    els.viewerMedia.innerHTML = "";
    if (story.mediaType === "video") {
      const v = document.createElement("video");
      v.src = story.mediaUrl;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      els.viewerMedia.appendChild(v);
      animateProgress(10_000);
    } else {
      const img = document.createElement("img");
      img.src = story.mediaUrl;
      img.alt = story.caption || "";
      els.viewerMedia.appendChild(img);
      animateProgress(10_000);
    }
  }

  els.viewer.classList.add("active");
  els.viewer.setAttribute("aria-hidden", "false");
}

function closeViewer() {
  if (!els.viewer) return;
  els.viewer.classList.remove("active");
  els.viewer.setAttribute("aria-hidden", "true");
  if (els.viewerMedia) els.viewerMedia.innerHTML = "";
  if (rafId) cancelAnimationFrame(rafId);
  if (els.progress) els.progress.style.transform = "scaleX(0)";
}

let rafId = null;
function animateProgress(durationMs) {
  if (!els.progress) return;
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / durationMs);
    els.progress.style.transform = `scaleX(${t})`;
    if (t < 1) rafId = requestAnimationFrame(frame);
    else closeViewer();
  }
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
}

// -------- init --------
function initCurrentUserUI() {
  const u = getLoggedInUser();
  if (els.currentUserName && u?.username) els.currentUserName.textContent = u.username;
  if (els.currentUserPic && u?.profilePic) els.currentUserPic.src = u.profilePic;
}

function initEvents() {
  // כפתור "סטורי חדש" – אם אין קובץ נבחר נפתח את הבוחר; אם יש – נעלה
  els.postBtn?.addEventListener("click", () => {
    if (!els.media) return;
    if (!els.media.files.length) els.media.click();
    else uploadStory();
  });

  // בחירת קובץ → מייד להעלות
  els.media?.addEventListener("change", () => {
    if (els.media.files.length) uploadStory();
  });

  // viewer close
  els.viewerClose?.addEventListener("click", closeViewer);
  els.viewer?.addEventListener("click", (e) => {
    if (e.target === els.viewer) closeViewer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeViewer();
  });

  // (אופציונלי) פתיחה/סגירה של מיני-uploader אם קיים
  const openBtn = document.getElementById("open-story-uploader");
  const closeBtn = document.getElementById("close-story-uploader");
  const panel = document.getElementById("story-uploader");
  openBtn?.addEventListener("click", () => {
    if (!panel) return;
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  });
  closeBtn?.addEventListener("click", () => { if (panel) panel.style.display = "none"; });
}

(function boot() {
  // נפעיל רק בעמודים שיש בהם stories או כפתור העלאה
  if (els.rail || els.postBtn) {
    initCurrentUserUI();
    initEvents();
    loadStories();
  }
})();

// לחשוף לפיד / קונסול במידת הצורך
window.uploadStory = uploadStory;
window.Stories = {
  load: () => loadStories(),
  open: (s) => openViewer(s),
  close: () => closeViewer()
};
