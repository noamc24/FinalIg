let currentPost = null;
const API_BASE = "http://localhost:3000";
let currentPostId = null;
let pendingCanvasBlob = null; // תמונת הקנבס לפני העלאה
const DEFAULT_PROFILE = "../assets/Photos/userp.jpg";

/* ---------- Helpers ---------- */
// אסקייפ לערכי HTML/Attributes
function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// פתרון כללי ל-URL (http/data/blob, נתיב שמתחיל ב-/, או נתיב אססט יחסי)
function resolveUrl(src, fallback = "") {
  if (!src) return fallback;
  const s = String(src).trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith("/")) return API_BASE + s;
  return s; // נתיב אססט יחסי כמו ../assets/...
}

/* ---------- תמונת פרופיל בסיידבר ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const suggestionImage = document.getElementById("suggestionImage");
  const profilePicSideBar = document.getElementById("profilePicSideBar");

  const stored = localStorage.getItem("profilePic");
  const validStored = stored && stored.trim() && stored !== "null" && stored !== "undefined";
  const finalSrc = resolveUrl(validStored ? stored : DEFAULT_PROFILE, DEFAULT_PROFILE);

  [suggestionImage, profilePicSideBar].forEach((img) => {
    if (!img) return;
    img.src = finalSrc;
    img.onerror = () => { img.src = DEFAULT_PROFILE; };
  });

  if (!validStored) {
    localStorage.setItem("profilePic", DEFAULT_PROFILE);
  }
});

/* ---------- אימות התחברות ושמירת שם משתמש ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    window.location.href = "login.html";
    return;
  }
  localStorage.setItem("username", username);
});

/* ---------- טעינת פיד, מצב כהה, כפתור גלילה, Follow ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/posts/feed/${username}`);
    const posts = await res.json();
    await renderFeed(posts);
  } catch (err) {
    console.error("שגיאה בטעינת הפיד:", err);
  }

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
      if (typeof updateLogoForTheme === "function") {
        updateLogoForTheme(isDark);
      }
    });
  });

  // theme on load
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    const icon = document.querySelector(".toggle-mode i");
    if (icon) {
      icon.classList.remove("bx-moon");
      icon.classList.add("bx-sun");
    }
  }

  const scrollBtn = document.getElementById("scrollToTopBtn");
  window.addEventListener("scroll", () => {
    if (!scrollBtn) return;
    scrollBtn.style.display = window.scrollY > 300 ? "block" : "none";
  });
  scrollBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // follow button (nav יחיד עם id יחיד אם יש)
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
          button.textContent = action === "follow" ? "unfollow" : "follow";
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

/* ---------- חיפוש בסיידבר ---------- */
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
    document.querySelectorAll(".post").forEach((post) => {
      const captionEl = post.querySelector(".post-caption");
      const captionText = captionEl ? captionEl.innerText.toLowerCase() : "";
      post.style.display = captionText.includes(query) ? "block" : "none";
    });
  });
}
document.querySelectorAll(".search-input").forEach((input) => activateSearchFilter(input));

/* ---------- לייק ---------- */
async function toggleLike(button, postId) {
  if (!postId) postId = button.dataset.id;
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

    let count = parseInt(button.dataset.likes, 10);
    if (Number.isNaN(count)) count = 0;
    count += liked ? -1 : 1;

    button.innerHTML = `${!liked ? "♥" : "♡"} <span class="like-count">${count.toLocaleString()}</span>`;
    button.classList.toggle("liked", !liked);
    button.dataset.likes = String(count);
  } catch (err) {
    console.error("❌ שגיאה בלייק:", err);
    alert("שגיאה בביצוע לייק");
  }
}
window.toggleLike = toggleLike;

/* ---------- יצירת פוסט ---------- */
async function handlePostUpload() {
  const caption = document.getElementById("captionInput").value.trim();
  const fileInput = document.getElementById("mediaInput");
  const file =
    fileInput.files[0] ||
    (pendingCanvasBlob ? new File([pendingCanvasBlob], `canvas_${Date.now()}.png`, { type: "image/png" }) : null);

  const username = localStorage.getItem("loggedInUser");
  const profilePic = localStorage.getItem("profilePic");

  if (!username) return alert("משתמש לא מחובר!");
  if (!caption || !file) return alert("נא למלא את כל השדות");

  const mediaType = file.type.startsWith("image/") ? "image" : "video";
  const formData = new FormData();
  formData.append("username", username);
  formData.append("caption", caption);
  formData.append("mediaType", mediaType);
  formData.append("profilePic", profilePic);
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/api/posts`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "שגיאה ביצירת פוסט");
    const post = data.post;

    const mediaHTML =
      post.mediaType === "image"
        ? `<img src="${escAttr(resolveUrl(`${API_BASE}${post.mediaUrl}`))}" class="post-image" />`
        : `<video class="post-video" controls autoplay loop muted style="max-width:100%; height:auto;">
             <source src="${escAttr(resolveUrl(`${API_BASE}${post.mediaUrl}`))}" type="video/mp4">
             הדפדפן שלך לא תומך בניגון וידאו.
           </video>`;

    const postHTML = `
      <div class="post" data-id="${escAttr(post._id)}">
        <div class="post-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <img src="${escAttr(resolveUrl(post.profilePic, DEFAULT_PROFILE))}" class="avatar" />
            <span class="username d-flex">
              ${escAttr(post.username)}
              <p class="ms-2 text-secondary">• ${escAttr(formatTimeAgo(post.createdAt))}</p>
            </span>
          </div>
          <i class='bx bx-trash post-delete-btn ms-3' onclick="deletePostRequest('${escAttr(post._id)}')" title="מחק פוסט"></i>
        </div>
        <div class="post-image-container" ondblclick="showHeart(this)">
          ${mediaHTML}
          <div class="heart-animation">❤️</div>
        </div>
        <div class="post-actions">
          <button class="like-btn" data-likes="0" data-id="${escAttr(post._id)}" onclick="toggleLike(this, '${escAttr(post._id)}')">
            <i class='bx bx-heart'></i> 
            <span class="like-count">0</span>
          </button>
          <button class="cmnt-btn" onclick="toggleCommentsSidebar(this)">
            💬 תגובות <span class="comment-count">0</span>
          </button>
        </div>
        <div class="post-caption">
          <span class="username">${escAttr(post.username)}</span> ${escAttr(post.caption)}
        </div>
        <div class="comments-list d-none"></div>
      </div>
    `;

    addPostToFeed(postHTML);

    document.getElementById("captionInput").value = "";
    document.getElementById("mediaInput").value = "";

    const pmEl = document.getElementById("postModal");
    const modal = window.bootstrap ? window.bootstrap.Modal.getInstance(pmEl) : null;
    if (modal) modal.hide();

    pendingCanvasBlob = null;
    document.getElementById("canvasAttachedBadge")?.classList.add("d-none");
  } catch (err) {
    console.error("❌ שגיאה בהעלאת פוסט:", err);
    alert("שגיאה בשליחת הפוסט");
  }
}
window.handlePostUpload = handlePostUpload;

function addPostToFeed(postHTML) {
  const feed = document.getElementById("feedContainer");
  const alertBox = document.getElementById("newPostAlert");
  const postWrapper = document.createElement("div");
  postWrapper.classList.add("post", "highlight");
  postWrapper.innerHTML = postHTML;
  feed.prepend(postWrapper);
  setTimeout(() => postWrapper.classList.remove("highlight"), 2000);

  if (alertBox) {
    alertBox.classList.remove("d-none");
    alertBox.classList.add("show");
    setTimeout(() => {
      alertBox.classList.remove("show");
      setTimeout(() => alertBox.classList.add("d-none"), 400);
    }, 3000);
  }
}

function applyPostFilter() {
  const selected = document.getElementById("postFilterSelect").value;
  document.querySelectorAll(".post").forEach((post) => {
    const hasImage = !!post.querySelector("img");
    const hasVideo = !!post.querySelector("video");
    if (selected === "all") post.style.display = "block";
    else if (selected === "image") post.style.display = hasImage && !hasVideo ? "block" : "none";
    else if (selected === "video") post.style.display = hasVideo ? "block" : "none";
    else if (selected === "text") post.style.display = !hasImage && !hasVideo ? "block" : "none";
  });
}

async function deletePostRequest(postId) {
  const username = localStorage.getItem("loggedInUser");
  if (!username) return alert("משתמש לא מחובר!");
  try {
    const res = await fetch(`${API_BASE}/api/posts/${encodeURIComponent(postId)}/${encodeURIComponent(username)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "שגיאה במחיקת פוסט");
    alert("✅ הפוסט נמחק בהצלחה");
    const feedRes = await fetch(`${API_BASE}/api/posts/feed/${username}`);
    const posts = await feedRes.json();
    await renderFeed(posts);
  } catch (err) {
    console.error("❌ שגיאה במחיקה:", err);
    alert("שגיאה במחיקת פוסט");
  }
}

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
    const res = await fetch(`${API_BASE}/api/post-extras/${encodeURIComponent(postId)}/comments`);
    const data = await res.json();
    if (data.success) renderComments(data.comments || []);
  } catch (err) {
    console.error("❌ שגיאה בטעינת תגובות:", err);
  }
}

function renderComments(comments) {
  const container = document.getElementById("comments-list");
  container.innerHTML = (comments || [])
    .map((c) => `
      <div class="comment d-flex justify-content-between align-items-center mb-2">
        <div><b>${escAttr(c.username)}</b>: ${escAttr(c.text)}</div>
        ${
          c.username === localStorage.getItem("loggedInUser")
            ? `
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="editSidebarComment('${escAttr(c._id)}', '${escAttr(c.text)}')">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSidebarComment('${escAttr(c._id)}')">🗑️</button>
          </div>` : ""
        }
      </div>`).join("");
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
      renderComments(data.comments || []);
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
  if (likeBtn && !likeBtn.classList.contains("liked")) toggleLike(likeBtn);
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
      renderComments(data.comments || []);
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
  if (counter) counter.textContent = String(count);
}

/* ---------- חיפוש בחלון שיתוף ---------- */
document.getElementById("share-search")?.addEventListener("input", function () {
  const query = this.value.toLowerCase();
  document.querySelectorAll("#friend-list li").forEach((li) => {
    li.style.display = li.textContent.toLowerCase().includes(query) ? "inline-block" : "none";
  });
});

/* ---------- אינדיקציית הקלדה בתגובות ---------- */
let typingTimeout = null;
document.getElementById("comment-text")?.addEventListener("input", () => {
  const indicator = document.getElementById("typing-indicator");
  if (!indicator) return;
  indicator.style.display = "block";
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => { indicator.style.display = "none"; }, 1500);
});

/* ---------- Follow כפתורים בפיד (אחיד) ---------- */
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
          button.textContent = action === "follow" ? "Unfollow" : "Follow";
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
// ביטול המימוש הכפול שהיה קודם

async function checkFollowingStatus(currentUser, targetUser) {
  try {
    const res = await fetch(`/api/users/isFollowing?follower=${encodeURIComponent(currentUser)}&followee=${encodeURIComponent(targetUser)}`);
    const data = await res.json();
    return res.ok && !!data.isFollowing;
  } catch (err) {
    console.error("שגיאה בבדיקת סטטוס מעקב:", err);
    return false;
  }
}

/* ---------- עימוד זמן "לפני X" ---------- */
function formatTimeAgo(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffMinutes < 1) return `כעת!`;
  if (diffMinutes < 60) return `${diffMinutes} דק׳`;
  if (diffHours < 24) return `${diffHours} שעות`;
  if (diffDays < 7) return `${diffDays} ימים`;
  return `${diffWeeks} שבועות`;
}

/* ---------- רינדור פיד ---------- */
async function renderFeed(posts) {
  if (!Array.isArray(posts)) {
    console.error("Posts is not an array:", posts);
    return;
  }
  const container = document.getElementById("feedContainer");
  const currentUser = localStorage.getItem("loggedInUser");
  container.innerHTML = "";

  for (const post of posts) {
    const isNotMe = post.username !== currentUser;
    const profilePic = resolveUrl(post.profilePic || localStorage.getItem("profilePic"), DEFAULT_PROFILE);

    let followButtonHTML = "";
    if (isNotMe) {
      const isFollowing = await checkFollowingStatus(currentUser, post.username);
      const label = isFollowing ? "Unfollow" : "Follow";
      followButtonHTML = `<button class="follow-button" data-username="${escAttr(post.username)}">${label}</button>`;
    }

    const mediaSrc = resolveUrl(`${API_BASE}${post.mediaUrl}`);
    const mediaHTML =
      post.mediaType === "image"
        ? `<img src="${escAttr(mediaSrc)}" class="post-image" />`
        : `<video class="post-video" controls autoplay loop muted style="max-width:100%; height:auto;">
             <source src="${escAttr(mediaSrc)}" type="video/mp4">
             הדפדפן שלך לא תומך בניגון וידאו.
           </video>`;

    const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
    const likedByMe = Array.isArray(post.likes) && post.likes.includes(currentUser);
    const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;

    const postHTML = `
      <div class="post" data-id="${escAttr(post._id)}">
        <div class="post-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <img src="${escAttr(profilePic)}" class="avatar" />
            <span class="username d-flex">${escAttr(post.username)} <p class="ms-2 text-secondary">• ${escAttr(formatTimeAgo(post.createdAt))}</p></span>  
          </div>
          ${
            isNotMe
              ? followButtonHTML
              : `<i class='bx bx-trash post-delete-btn ms-3' onclick="deletePostRequest('${escAttr(post._id)}')" title="מחק פוסט"></i>`
          }
        </div>

        <div class="post-image-container" ondblclick="showHeart(this)">
          ${mediaHTML}
          <div class="heart-animation">❤️</div>
        </div>

        <div class="post-actions">
          <button 
            class="like-btn ${likedByMe ? "liked" : ""}" 
            data-likes="${likeCount}" 
            data-id="${escAttr(post._id)}" 
            onclick="toggleLike(this, '${escAttr(post._id)}')">
            <i class='bx bx-heart'></i> 
            <span class="like-count">${likeCount}</span>
          </button>

          <button class="cmnt-btn" onclick="toggleCommentsSidebar(this)">
            💬 תגובות <span class="comment-count">${commentsCount}</span>
          </button>
          <button class="share-btn" onclick="openShareModal()">
            <i class='bx bx-send'></i>
          </button>
        </div>

        <div class="post-caption">
          <span class="username">${escAttr(post.username)}</span> ${escAttr(post.caption)}
        </div>

        <div class="comments-list d-none"></div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", postHTML);
  }
  // אחרי שהפיד קיים בדום – מחברים מאזינים לכפתורי Follow
  activateFollowButtons();
}

/* ---------- ניווט לפרופיל ---------- */
function goToMyProfile() { window.location.assign("profile.html"); }
window.goToMyProfile = goToMyProfile;

/* ---------- קנבס ציור – ייזום מלא ---------- */
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    canvas.width = Math.round(r.width);
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
  function endDraw() {
    if (!drawing) return;
    drawing = false;
    saveSnapshot();
  }

  // עכבר
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

  // מסך מגע
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

  // שליטה
  sizeEl.addEventListener("input", () => { sizeValEl.textContent = `${sizeEl.value}px`; });
  eraserBtn.addEventListener("click", () => {
    isEraser = !isEraser;
    eraserBtn.classList.toggle("btn-secondary", isEraser);
    eraserBtn.classList.toggle("btn-outline-secondary", !isEraser);
  });
  clearBtn?.addEventListener("click", () => {
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
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
      document.getElementById("canvasAttachedBadge")?.classList.remove("d-none");
      const dmEl = document.getElementById("drawModal");
      const dm = window.bootstrap ? window.bootstrap.Modal.getInstance(dmEl) : null;
      dm?.hide();
      const pmEl = document.getElementById("postModal");
      let pm = window.bootstrap ? window.bootstrap.Modal.getInstance(pmEl) : null;
      if (!pm && window.bootstrap) pm = new window.bootstrap.Modal(pmEl);
      pm?.show();
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

/* ---------- שתוף ---------- */
let sharedPost = null;
function openShareModal() {
  const modal = document.getElementById("share-modal");
  if (!modal) return console.error("❌ לא נמצא מודאל עם id=share-modal");
  modal.classList.remove("d-none");
  modal.style.display = "flex";
  const successMsg = document.getElementById("share-success");
  if (successMsg) successMsg.classList.add("d-none");
}
function closeShareModal() {
  document.getElementById("share-modal").classList.add("d-none");
}
function sendToFriend(friendElement) {
  const friendName = friendElement.textContent.trim();
  const success = document.getElementById("share-success");
  success.textContent = `✅ הפוסט נשלח ל-${friendName}!`;
  success.classList.remove("d-none");
}
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.sendToFriend = sendToFriend;

/* ---------- Web Service: Trending Tech ---------- */
async function loadTechNewsWidget() {
  const box = document.getElementById("newsWidget");
  if (!box) return;
  try {
    const res = await fetch(`${API_BASE}/api/news/hackernews`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error("bad response");
    const list = Array.isArray(data.articles) ? data.articles : [];
    if (!list.length) {
      box.innerHTML = `<p class="text-muted m-0">אין פריטים להציג כרגע.</p>`;
      return;
    }
    box.innerHTML = list.map((a) => `
      <div class="news-item">
        <a href="${escAttr(a.url)}" target="_blank" rel="noopener noreferrer">
          ${escAttr(a.title)}
        </a>
        <small>by ${escAttr(a.by || "unknown")} • ${escAttr(formatTimeAgo(a.time * 1000))}</small>
      </div>
    `).join("");
  } catch (err) {
    console.error("TechNews error:", err);
    box.innerHTML = `<p class="text-muted m-0">לא ניתן לטעון חדשות כרגע.</p>`;
  }
}
document.addEventListener("DOMContentLoaded", () => { loadTechNewsWidget(); });
