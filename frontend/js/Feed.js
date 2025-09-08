/* ===========================
   Feed.js — fixed & polished
=========================== */

let currentPost = null;
const API_BASE = "http://localhost:3000";
let currentPostId = null;
let pendingCanvasBlob = null; // תמונת הקנבס לפני העלאה
const DEFAULT_PROFILE = "../assets/Photos/userp.jpg";

// ====== STORIES state ======
let pendingStoryBlob = null;
let storiesData = [];
const STORY_LS_KEY = "storiesLocal";

// ---------- Helpers ----------
function resolveMediaUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith("/uploads/")) return API_BASE + s;
  if (s.startsWith("/")) return API_BASE + s;
  return s;
}
function getCurrentUsername() {
  return localStorage.getItem("loggedInUser");
}
function resolveProfilePic(src) {
  if (!src) return DEFAULT_PROFILE;
  const s = String(src).trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith("/")) return API_BASE + s;
  return s;
}
function getCurrentProfilePic() {
  return resolveProfilePic(localStorage.getItem("profilePic")) || DEFAULT_PROFILE;
}
function escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ====== STORIES: render strip ======
function refreshStoriesBar() {
  const bar = document.getElementById("storiesBar");
  if (!bar) return;

  // אריח "הסטורי שלי"
  let myTile = document.getElementById("myStoryTile");
  if (!myTile) {
    myTile = document.createElement("div");
    myTile.id = "myStoryTile";
    myTile.className = "story-tile";
    myTile.style.cursor = "pointer";
    myTile.innerHTML = `
      <div class="my-story-avatar-wrap" style="position:relative; width:90px; height:90px;">
        <img id="myStoryAvatar" src="${getCurrentProfilePic()}" alt="you" class="my-story-avatar-img" />
        <div class="add-badge" id="myStoryAddBadge">+</div>
      </div>
      <p id="myStoryLabel" style="font-size:12px;margin-top:6px;color:#333;text-align:center">Your story</p>
    `;
  // (הוסרו אופציות תפריט מהעיגול ב-bar)
    bar.prepend(myTile);
  } else {
    const av = myTile.querySelector("#myStoryAvatar");
    av.src = getCurrentProfilePic();
  }

  const me = getCurrentUsername();
  const myFirstIndex = storiesData.findIndex(s => s.username === me);
  const hasMine = myFirstIndex !== -1;

  myTile.classList.toggle("has-story", hasMine);
  const avatarImg = myTile.querySelector("#myStoryAvatar");
  const addBadge = myTile.querySelector("#myStoryAddBadge");
  if (hasMine) {
    avatarImg.classList.add("has-story");
    avatarImg.style.borderColor = "#f56040";
    avatarImg.style.background = "linear-gradient(45deg, #ff8e15, #ff8019, #f25b5b, #cc2366, #bc1888)";
    addBadge.style.display = "none";
  } else {
    avatarImg.classList.remove("has-story");
    avatarImg.style.borderColor = "#ccc";
    avatarImg.style.background = "#eee";
    addBadge.style.display = "flex";
    addBadge.textContent = "+";
  }
  myTile.querySelector("#myStoryLabel").textContent = "Your story";
  myTile.onclick = () => {
    if (hasMine && typeof window.openStoriesViewer === "function") {
      // הצג את כל הסטוריז של המשתמש (לא רק הראשון)
      const myStories = storiesData.filter(s => s.username === me);
      window.openStoriesViewer(0, myStories);
    } else {
      openStoryCreator();
    }
  };

  // מיכל דינמי לסטוריז מהשרת
  let dyn = document.getElementById("dynamicStories");
  if (!dyn) {
    dyn = document.createElement("div");
    dyn.id = "dynamicStories";
    dyn.style.display = "inline-flex";
    dyn.style.gap = "10px";
    dyn.style.marginLeft = "10px";
    bar.appendChild(dyn);
  }

  // סינון הסטורי של המשתמש מה-bar
  const othersStories = storiesData.filter(st => st.username !== me);
  dyn.innerHTML = othersStories.map((st, idx) => {
    const avatar = resolveProfilePic(st.profilePic) || DEFAULT_PROFILE;
    const name = st.username || "user";
    const ring = st.viewed ? "#ccc" : "#f56040";
    return `
      <div class="story-tile" style="cursor:pointer" onclick="openStoryFromBar(${idx})">
        <img src="${avatar}" alt="${name}" style="width:64px;height:64px;border-radius:50%;border:3px solid ${ring};padding:2px;object-fit:cover" />
        <p style="font-size:12px;margin-top:5px;color:#333;text-align:center">${name}</p>
      </div>
    `;
  }).join("");
}

// ====== STORIES: load ======
async function loadStoriesFeed() {
  const username = getCurrentUsername();
  if (!username) return;

  try {
    const res = await fetch(`${API_BASE}/api/stories/feed/${username}`);
    if (!res.ok) throw new Error("No server stories");
    const items = await res.json();
    storiesData = (Array.isArray(items) ? items : []).map(s => ({
      id: s._id || s.id || crypto.randomUUID(),
      username: s.username,
      profilePic: s.profilePic,
      mediaUrl: resolveMediaUrl(s.mediaUrl),
      mediaType: s.mediaType || (s.mediaUrl && s.mediaUrl.match(/\.(mp4|webm|mov)/i) ? "video" : "image"),
      caption: s.caption || "",
      duration: s.duration || 5000,
      createdAt: s.createdAt || new Date().toISOString(),
      viewed: !!s.viewed
    }));
    refreshStoriesBar();
  } catch (_) {
    try {
      const raw = localStorage.getItem(STORY_LS_KEY);
      storiesData = raw ? JSON.parse(raw) : [];
    } catch { storiesData = []; }
    refreshStoriesBar();
  }
}
function saveStoriesLocal() {
  try { localStorage.setItem(STORY_LS_KEY, JSON.stringify(storiesData)); } catch {}
}

// ====== STORIES: Creator & Upload ======
function openStoryCreator() {
  // סגור צפיית סטורים אם פתוחה
  const overlay = document.getElementById('storyOverlay');
  if (overlay && !overlay.classList.contains('d-none')) {
    overlay.classList.add('d-none');
  }
  const m = new bootstrap.Modal(document.getElementById("storyModal"));
  document.getElementById("storyMediaInput").value = "";
  document.getElementById("storyCaption").value = "";
  document.getElementById("storyCanvasBadge")?.classList.add("d-none");
  pendingStoryBlob = null;
  m.show();
}
window.openStoryCreator = openStoryCreator;

async function handleStoryUpload() {
  const username = getCurrentUsername();
  if (!username) return alert("משתמש לא מחובר!");

  const fileInput = document.getElementById("storyMediaInput");
  const file = fileInput.files[0] || (pendingStoryBlob ? new File([pendingStoryBlob], `story_${Date.now()}.png`, { type: "image/png" }) : null);
  const caption = document.getElementById("storyCaption").value.trim();
  const profilePic = localStorage.getItem("profilePic") || DEFAULT_PROFILE;

  if (!file) return alert("בחר תמונה/וידאו או צרף קנבס");

  const mediaType = file.type.startsWith("image/") ? "image" : "video";
  const formData = new FormData();
  formData.append("username", username);
  formData.append("caption", caption);
  formData.append("mediaType", mediaType);
  formData.append("profilePic", profilePic);
  formData.append("file", file);

  try {
    const resp = await fetch(`${API_BASE}/api/stories`, { method: "POST", body: formData });
    if (!resp.ok) throw new Error("server error");
    // רענון מלא מהשרת אחרי העלאה
    await loadStoriesFeed();
  } catch (err) {
    alert("שגיאה בהעלאת סטורי לשרת");
    console.error(err);
  }
  document.getElementById("storyMediaInput").value = "";
  document.getElementById("storyCaption").value = "";
  pendingStoryBlob = null;
  document.getElementById("storyCanvasBadge")?.classList.add("d-none");
  bootstrap.Modal.getInstance(document.getElementById("storyModal"))?.hide();
}
window.handleStoryUpload = handleStoryUpload;

function openStoryFromBar(index) {
  // פותח רק את הסטוריז של אחרים (לא שלך)
  const me = getCurrentUsername();
  const othersStories = storiesData.filter(st => st.username !== me);
  if (typeof window.openStoriesViewer === "function") {
    window.openStoriesViewer(index, othersStories);
    return;
  }
  alert("Viewer לא אותר. ודא ששמו openStoriesViewer ושמקבל (index, storiesData).");
}
window.openStoryFromBar = openStoryFromBar;

// ====== Sidebar profile image ======
document.addEventListener("DOMContentLoaded", () => {
  const suggestionImage = document.getElementById("suggestionImage");
  const profilePicSideBar = document.getElementById("profilePicSideBar");

  const stored = localStorage.getItem("profilePic");
  const validStored = stored && stored.trim() && stored !== "null" && stored !== "undefined";
  const finalSrc = validStored ? resolveProfilePic(stored) : DEFAULT_PROFILE;

  [suggestionImage, profilePicSideBar].forEach((img) => {
    if (!img) return;
    img.src = finalSrc;
    img.onerror = () => { img.src = DEFAULT_PROFILE; };
  });

  if (!validStored) localStorage.setItem("profilePic", DEFAULT_PROFILE);

  const suggestionFullName = document.getElementById("suggestionFullName");
  const suggestionUsername = document.getElementById("suggestionUsername");
  const loggedInUser = localStorage.getItem("loggedInUser");
  const loggedInFullName = localStorage.getItem("fullName") || "";
  if (suggestionUsername && loggedInUser) {
    suggestionUsername.textContent = loggedInUser;
  }
  if (suggestionFullName) {
    suggestionFullName.textContent = loggedInFullName;
  }
});

// ====== Auth guard ======
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    window.location.href = "login.html";
    return;
  }
  localStorage.setItem("username", username);
});

// ====== Feed load, theme toggle, scroll to top, follow button ======
document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/posts/feed/${username}`);
    const posts = await res.json();
    renderFeed(posts);
  } catch (err) {
    console.error("שגיאה בטעינת הפיד:", err);
  }

  // theme toggles
  const toggleButtons = document.querySelectorAll(".toggle-mode");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.toggle("bx-sun", isDark);
        icon.classList.toggle("bx-moon", !isDark);
      }
    });
  });

  const savedThemeInit = localStorage.getItem("theme");
  if (savedThemeInit === "dark") {
    document.body.classList.add("dark-mode");
    document.querySelectorAll(".toggle-mode i").forEach(icon => {
      icon.classList.remove("bx-moon");
      icon.classList.add("bx-sun");
    });
  }

  const scrollBtn = document.getElementById("scrollToTopBtn");
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 300 ? "block" : "none";
  });
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const button = document.getElementById("follow-button");
  if (button) {
    const followee = button.dataset.username;
    const follower = username;

    button.addEventListener("click", async () => {
      const action = button.textContent.trim().toLowerCase() === "follow" ? "follow" : "unfollow";
      try {
        const res = await fetch(`/api/users/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerUsername: follower, followeeUsername: followee }),
        });
        const result = await res.json();
        if (res.ok) {
          button.textContent = action === "follow" ? "Following" : "Follow";
        } else {
          alert(result.error || "שגיאה בבקשה");
        }
      } catch (err) {
        console.error("שגיאה בבקשת follow/unfollow:", err);
        alert("שגיאה בשרת");
      }
    });
  }
});

// ====== Search (sidebar / topbar) ======
let isSearch = false;
function changesearch() {
  if (!isSearch) {
    document.getElementById("searchdiv").innerHTML = `
      <a href="#" class="text-dark ms-1" onclick="changesearch()">
        <i class="bx bx-search fs-2"></i>
      </a>
      <div class="search-bar d-flex align-items-center ms-1" style="max-width: 244px; height: 35px;">
        <input type="search" id="searchInput" class="form-control form-control-sm bg-transparent text-light border-0 shadow-none" placeholder="Search...">
        <i class='bx bx-search'></i>
      </div>
    `;
    activateSearchFilter(document.getElementById("searchInput"));
    isSearch = true;
  } else {
    document.getElementById("searchdiv").innerHTML = `
      <a href="#" class="text-dark ms-1" onclick="changesearch()">
        <i class="bx bx-search fs-2"></i>
      </a>
      <p class="ms-3 fs-5 mb-0 fw-bold" onclick="changesearch()"> Search</p>
    `;
    isSearch = false;
  }
}
function activateSearchFilter(input) {
  if (!input) return;
  input.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const posts = document.querySelectorAll(".post");
    posts.forEach((post) => {
      const captionEl = post.querySelector(".post-caption");
      const captionText = captionEl ? captionEl.innerText.toLowerCase() : "";
      post.style.display = captionText.includes(query) ? "block" : "none";
    });
  });
}
document.querySelectorAll(".search-input").forEach((input) => {
  input.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const posts = document.querySelectorAll(".post");
    posts.forEach((post) => {
      const captionEl = post.querySelector(".post-caption");
      const captionText = captionEl ? captionEl.innerText.toLowerCase() : "";
      post.style.display = captionText.includes(query) ? "block" : "none";
    });
  });
});

// ====== Like ======
async function toggleLike(button, postId) {
  if (!postId) {
    postId = button.dataset.id;
  }
  const username = localStorage.getItem("loggedInUser");
  if (!username) return alert("משתמש לא מחובר!");

  const liked = button.classList.contains("liked");
  const action = liked ? "unlike" : "like";

  try {
    const res = await fetch(`${API_BASE}/api/post-extras/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, username }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "שגיאה בשרת");

    let count = parseInt(button.dataset.likes);
    count += liked ? -1 : 1;

    button.innerHTML = `${!liked ? "♥" : "♡"} <span class="like-count">${count.toLocaleString()}</span>`;
    button.classList.toggle("liked", !liked);
    button.dataset.likes = count;
  } catch (err) {
    console.error("❌ שגיאה בלייק:", err);
    alert("שגיאה בביצוע לייק");
  }
}
window.toggleLike = toggleLike;

// ====== Create Post ======
async function handlePostUpload() {

  const caption = document.getElementById("captionInput").value.trim();
  const fileInput = document.getElementById("mediaInput");
  const file =
    fileInput.files[0] ||
    (pendingCanvasBlob
      ? new File([pendingCanvasBlob], `canvas_${Date.now()}.png`, { type: "image/png" })
      : null);

  const username = localStorage.getItem("loggedInUser");
  const profilePic = localStorage.getItem("profilePic");

  // דוגמה: שליפת מיקום מהאינפוט (אם תוסיף שדה כזה ב-HTML)
  let location = null;
  const locationInput = document.getElementById("locationInput");
  // שלח מיקום רק אם נבחרה הצעה מגוגל (ולא ידני)
  if (locationInput && locationInput.value && window._lastLocationData && window._lastLocationData.address === locationInput.value) {
    location = window._lastLocationData;
  }

  if (!username) return alert("משתמש לא מחובר!");
  if (!caption || !file) return alert("נא למלא את כל השדות");

  const mediaType = file.type.startsWith("image/") ? "image" : "video";
  const formData = new FormData();
  formData.append("username", username);
  formData.append("caption", caption);
  formData.append("mediaType", mediaType);
  formData.append("profilePic", profilePic);
  formData.append("file", file);
  if (location) formData.append("location", JSON.stringify(location));

  try {
    const res = await fetch(`${API_BASE}/api/posts`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "שגיאה ביצירת פוסט");

    const post = data.post;
    const mediaHTML =
      post.mediaType === "image"
        ? `<img src="${API_BASE}${post.mediaUrl}" class="post-image" />`
        : `<video class="post-video" controls autoplay loop muted style="max-width:100%; height:auto;">
             <source src="${API_BASE}${post.mediaUrl}" type="video/mp4">
             הדפדפן שלך לא תומך בניגון וידאו.
           </video>`;

    const postHTML = `
      <div class="post" data-id="${post._id}">
        <div class="post-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <img src="${post.profilePic}" class="avatar" />
            <span class="username d-flex">
              ${post.username} 
              <p class="ms-2 text-secondary">• ${formatTimeAgo(post.createdAt)}</p>
            </span>
          </div>
          <i class='bx bx-trash post-delete-btn ms-3' onclick="deletePostRequest('${post._id}')" title="מחק פוסט"></i>
        </div>

        <div class="post-image-container" ondblclick="showHeart(this)">
          ${mediaHTML}
          <div class="heart-animation">❤️</div>
        </div>

        <div class="post-actions">
          <button class="like-btn" data-likes="0" data-id="${post._id}" onclick="toggleLike(this, '${post._id}')">
            <i class='bx bx-heart'></i> 
            <span class="like-count">0</span>
          </button>
          <button class="cmnt-btn" onclick="toggleCommentsSidebar(this)">💬 תגובות <span class="comment-count">0</span></button>
        </div>

        <div class="post-caption">
          <span class="username">${post.username}</span> ${escAttr(post.caption)}
        </div>

        <div class="comments-list d-none"></div>
      </div>
    `;

    addPostToFeed(postHTML);

    document.getElementById("captionInput").value = "";
    document.getElementById("mediaInput").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("postModal"));
    if (modal) modal.hide();

    pendingCanvasBlob = null;
    document.getElementById("canvasAttachedBadge")?.classList.add("d-none");
  } catch (err) {
    console.error("❌ שגיאה בהעלאת פוסט:", err);
    alert("שגיאה בשליחת הפוסט");
  }
}
window.handlePostUpload = handlePostUpload;

// ====== External Suggestions (via backend -> RandomUser API) ======
function createSuggestionItem(user) {
  const wrap = document.createElement("div");
  wrap.className = "suggestion";

  const img = document.createElement("img");
  img.className = "suggestion-image";
  img.src = user.avatar || DEFAULT_PROFILE;
  img.alt = user.fullName || user.username || "user";
  img.onerror = () => (img.src = DEFAULT_PROFILE);
  wrap.appendChild(img);

  const info = document.createElement("div");
  info.className = "suggestion-info";
  const name = document.createElement("span");
  name.className = "suggestion-name";
  name.textContent = user.username || "user";
  const sub = document.createElement("span");
  sub.className = "suggestion-subtext";
  sub.textContent = user.fullName || user.country || "Suggested user";
  info.appendChild(name);
  info.appendChild(sub);
  wrap.appendChild(info);

  const btn = document.createElement("button");
  btn.className = "follow-button";
  btn.textContent = "follow";
  btn.dataset.username = user.username || "user";
  btn.addEventListener("click", () => {
    btn.textContent = btn.textContent.toLowerCase() === "follow" ? "following" : "follow";
  });
  wrap.appendChild(btn);

  return wrap;
}

async function loadExternalSuggestions(count = 5) {
  const list = document.getElementById("suggestionsDynamicList");
  if (!list) return;
  list.innerHTML = '<div class="text-muted" style="font-size:12px;">Loading suggestions…</div>';
  try {
    const res = await fetch(`${API_BASE}/api/external/suggestions?count=${encodeURIComponent(count)}`);
    if (!res.ok) throw new Error("bad status " + res.status);
    const data = await res.json();
    list.innerHTML = "";
    (Array.isArray(data) ? data : []).forEach((u) => {
      list.appendChild(createSuggestionItem(u));
    });
  } catch (err) {
    console.warn("Suggestions load error", err);
    list.innerHTML = '<div class="text-muted" style="font-size:12px;">Unable to load suggestions</div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadExternalSuggestions(5).catch(() => {});
  loadLatestNews().catch(() => {});
});

// ====== Latest News (via backend -> HN Algolia API) ======
function createNewsItem(item) {
  const wrap = document.createElement("div");
  wrap.className = "suggestion"; // reuse compact horizontal layout

  const info = document.createElement("div");
  info.className = "suggestion-info";

  const title = document.createElement("a");
  title.href = item.url || "#";
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  title.className = "suggestion-name";
  title.textContent = item.title || "Untitled";

  const meta = document.createElement("span");
  meta.className = "suggestion-subtext";
  const time = item.createdAt ? formatTimeAgo(item.createdAt) : "";
  meta.textContent = `${item.author ? item.author : ""}${item.author && time ? " • " : ""}${time}`;

  info.appendChild(title);
  info.appendChild(meta);
  wrap.appendChild(info);
  return wrap;
}

async function loadLatestNews() {
  const list = document.getElementById("newsDynamicList");
  if (!list) return;
  list.innerHTML = '<div class="text-muted" style="font-size:12px;">Loading news…</div>';
  try {
    const res = await fetch(`${API_BASE}/api/external/news`);
    if (!res.ok) throw new Error("bad status " + res.status);
    const data = await res.json();
    list.innerHTML = "";
    (Array.isArray(data) ? data : []).slice(0, 6).forEach((n) => {
      list.appendChild(createNewsItem(n));
    });
  } catch (err) {
    console.warn("News load error", err);
    list.innerHTML = '<div class="text-muted" style="font-size:12px;">Unable to load news</div>';
  }
}

function addPostToFeed(postHTML) {
  const feed = document.getElementById("feedContainer");
  const alertBox = document.getElementById("newPostAlert");

  const postWrapper = document.createElement("div");
  postWrapper.classList.add("post", "highlight");
  postWrapper.innerHTML = postHTML;
  feed.prepend(postWrapper);

  setTimeout(() => postWrapper.classList.remove("highlight"), 2000);

  alertBox.classList.remove("d-none");
  alertBox.classList.add("show");
  setTimeout(() => {
    alertBox.classList.remove("show");
    setTimeout(() => alertBox.classList.add("d-none"), 400);
  }, 3000);
}

function applyPostFilter() {
  const selected = document.getElementById("postFilterSelect").value;
  const posts = document.querySelectorAll(".post");

  posts.forEach((post) => {
    const hasImage = post.querySelector("img");
    const hasVideo = post.querySelector("video");
    if (selected === "all") post.style.display = "block";
    else if (selected === "image") post.style.display = hasImage && !hasVideo ? "block" : "none";
    else if (selected === "video") post.style.display = hasVideo ? "block" : "none";
    else if (selected === "text") post.style.display = !hasImage && !hasVideo ? "block" : "none";
  });
}

// ====== Delete Post ======
async function deletePostRequest(postId) {
  const username = localStorage.getItem("loggedInUser");
  if (!username) return alert("משתמש לא מחובר!");

  try {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/${username}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "שגיאה במחיקת פוסט");

    alert("✅ הפוסט נמחק בהצלחה");

    const feedRes = await fetch(`${API_BASE}/api/posts/feed/${username}`);
    const posts = await feedRes.json();
    renderFeed(posts);
  } catch (err) {
    console.error("❌ שגיאה במחיקה:", err);
    alert("שגיאה במחיקת פוסט");
  }
}

// ====== Comments (sidebar) ======
async function editSidebarComment(commentId, oldText) {
  const newText = prompt("ערוך תגובה:", oldText);
  if (!newText || newText === oldText) return;

  const username = localStorage.getItem("loggedInUser");
  try {
    const res = await fetch(`${API_BASE}/api/post-extras/comment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: currentPostId, commentId, username, text: newText }),
    });
    const data = await res.json();
    if (data.success) {
      loadComments(currentPostId);
    } else {
      alert(data.error || "שגיאה בעריכה");
    }
  } catch (err) {
    console.error("❌ שגיאה בעריכת תגובה:", err);
  }
}

async function loadComments(postId) {
  try {
    const res = await fetch(`${API_BASE}/api/post-extras/${postId}/comments`);
    const data = await res.json();
    if (data.success) renderComments(data.comments);
  } catch (err) {
    console.error("❌ שגיאה בטעינת תגובות:", err);
  }
}

function renderComments(comments) {
  const container = document.getElementById("comments-list");
  container.innerHTML = comments
    .map(
      (c) => `
      <div class="comment d-flex justify-content-between align-items-center mb-2">
        <div><b>${c.username}</b>: ${escAttr(c.text)}</div>
        ${
          c.username === localStorage.getItem("loggedInUser")
            ? `
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="editSidebarComment('${c._id}', '${escAttr(c.text)}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSidebarComment('${c._id}')">🗑️</button>
          </div>`
            : ""
        }
      </div>`
    )
    .join("");
  updateCommentCount(currentPost, comments.length);
}

async function deleteSidebarComment(commentId) {
  const username = localStorage.getItem("loggedInUser");
  try {
    const res = await fetch(`${API_BASE}/api/post-extras/comment`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: currentPostId, commentId, username }),
    });
    const data = await res.json();
    if (data.success) {
      loadComments(currentPostId);
      renderComments(data.comments);
    } else {
      alert(data.error || "שגיאה במחיקה");
    }
  } catch (err) {
    console.error("❌ שגיאה במחיקת תגובה:", err);
  }
}

function showHeart(container) {
  const heart = container.querySelector(".heart-animation");
  heart.classList.add("active");
  const post = container.closest(".post");
  const likeBtn = post.querySelector(".like-btn");
  if (!likeBtn.classList.contains("liked")) toggleLike(likeBtn);
  setTimeout(() => heart.classList.remove("active"), 600);
}

function toggleCommentsSidebar(button) {
  const sidebar = document.getElementById("comments-sidebar");
  if (!sidebar) return console.error("❌ לא נמצא אלמנט עם id=comments-sidebar");

  sidebar.classList.remove("d-none");
  currentPost = button.closest(".post");
  currentPostId = currentPost.dataset.id;

  const previewContainer = document.getElementById("post-preview");
  previewContainer.innerHTML = "";
  const clonedPost = currentPost.cloneNode(true);
  previewContainer.appendChild(clonedPost);

  clonedPost.querySelectorAll(".like-btn").forEach((likeBtn) => {
    likeBtn.addEventListener("click", () => toggleLike(likeBtn));
  });

  loadComments(currentPostId);
}
function closeCommentsSidebar() {
  document.getElementById("comments-sidebar").classList.add("d-none");
  currentPostId = null;
}
async function submitSidebarComment() {
  const text = document.getElementById("comment-text").value.trim();
  const username = localStorage.getItem("loggedInUser");
  if (!text || !currentPostId) return alert("אי אפשר לשלוח תגובה ריקה");

  try {
    const res = await fetch(`${API_BASE}/api/post-extras/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: currentPostId, username, text }),
    });
    const data = await res.json();
    if (data.success) {
      renderComments(data.comments);
      document.getElementById("comment-text").value = "";
    } else {
      alert(data.error || "שגיאה בהוספת תגובה");
    }
  } catch (err) {
    console.error("❌ שגיאה בהוספת תגובה:", err);
  }
}
function updateCommentCount(postElement, count) {
  if (!postElement) return;
  const counter = postElement.querySelector(".comment-count");
  if (counter) counter.textContent = count;
}

// ====== Share modal ======
function openShareModal() {
  const modal = document.getElementById("share-modal");
  if (!modal) return console.error("❌ לא נמצא מודאל עם id=share-modal");
  modal.classList.remove("d-none");
  modal.style.display = "flex";
  const successMsg = document.getElementById("share-success");
  if (successMsg) successMsg.classList.add("d-none");
}
function closeShareModal() { document.getElementById("share-modal").classList.add("d-none"); }
function sendToFriend(friendElement) {
  const friendName = friendElement.textContent.trim();
  const success = document.getElementById("share-success");
  success.textContent = `✅ הפוסט נשלח ל-${friendName}!`;
  success.classList.remove("d-none");
}
function shareTo(dest) {
  const url = location.href;
  if (dest === "copy") {
    navigator.clipboard?.writeText(url);
    alert("הקישור הועתק ללוח");
  } else if (dest === "facebook") {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  } else if (dest === "messenger") {
    window.open(`fb-messenger://share?link=${encodeURIComponent(url)}`, "_blank");
  } else if (dest === "whatsapp") {
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
  } else if (dest === "email") {
    window.location.href = `mailto:?subject=Check this post&body=${encodeURIComponent(url)}`;
  } else if (dest === "threads") {
    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(url)}`, "_blank");
  } else if (dest === "x") {
    window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank");
  } else {
    alert("Shared!");
  }
}
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.sendToFriend = sendToFriend;
window.shareTo = shareTo;

// ====== Follow buttons in feed ======
function activateFollowButtons() {
  const currentUser = localStorage.getItem("loggedInUser");
  const buttons = document.querySelectorAll(".follow-button");

  buttons.forEach((button) => {
    const targetUser = button.dataset.username;
    button.addEventListener("click", async () => {
      const action = button.textContent.trim().toLowerCase() === "follow" ? "follow" : "unfollow";
      try {
        const res = await fetch(`/api/users/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerUsername: currentUser, followeeUsername: targetUser }),
        });
        const result = await res.json();
        if (res.ok) {
          button.textContent = action === "follow" ? "Following" : "Follow";
        } else {
          alert(result.error || "שגיאה בבקשת מעקב");
        }
      } catch (err) {
        console.error("שגיאה בבקשת Follow/Unfollow:", err);
        alert("שגיאה בשרת");
      }
    });
  });
}
document.querySelectorAll(".follow-button").forEach((button) => {
  button.addEventListener("click", async function () {
    const usernameToFollow = this.getAttribute("data-username");
    try {
      const res = await fetch(`/api/follow/${usernameToFollow}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        this.textContent = data.isFollowing ? "unfollow" : "follow";
      } else {
        console.error("Follow request failed", data.message);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  });
});

async function checkFollowingStatus(currentUser, targetUser) {
  try {
    const res = await fetch(`/api/users/is-following?follower=${currentUser}&followee=${targetUser}`);
    const data = await res.json();
    return res.ok && data.isFollowing;
  } catch (err) {
    console.error("שגיאה בבדיקת סטטוס מעקב:", err);
    return false;
  }
}

// ====== Time ago ======
function formatTimeAgo(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffMinutes < 1) return ` כעת!`;
  if (diffMinutes < 60) return `${diffMinutes} דק׳`;
  if (diffHours < 24) return `${diffHours} שעות`;
  if (diffDays < 7) return `${diffDays} ימים`;
  return `${diffWeeks} שבועות`;
}

// ====== Render Feed ======
async function renderFeed(posts) {
  if (!Array.isArray(posts)) {
    console.error("Posts is not an array:", posts);
    return;
  }

  const container = document.getElementById("feedContainer");
  const currentUser = localStorage.getItem("loggedInUser");
  container.innerHTML = "";

  // בנה את כל הפוסטים עם סטטוס מעקב אמיתי
  const postHtmlArr = await Promise.all(posts.map(async (post) => {
    const isNotMe = post.username !== currentUser;
    const profilePic = resolveProfilePic(post.profilePic || localStorage.getItem("profilePic"));

    let followButtonHTML = "";
    if (isNotMe) {
      const isFollowing = await checkFollowingStatus(currentUser, post.username);
      const label = isFollowing ? "Following" : "Follow";
      followButtonHTML = `<button class="follow-button" data-username="${post.username}">${label}</button>`;
    }

    const mediaHTML =
      post.mediaType === "image"
        ? `<img src="${API_BASE}${post.mediaUrl}" class="post-image" />`
        : `<video class="post-video" controls autoplay loop muted style="max-width:100%; height:auto;">
             <source src="${API_BASE}${post.mediaUrl}" type="video/mp4">
             הדפדפן שלך לא תומך בניגון וידאו.
           </video>`;

    const likesArr = Array.isArray(post.likes) ? post.likes : [];
    const commentsArr = Array.isArray(post.comments) ? post.comments : [];

    return `
      <div class="post" data-id="${post._id}">
        <div class="post-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <img src="${profilePic}" class="avatar" />
            <span class="username d-flex align-items-center">
              ${post.username}
              ${(post.location && (post.location.address || post.location.placeId)) ? `
                <span class="post-location text-secondary ms-2 d-flex align-items-center" style="font-size: 0.95em;">
                  <i class='bx bx-map-pin' style="margin-left: 2px;"></i>
                  <span>${escAttr(post.location.address || 'מיקום לא ידוע')}</span>
                </span>
              ` : ''}
              <p class="ms-2 text-secondary mb-0">•${formatTimeAgo(post.createdAt)}</p>
            </span>
          </div>
          ${
            isNotMe
              ? followButtonHTML
              : `<i class='bx bx-trash post-delete-btn ms-3' onclick="deletePostRequest('${post._id}')" title="מחק פוסט"></i>`
          }
        </div>

        <div class="post-image-container" ondblclick="showHeart(this)">
          ${mediaHTML}
          <div class="heart-animation">❤️</div>
        </div>

        <div class="post-actions">
          <button 
            class="like-btn ${likesArr.includes(currentUser) ? "liked" : ""}" 
            data-likes="${likesArr.length}" 
            data-id="${post._id}" 
            onclick="toggleLike(this, '${post._id}')">
            <i class='bx bx-heart'></i> 
            <span class="like-count">${likesArr.length}</span>
          </button>

          <button class="cmnt-btn" onclick="toggleCommentsSidebar(this)">
            💬 תגובות <span class="comment-count">${commentsArr.length}</span>
          </button>
          <button class="share-btn" onclick="openShareModal(this)">
            <i class='bx bx-send'></i>
          </button>
        </div>

        <div class="post-caption">
          <span class="username">${post.username}</span> ${escAttr(post.caption)}
        </div>

        <div class="comments-list d-none"></div>
      </div>
    `;
  }));
  container.innerHTML = postHtmlArr.join("");
  // הפעלת כפתורי follow אחרי שהפיד נטען
  activateFollowButtons();
}

// ====== Profile nav ======
function goToMyProfile() { window.location.assign("profile.html"); }
window.goToMyProfile = goToMyProfile;

// ====== Draw Canvas ======
function initDrawCanvas() {
  const canvas = document.getElementById("drawCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const colorEl = document.getElementById("brushColor");
  const sizeEl = document.getElementById("brushSize");
  const sizeValEl = document.getElementById("brushSizeVal");
  const eraserBtn = document.getElementById("eraserBtn");
  const clearBtn = document.getElementById("clearCanvas");
  const undoBtn = document.getElementById("undoBtn");
  const useBtn = document.getElementById("useCanvasBtn");
  const badge = document.getElementById("canvasAttachedBadge");

  let drawing = false;
  let lastX = 0, lastY = 0;
  let isEraser = false;

  const history = [];
  const MAX_HISTORY = 20;

  function resizeCanvas() {
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;

    ctx.setTransform(1,0,0,1,0,0);
    canvas.width  = Math.round(r.width);
    canvas.height = Math.round(r.height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function saveSnapshot() {
    try {
      history.push(canvas.toDataURL("image/png"));
      if (history.length > MAX_HISTORY) history.shift();
    } catch (_) {}
  }
  function restoreSnapshot() {
    if (history.length <= 1) return;
    history.pop();
    const url = history[history.length - 1];
    const img = new Image();
    img.onload = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.drawImage(img, 0, 0, cssW, cssH);
    };
    img.src = url;
  }

  function startDraw(x, y) {
    drawing = true;
    [lastX, lastY] = [x, y];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Number(sizeEl.value) || 6;
    sizeValEl.textContent = `${ctx.lineWidth}px`;
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : colorEl.value;
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
  }
  function draw(x, y) {
    if (!drawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
  }
  function endDraw() { if (!drawing) return; drawing = false; saveSnapshot(); }

  // Mouse
  canvas.addEventListener("mousedown", (e) => {
    const r = canvas.getBoundingClientRect();
    startDraw(e.clientX - r.left, e.clientY - r.top);
  });
  window.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    draw(e.clientX - r.left, e.clientY - r.top);
  });
  window.addEventListener("mouseup", endDraw);
  window.addEventListener("mouseleave", endDraw);

  // Touch
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    startDraw(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    draw(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });
  canvas.addEventListener("touchend", endDraw);
  canvas.addEventListener("touchcancel", endDraw);

  // Controls
  sizeEl.addEventListener("input", () => { sizeValEl.textContent = `${sizeEl.value}px`; });
  eraserBtn.addEventListener("click", () => {
    isEraser = !isEraser;
    eraserBtn.classList.toggle("btn-secondary", isEraser);
    eraserBtn.classList.toggle("btn-outline-secondary", !isEraser);
  });
  clearBtn?.addEventListener("click", () => {
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);
    saveSnapshot();
  });
  undoBtn?.addEventListener("click", restoreSnapshot);

  useBtn?.addEventListener("click", () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const tmp = document.createElement("canvas");
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext("2d");
    tctx.drawImage(canvas, 0, 0, w, h);
    tmp.toBlob((blob) => {
      pendingCanvasBlob = blob;
      badge?.classList.remove("d-none");
      const dm = bootstrap.Modal.getInstance(document.getElementById("drawModal"));
      dm?.hide();
      const pmEl = document.getElementById("postModal");
      let pm = bootstrap.Modal.getInstance(pmEl);
      if (!pm) pm = new bootstrap.Modal(pmEl);
      pm.show();
    }, "image/png");
  });

  document.getElementById("drawModal")?.addEventListener("shown.bs.modal", () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    resizeCanvas();
    isEraser = false;
    eraserBtn.classList.remove("btn-secondary");
    eraserBtn.classList.add("btn-outline-secondary");
  });

  window.addEventListener("resize", () => {
    if (document.getElementById("drawModal")?.classList.contains("show")) {
      resizeCanvas();
    }
  });
}
document.addEventListener("DOMContentLoaded", initDrawCanvas);

// ====== Story canvas -> Story creator ======
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("useCanvasForStoryBtn");
  const canvas = document.getElementById("drawCanvas");
  if (btn && canvas) {
    btn.addEventListener("click", () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const tmp = document.createElement("canvas");
      tmp.width = w; tmp.height = h;
      const tctx = tmp.getContext("2d");
      tctx.drawImage(canvas, 0, 0, w, h);
      tmp.toBlob((blob) => {
        if (!blob) return;
        pendingStoryBlob = blob;
        document.getElementById("storyCanvasBadge")?.classList.remove("d-none");
        bootstrap.Modal.getInstance(document.getElementById("drawModal"))?.hide();
        const smEl = document.getElementById("storyModal");
        let sm = bootstrap.Modal.getInstance(smEl);
        if (!sm) sm = new bootstrap.Modal(smEl);
        sm.show();
      }, "image/png");
    });
  }
});

// always load stories after DOM
document.addEventListener("DOMContentLoaded", loadStoriesFeed);

// =====================
// STORIES: viewer (static + dynamic)
// =====================
(() => {
  const STORY_DURATION = 5000; // ms ברירת מחדל לתמונה
  let stories = [];        // [{ username, src, avatar, el, seen, duration }]
  let current = 0;
  let rafId = null;

  const $overlay  = () => document.getElementById('storyOverlay');
  const $img      = () => document.getElementById('storyImage');
  const $video    = () => document.getElementById('storyVideo');
  const $uname    = () => document.getElementById('storyUserName');
  const $uavatar  = () => document.getElementById('storyUserPic');
  const $progress = () => document.getElementById('storyProgress').firstElementChild;

  function collectStoriesFromBar(){
    const items = Array
      .from(document.querySelectorAll('#storiesBar > .story, #storiesBar > .close, #storiesBar > div'))
      .filter(el => el.id !== 'myStoryTile' && el.id !== 'dynamicStories');

    stories = items.map((el, i) => {
      const img = el.querySelector('img');
      const name = (el.querySelector('p')?.textContent || `user ${i+1}`).trim();
      const rawSrc = img ? img.getAttribute('src') : '';
      const src = resolveProfilePic(rawSrc);
      el.dataset.storyIndex = i;
      el.addEventListener('click', () => openStory(i));
      return { username: name, src, avatar: img ? src : DEFAULT_PROFILE, el, seen: false, duration: STORY_DURATION };
    });
  }

  // Bridge for dynamic stories
  window.openStoriesViewer = function(index, arr){
    if (!Array.isArray(arr) || !arr.length) return;
    stories = arr.map((s) => ({
      username: s.username || 'user',
      src: resolveMediaUrl(s.mediaUrl) || resolveProfilePic(s.profilePic) || DEFAULT_PROFILE,
      avatar: resolveProfilePic(s.profilePic) || DEFAULT_PROFILE,
      el: null,
      seen: !!s.viewed,
      duration: Number(s.duration) > 0 ? Number(s.duration) : STORY_DURATION
    }));
    openStory(index);
  };

  function openStory(index){
    if (!stories.length) return;
    current = ((index % stories.length) + stories.length) % stories.length;
    renderCurrent();
    $overlay().classList.remove('d-none');
    document.addEventListener('keydown', onKey);
  }
  function closeStory(){
    stopProgress(); pauseVideo();
    $overlay().classList.add('d-none');
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e){
    if (e.key === 'Escape') return closeStory();
    if (e.key === 'ArrowRight') return nextStory();
    if (e.key === 'ArrowLeft')  return prevStory();
  }
  function nextStory(){ stopProgress(); pauseVideo(); current = (current + 1) % stories.length; renderCurrent(); }
  function prevStory(){ stopProgress(); pauseVideo(); current = (current - 1 + stories.length) % stories.length; renderCurrent(); }

  function pauseVideo(){
    const v = $video();
    v.pause();
    v.removeAttribute('src');
    v.load();
  }

  function renderCurrent(){
    const s = stories[current];
    $uname().textContent = s.username;
    $uavatar().src = s.avatar;

    // הצגת כפתור אופציות רק אם זה הסטורי שלי
    const optionsBtn = document.getElementById('storyOptionsBtn');
    const optionsMenu = document.getElementById('storyOptionsMenu');
    if (optionsBtn && optionsMenu) {
      if (s.username === getCurrentUsername()) {
        optionsBtn.style.display = 'flex';
      } else {
        optionsBtn.style.display = 'none';
        optionsMenu.style.display = 'none';
      }
      optionsBtn.onclick = (e) => {
        e.stopPropagation();
        optionsMenu.style.display = optionsMenu.style.display === 'block' ? 'none' : 'block';
      };
      document.addEventListener('click', function hideMenu(ev) {
        if (!optionsMenu.contains(ev.target) && ev.target !== optionsBtn) {
          optionsMenu.style.display = 'none';
          document.removeEventListener('click', hideMenu);
        }
      });
      // פעולה למחיקת סטורי
      optionsMenu.querySelector('#storyDeleteBtn').onclick = (ev) => {
        ev.stopPropagation();
        optionsMenu.style.display = 'none';
        // מחיקת הסטורי הנוכחי מהשרת ומהמערך
        if (window.stories && typeof window.current === 'number') {
          const currStory = window.stories[window.current];
          if (currStory && currStory.id && currStory.username) {
            fetch(`${API_BASE}/api/stories/${currStory.id}/${currStory.username}`, { method: 'DELETE' })
              .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'שגיאה במחיקת סטורי');
                alert('✅ הסטורי נמחק בהצלחה');
                window.stories.splice(window.current, 1);
                if (window.stories.length === 0) {
                  document.getElementById('storyOverlay').classList.add('d-none');
                } else {
                  window.current = Math.max(0, window.current - 1);
                  renderCurrent();
                }
              })
              .catch(err => {
                alert('שגיאה במחיקת סטורי');
                console.error('שגיאה במחיקת סטורי:', err);
              });
          }
        }
      };
// מוחק את הסטורי הנוכחי מהמערך ומרענן את הצפייה
function deleteCurrentStory() {
  if (!window.stories || typeof window.current !== 'number') return;
  const s = window.stories[window.current];
  if (!s) return;
  // מחיקת הסטורי מהשרת (אם יש API)
  if (s.id && typeof fetch === 'function') {
    fetch(`/api/stories/${s.id}`, { method: 'DELETE', credentials: 'include' })
      .then(() => {
        window.stories.splice(window.current, 1);
        if (window.stories.length === 0) {
          document.getElementById('storyOverlay').classList.add('d-none');
        } else {
          window.current = Math.max(0, window.current - 1);
          renderCurrent();
        }
      });
  } else {
    window.stories.splice(window.current, 1);
    if (window.stories.length === 0) {
      document.getElementById('storyOverlay').classList.add('d-none');
    } else {
      window.current = Math.max(0, window.current - 1);
      renderCurrent();
    }
  }
}
      // פעולה להעלאת סטורי נוסף
      optionsMenu.querySelector('#storyAddBtn').onclick = (ev) => {
        ev.stopPropagation();
        optionsMenu.style.display = 'none';
        if (typeof openStoryCreator === 'function') openStoryCreator();
      };
    }

    $img().style.display = 'none';
    $video().style.display = 'none';

    const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(s.src);
    const durationMs = s.duration || STORY_DURATION;
    // נקה אירועים קודמים
    $img().onerror = null;
    $video().onerror = null;

    if (isVideo) {
      const v = $video();
      v.src = s.src;
      v.style.display = 'block';
      v.currentTime = 0;
      v.onerror = () => {
        v.style.display = 'none';
        alert('שגיאה בטעינת וידאו לסטורי. ודא שהקובץ קיים ונתיבו תקין.');
      };
      const start = () => {
        try { v.play().catch(()=>{}); } catch(_){}
        const d = (isFinite(v.duration) && v.duration > 0) ? v.duration * 1000 : durationMs;
        startProgress(d, nextStory);
      };
      if (isFinite(v.duration) && v.duration > 0) start(); else v.onloadedmetadata = start;
    } else {
      const img = $img();
      img.src = s.src;
      img.style.display = 'block';
      img.onerror = () => {
        img.style.display = 'none';
        alert('שגיאה בטעינת תמונה לסטורי. ודא שהקובץ קיים ונתיבו תקין.');
      };
      startProgress(durationMs, nextStory);
    }

    if (s.el) s.el.classList.add('story-seen');
    s.seen = true;
  }

  function startProgress(duration, onDone){
    stopProgress();
    const bar = $progress();
    bar.style.width = '0%';
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      bar.style.width = (p * 100).toFixed(2) + '%';
      if (p < 1) rafId = requestAnimationFrame(step);
      else { rafId = null; onDone && onDone(); }
    };
    rafId = requestAnimationFrame(step);
  }
  function stopProgress(){
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    $progress().style.width = '0%';
  }

  document.addEventListener('DOMContentLoaded', () => {
    collectStoriesFromBar();
    document.getElementById('storyClose')?.addEventListener('click', closeStory);
    document.getElementById('storyNext')?.addEventListener('click', nextStory);
    document.getElementById('storyPrev')?.addEventListener('click', prevStory);
  });
})();
