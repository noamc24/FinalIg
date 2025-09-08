// ====== CONFIG ======
const API_BASE = "http://localhost:3000";
const DEFAULT_PROFILE = "../assets/Photos/defaultPrfl.png"; // שנה אם צריך

// ====== HELPERS ======
function resolveProfilePic(raw) {
  if (!raw) return DEFAULT_PROFILE;
  const s = String(raw).trim();
  if (!s || s === "null" || s === "undefined") return DEFAULT_PROFILE;

  // URL מלא
  if (/^https?:\/\//i.test(s)) return s;

  // נתיב יחסי מהשרת (למשל /uploads/...)
  if (s.startsWith("/")) return `${API_BASE}${s}`;

  // נתיב יחסי בפרונט
  return s;
}

function formatTimeAgo(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diff = now - created;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const w = Math.floor(d / 7);
  if (m < 1) return "כעת";
  if (m < 60) return `${m} דק׳`;
  if (h < 24) return `${h} שעות`;
  if (d < 7) return `${d} ימים`;
  return `${w} שבועות`;
}

// ====== DATA FETCH (with fallback) ======
async function fetchUserPosts(username) {
  // נסה קודם endpoint ייעודי
  try {
    const r = await fetch(`${API_BASE}/api/posts/user/${username}`);
    if (r.ok) {
      const json = await r.json();
      if (Array.isArray(json)) return json;
      if (Array.isArray(json.posts)) return json.posts;
    }
  } catch (_) {}

  // פולבק: ניקח את הפיד ונסנן לפוסטים של המשתמש עצמו
  try {
    const r2 = await fetch(`${API_BASE}/api/posts/feed/${username}`);
    const arr = await r2.json();
    if (Array.isArray(arr)) {
      return arr.filter(p => p.username === username);
    }
  } catch (_) {}

  return [];
}

async function fetchUserStats(username) {
  // אם יש אצלך API כזה – מצוין. אחרת נציג מינימום.
  try {
    const r = await fetch(`${API_BASE}/api/users/stats?username=${encodeURIComponent(username)}`);
    if (r.ok) return await r.json();
  } catch (_) {}
  return { followers: "-", following: "-" };
}

// ====== RENDER ======
function renderHeader({ username, fullName, bio, profilePic }) {
  const $ = (sel) => document.querySelector(sel);

  $("#profileUsername").textContent = username;
  $("#profileHandle").textContent = `@${username}`;

  if (fullName) $("#profileFullName").textContent = fullName;
  const savedBio = localStorage.getItem("bio");
  $("#profileBio").textContent = savedBio || bio || "";

  const avatarSrc = resolveProfilePic(profilePic || localStorage.getItem("profilePic"));
  const avatar = document.getElementById("profileAvatar");
  avatar.src = avatarSrc;
  avatar.onerror = () => { avatar.src = DEFAULT_PROFILE; };

  // שמירת דיפולט אם אין
  if (!localStorage.getItem("profilePic")) {
    localStorage.setItem("profilePic", avatarSrc);
  }
}

function renderStats({ postsCount, followers, following }) {
  document.getElementById("postsCount").textContent = postsCount ?? 0;
  document.getElementById("followersCount").textContent = followers ?? "-";
  document.getElementById("followingCount").textContent = following ?? "-";
}

function renderGallery(posts, username, avatarSrc) {
  const gallery = document.getElementById("gallery");
  const empty = document.getElementById("emptyState");

  gallery.innerHTML = "";

  if (!posts.length) {
    empty.classList.remove("d-none");
    return;
  }
  empty.classList.add("d-none");

  for (const p of posts) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.id = p._id;

    const mediaURL = p.mediaUrl?.startsWith("http") ? p.mediaUrl : `${API_BASE}${p.mediaUrl}`;
    if (p.mediaType === "video") {
      tile.innerHTML = `
        <video muted>
          <source src="${mediaURL}" type="video/mp4">
        </video>
        <div class="badge"><i class='bx bx-movie-play'></i> וידאו</div>
      `;
    } else {
      tile.innerHTML = `<img src="${mediaURL}" alt="">`;
    }

    tile.addEventListener("click", () => openPostModal(p, username, avatarSrc));
    gallery.appendChild(tile);
  }
}

// ====== MODAL ======
function openPostModal(post, username, avatarSrc) {
  const title = document.getElementById("postModalTitle");
  const media = document.getElementById("postModalMedia");
  const user = document.getElementById("postModalUser");
  const time = document.getElementById("postModalTime");
  const caption = document.getElementById("postModalCaption");
  const likes = document.getElementById("postModalLikes");
  const comments = document.getElementById("postModalComments");
  const avatar = document.getElementById("postModalAvatar");

  title.textContent = "תצוגת פוסט";
  user.textContent = username;
  time.textContent = formatTimeAgo(post.createdAt);
  caption.textContent = post.caption || "";
  likes.textContent = Array.isArray(post.likes) ? post.likes.length : 0;
  comments.textContent = Array.isArray(post.comments) ? post.comments.length : 0;

  avatar.src = avatarSrc || DEFAULT_PROFILE;
  avatar.onerror = () => { avatar.src = DEFAULT_PROFILE; };

  const mediaURL = post.mediaUrl?.startsWith("http") ? post.mediaUrl : `${API_BASE}${post.mediaUrl}`;
  media.innerHTML =
    post.mediaType === "video"
      ? `<video controls autoplay loop muted><source src="${mediaURL}" type="video/mp4"></video>`
      : `<img src="${mediaURL}" alt="">`;

  const m = new bootstrap.Modal(document.getElementById("postModal"));
  m.show();

  document.getElementById("toFeedBtn").onclick = () => {
    window.location.assign("feed.html");
  };
}

// ====== BOOT ======
document.addEventListener("DOMContentLoaded", async () => {
  // אימות
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    window.location.assign("login.html");
    return;
  }

  // מידע בסיסי ל-header
  renderHeader({
    username,
    fullName: localStorage.getItem("fullName") || "", // אם תרצה לשמור בעתיד
    bio: localStorage.getItem("bio") || "",
    profilePic: localStorage.getItem("profilePic")
  });

  // ספירות
  const stats = await fetchUserStats(username);
  // פוסטים
  const posts = await fetchUserPosts(username);

  renderStats({
    postsCount: posts.length,
    followers: stats.followers,
    following: stats.following
  });

  const avatarSrc = resolveProfilePic(localStorage.getItem("profilePic"));
  renderGallery(posts, username, avatarSrc);

  // שינוי תמונת פרופיל (שמירה ב-localStorage)
  const changeBtn = document.getElementById("changeAvatarBtn");
  const avatarInput = document.getElementById("avatarInput");
  const profileAvatar = document.getElementById("profileAvatar");

  changeBtn.addEventListener("click", () => avatarInput.click());
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const username = localStorage.getItem("username");
    const formData = new FormData();
    formData.append("profilePic", file);

    fetch(`${API_BASE}/api/users/update/${username}`, {
      method: "PUT",
      body: formData
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to upload profile picture");
        const data = await res.json();
        if (data.user && data.user.profilePic) {
          localStorage.setItem("profilePic", data.user.profilePic);
          profileAvatar.src = resolveProfilePic(data.user.profilePic);
        }
      })
      .catch((err) => {
        alert("שגיאה בהעלאת תמונת פרופיל");
        console.error(err);
      });
  });

  // עריכת ביוגרפיה (שמירה ב-localStorage)
  const editBioBtn = document.getElementById("editBioBtn");
  const bioEl = document.getElementById("profileBio");
  editBioBtn.addEventListener("click", () => {
    const current = bioEl.textContent || "";
    const updated = prompt("עריכת ביוגרפיה:", current);
    if (updated !== null) {
      bioEl.textContent = updated;
      localStorage.setItem("bio", updated);
    }
  });

  // יציאה
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    window.location.assign("login.html");
  });

  // החלפת משתמש (switch)
  const switchBtn = document.getElementById("switchBtn");
  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      // אפשר למחוק גם פרטים נוספים אם צריך
      localStorage.clear();
      window.location.assign("login.html");
    });
  }
});
