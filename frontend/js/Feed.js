let currentPost = null;
const API_BASE = "http://localhost:3000";
let currentPostId = null;

const profilePic = localStorage.getItem("profilePic") || "/assets/Photos/defaultprfl.png";
const username = localStorage.getItem("loggedInUser");
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    window.location.href = "login.html";
    return;
  }
  localStorage.setItem("username", username);
});

localStorage.setItem("profilePic", profilePic);


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

  // מצב לילה/יום
  const toggleButtons = document.querySelectorAll(".toggle-mode");
  toggleButtons.forEach(btn => {
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

  // טעינת מצב תצוגה קודם
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const icon = document.querySelector(".toggle-mode i");
    if (icon) {
      icon.classList.remove("bx-moon");
      icon.classList.add("bx-sun");
    }
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
          body: JSON.stringify({
            followerUsername: follower,
            followeeUsername: followee
          })
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




 let isSearch = false;

function changesearch(){
    if (!isSearch)
    {
        document.getElementById('searchdiv').innerHTML= `
        <a href="#" class="text-dark ms-1" onclick="changesearch()">
        <i class="bx bx-search fs-2"></i>
        </a>
        <div class="search-bar d-flex align-items-center ms-1" style="max-width: 244px; height: 35px;">
            <input type="search" id="searchInput" class="form-control form-control-sm bg-transparent text-light border-0 shadow-none" placeholder="Search...">
            <i class='bx bx-search'></i>
        </div>
        `;
        activateSearchFilter(document.getElementById('searchInput'));
        isSearch = true;
    }
    else
    {
        document.getElementById('searchdiv').innerHTML = `
        <a href="#" class="text-dark ms-1" onclick="changesearch()">
        <i class="bx bx-search fs-2"></i>
        </a>
        <p class="ms-3 fs-5 mb-0 fw-bold" onclick="changesearch()"> Search</p>
        `
        isSearch = false;
    }
}   

async function toggleLike(button, postId) {
  // אם לא הגיע מזה, ניקח מה-data-id
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

    // עדכון UI
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



function activateSearchFilter(input){
     if (!input) return;

  input.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const posts = document.querySelectorAll('.post');

    posts.forEach(post => {
      const captionEl = post.querySelector('.post-caption');
      const captionText = captionEl ? captionEl.innerText.toLowerCase() : '';

      post.style.display = captionText.includes(query) ? 'block' : 'none';
    });
  });

}
 const searchInputs = document.querySelectorAll(".search-input");

  searchInputs.forEach(input => {
    input.addEventListener("input", function () {
      const query = this.value.toLowerCase();
      const posts = document.querySelectorAll(".post");

      posts.forEach(post => {
        const captionEl = post.querySelector(".post-caption");
        const captionText = captionEl ? captionEl.innerText.toLowerCase() : '';

        if (captionText.includes(query)) {
          post.style.display = 'block';
        } else {
          post.style.display = 'none';
        }
      });
    });
  });


  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");

    const icon = document.querySelector(".toggle-mode i");
    if (icon) {
      icon.classList.remove("bx-moon");
      icon.classList.add("bx-sun");
    }
  };


async function handlePostUpload() {
  const caption = document.getElementById("captionInput").value.trim();
  const file = document.getElementById("mediaInput").files[0];
  const username = localStorage.getItem("loggedInUser");
  const profilePic =
    localStorage.getItem("profilePic") ||
    `${API_BASE}/assets/Photos/defaultprfl.png`;

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
    const res = await fetch(`${API_BASE}/api/posts`, {
      method: "POST",
      body: formData,
    });

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
          <i class='bx bx-trash post-delete-btn ms-3'
             onclick="deletePostRequest('${post._id}')"
             title="מחק פוסט"></i>
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
          <button class="cmnt-btn" onclick="toggleCommentsSidebar(this)">
            💬 תגובות <span class="comment-count">0</span>
          </button>
        </div>

        <div class="post-caption">
          <span class="username">${post.username}</span> ${post.caption}
        </div>

        <div class="comments-list d-none"></div>
      </div>
    `;

    addPostToFeed(postHTML);

    document.getElementById("captionInput").value = "";
    document.getElementById("mediaInput").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("postModal"));
    if (modal) modal.hide();

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

  setTimeout(() => {
    postWrapper.classList.remove("highlight");
  }, 2000);

 
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

  posts.forEach(post => {
    const hasImage = post.querySelector("img");
    const hasVideo = post.querySelector("video");

    if (selected === "all") {
      post.style.display = "block";
    } else if (selected === "image") {
      post.style.display = hasImage && !hasVideo ? "block" : "none";
    } else if (selected === "video") {
      post.style.display = hasVideo ? "block" : "none";
    } else if (selected === "text") {
      post.style.display = (!hasImage && !hasVideo) ? "block" : "none";
    }
  });
}

async function deletePostRequest(postId) {
  const username = localStorage.getItem("loggedInUser");
  if (!username) return alert("משתמש לא מחובר!");

  try {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/${username}`, {
      method: "DELETE"
    });

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
    if (data.success) {
      renderComments(data.comments);
    }
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
        <div>
          <b>${c.username}</b>: ${c.text}
        </div>
        ${
          c.username === localStorage.getItem("loggedInUser")
            ? `
            <div>
              <button class="btn btn-sm btn-warning me-1" onclick="editSidebarComment('${c._id}', '${c.text}')">✏️</button>
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
  const heart = container.querySelector('.heart-animation');
  heart.classList.add('active');

  const post = container.closest('.post');
  const likeBtn = post.querySelector('.like-btn');

  const alreadyLiked = likeBtn.classList.contains("liked");

  if (!alreadyLiked) {
    toggleLike(likeBtn);
  }

  setTimeout(() => {
    heart.classList.remove('active');
  }, 600);
}


function toggleCommentsSidebar(button) {
  const sidebar = document.getElementById("comments-sidebar");
  if (!sidebar) {
    console.error("❌ לא נמצא אלמנט עם id=comments-sidebar");
    return;
  }

  sidebar.classList.remove("d-none");

  currentPost = button.closest('.post');

  currentPostId = currentPost.dataset.id;  

  const previewContainer = document.getElementById("post-preview");
  previewContainer.innerHTML = "";

  const clonedPost = currentPost.cloneNode(true);
  previewContainer.appendChild(clonedPost);

  clonedPost.querySelectorAll('.like-btn').forEach(likeBtn => {
    likeBtn.addEventListener("click", () => {
      toggleLike(likeBtn);
    });
  });

  loadComments(currentPostId);
}




function closeCommentsSidebar() {
  document.getElementById("comments-sidebar").classList.add("d-none");
  currentPostId = null;
}
async function submitSidebarComment() {
  const text = document.getElementById("comment-text").value.trim();
  ("text:", text, "currentPostId:", currentPostId);

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
  if (counter) {
    counter.textContent = count;
  }
}


let typingTimeout = null;

document.getElementById("comment-text").addEventListener("input", () => {
  const indicator = document.getElementById("typing-indicator");
  indicator.style.display = "block";

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    indicator.style.display = "none";
  }, 1500);
});
let sharedPost = null;

function openShareModal(button) {
  const modal = document.getElementById("share-modal");
  if (!modal) {
    console.error("❌ לא נמצא מודאל עם id=share-modal");
    return;
  }

  modal.classList.remove("d-none");
  modal.style.display = "flex";

  const successMsg = document.getElementById("share-success");
  if (successMsg) {
    successMsg.classList.add("d-none");
  }
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

document.getElementById("share-search").addEventListener("input", function () {
  const query = this.value.toLowerCase();
  document.querySelectorAll("#friend-list li").forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(query) ? "inline-block" : "none";
  });
});



document.addEventListener("DOMContentLoaded", function () {
  const followBtn = document.getElementById("follow-button");
  if (followBtn) {
    followBtn.addEventListener("click", async () => {
      document.getElementById("follow-button").addEventListener("click", async () => {
        const targetUsername = document.getElementById("follow-button").dataset.username;
        const currentUser = localStorage.getItem("username");
      
        try {
          const res = await fetch(`/api/users/${currentUser}/follow/${targetUsername}`, {
            method: "POST"
          });
      
          const result = await res.json();
          if (res.ok) {
            alert(result.message);
          } else {
            alert(result.error);
          }
        } catch (err) {
          console.error("שגיאה:", err);
          alert("שגיאה בשרת");
        }
        });
    });
  }
});
  function formatTimeAgo(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created; // הפרש במילישניות
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

  function renderFeed(posts) {
  if (!Array.isArray(posts)) {
    console.error("Posts is not an array:", posts);
    return;
  }

  const container = document.getElementById("feedContainer");
  const currentUser = localStorage.getItem("loggedInUser");
  container.innerHTML = "";

  posts.forEach(async (post) => {
    const isNotMe = post.username !== currentUser;
const profilePic = post.profilePic?.startsWith("http")
  ? post.profilePic
  : `${API_BASE}${post.profilePic || "/assets/Photos/defaultprfl.png"}`;

    let followButtonHTML = "";
    if (isNotMe) {
      const isFollowing = await checkFollowingStatus(currentUser, post.username);
      const label = isFollowing ? "Unfollow" : "Follow";
      followButtonHTML = `<button class="follow-button" data-username="${post.username}">${label}</button>`;
    }

const mediaHTML =
  post.mediaType === "image"
    ? `<img src="${API_BASE}${post.mediaUrl}" class="post-image" />`
    : `<video class="post-video" controls autoplay loop style="max-width:100%; height:auto;">
         <source src="${API_BASE}${post.mediaUrl}" type="video/mp4">
         הדפדפן שלך לא תומך בניגון וידאו.
       </video>`;



   const postHTML = `
  <div class="post" data-id="${post._id}">
    <div class="post-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <img src="${profilePic}" class="avatar" />
        <span class="username d-flex">${post.username} <p class="ms-2 text-secondary">•${formatTimeAgo(post.createdAt)}</p></span>  
      </div>
      ${isNotMe ? followButtonHTML : `<i class='bx bx-trash post-delete-btn ms-3'    onclick="deletePostRequest('${post._id}')" 
 title="מחק פוסט"></i>`}
    </div>

    <div class="post-image-container" ondblclick="showHeart(this)">
      ${mediaHTML}
      <div class="heart-animation">❤️</div>
    </div>

    <div class="post-actions">
<button 
  class="like-btn ${post.likes.includes(currentUser) ? "liked" : ""}" 
  data-likes="${post.likes.length}" 
  data-id="${post._id}" 
  onclick="toggleLike(this, '${post._id}')">
  <i class='bx bx-heart'></i> 
  <span class="like-count">${post.likes.length}</span>
</button>

      <button class="cmnt-btn" onclick="toggleCommentsSidebar(this)">
        💬 תגובות <span class="comment-count">${post.comments.length}</span>
      </button>
      <button class="share-btn" onclick="openShareModal(this)">
        <i class='bx bx-send'></i>
      </button>
    </div>

    <div class="post-caption">
      <span class="username">${post.username}</span> ${post.caption}
    </div>

    <div class="comments-list d-none"></div>
  </div>
`;


    container.innerHTML += postHTML;
  });
}


function activateFollowButtons() {
  const currentUser = localStorage.getItem("loggedInUser");
  const buttons = document.querySelectorAll(".follow-button");

  buttons.forEach(button => {
    const targetUser = button.dataset.username;

    button.addEventListener("click", async () => {
      const action = button.textContent.trim().toLowerCase() === "follow" ? "follow" : "unfollow";

      try {
        const res = await fetch(`/api/users/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followerUsername: currentUser,
            followeeUsername: targetUser
          })
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


document.querySelectorAll(".follow-button").forEach(button => {
  button.addEventListener("click", async function () {
    const usernameToFollow = this.getAttribute("data-username");

    try {
      const res = await fetch(`/api/follow/${usernameToFollow}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    const res = await fetch(`/api/users/isFollowing?follower=${currentUser}&followee=${targetUser}`);
    const data = await res.json();
    return res.ok && data.isFollowing;
  } catch (err) {
    console.error("שגיאה בבדיקת סטטוס מעקב:", err);
    return false;
  }
}

async function goToMyProfile() {
  const username = localStorage.getItem("loggedInUser");
  if (!username) {
    alert("משתמש לא מחובר");
    return;
  }
    window.location.href = `/profile/${username}`;
}


