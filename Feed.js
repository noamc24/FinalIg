const currentUser = {
  username: "LookAlikeGaming",
  avatar: "ChatGPT Image prfl4.png" 
};


function toggleLike(button) {
  let liked = button.classList.contains("liked");
  let count = parseInt(button.dataset.likes);
  liked = !liked;
  count += liked ? 1 : -1;
  button.innerHTML = `${liked ? "♥" : "♡"} <span class="like-count">${count.toLocaleString()}</span>`;
  button.classList.toggle("liked", liked);
  button.dataset.likes = count;
}
document.querySelectorAll(".like-btn").forEach(button => {
  button.addEventListener("click", () => {
    toggleLike(button);
  });
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

document.addEventListener("DOMContentLoaded", () => {
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


  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");

    const icon = document.querySelector(".toggle-mode i");
    if (icon) {
      icon.classList.remove("bx-moon");
      icon.classList.add("bx-sun");
    }
  }
});

function handlePostUpload() {
  const caption = document.getElementById('captionInput').value;
  const file = document.getElementById('mediaInput').files[0];

  if (!caption || !file) {
    alert("Please provide both caption and media.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const mediaSrc = e.target.result;
    let mediaHTML = "";

    if (file.type.startsWith("image/")) {
      mediaHTML = `<img src="${mediaSrc}" class="post-image" />`;
    } else if (file.type.startsWith("video/")) {
      mediaHTML = `
        <video class="post-video" controls muted autoplay loop style="max-width: 100%; border-radius: 8px;">
          <source src="${mediaSrc}" type="${file.type}">
          Your browser does not support the video tag.
        </video>
      `;
    } else {
      alert("Unsupported file type.");
      return;
    }

   const postHTML = `
  <div class="post-header d-flex justify-content-between align-items-center">
    <div class="d-flex align-items-center">
      <img src="ChatGPT Image prfl4.png" class="avatar" />
      <span class="username d-flex">Look Alike <p class="ms-2 text-secondary">• now</p></span>  
    </div>
    <i class='bx bx-trash post-delete-btn ms-3' onclick="deletePost(this)" title="מחק פוסט"></i>
  </div>

  <div class="post-image-container" ondblclick="showHeart(this)">
    ${mediaHTML}
    <div class="heart-animation">❤️</div>
  </div>

  <div class="post-actions">
    <button class="like-btn" data-likes="0">
      <i class='bx bx-heart'></i> <span class="like-count">0</span>
    </button>
    <button class="cmnt-btn" onclick="toggleCommentsSidebar(this)">
      💬 תגובות <span class="comment-count">0</span>
    </button>
    <button class="share-btn" onclick="openShareModal(this)">
      <i class='bx bx-send'></i>
    </button>
  </div>

  <div class="post-caption">
    <span class="username">Look Alike</span> ${caption}
  </div>

  <div class="comments-list d-none"></div>
`;


    addPostToFeed(postHTML);
    document.getElementById('captionInput').value = "";
    document.getElementById('mediaInput').value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById('postModal'));
    modal.hide();
  };

  reader.readAsDataURL(file);
}
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
document.addEventListener("DOMContentLoaded", () => {
  const scrollBtn = document.getElementById("scrollToTopBtn");

  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollBtn.style.display = "block";
    } else {
      scrollBtn.style.display = "none";
    }
  });


  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});
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

function deletePost(iconElement) {
  const postElement = iconElement.closest(".post");
  if (!postElement) return;

  if (confirm("Are you sure you want to delete this post?")) {
    postElement.remove();
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

let currentPost = null;

function toggleCommentsSidebar(button) {
  const sidebar = document.getElementById("comments-sidebar");

  if (!sidebar.classList.contains("d-none")) return;

  currentPost = button.closest('.post');

  const previewContainer = document.getElementById("post-preview");
  previewContainer.innerHTML = "";

  const clonedPost = currentPost.cloneNode(true);
  previewContainer.appendChild(clonedPost);

  clonedPost.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener("click", () => {
      toggleLike(button);
    });
  });

  const postList = currentPost.querySelector('.comments-list');
  const sidebarList = document.getElementById("comments-list");
  sidebarList.innerHTML = postList.innerHTML;

  document.getElementById("comment-text").value = "";
  sidebar.classList.remove("d-none");
}



function closeCommentsSidebar() {
  if (!currentPost) return;

  const sidebar = document.getElementById("comments-sidebar");
  const sidebarList = document.getElementById("comments-list");
  const postList = currentPost.querySelector('.comments-list');

  postList.innerHTML = sidebarList.innerHTML;
  updateCommentCount(currentPost);

  sidebar.classList.add("d-none");
  currentPost = null;

}

function submitSidebarComment() {
  const text = document.getElementById("comment-text").value.trim();
  if (!text || !currentPost) return;

  const comment = document.createElement("div");
  comment.classList.add("comment");

  comment.innerHTML = `
    <img src="${currentUser.avatar}">
    <div class="comment-content">
      <strong>${currentUser.username}:</strong> ${text}
    </div>
  `;

  const sidebarList = document.getElementById("comments-list");
  sidebarList.appendChild(comment);

  document.getElementById("comment-text").value = "";

  updateCommentCount(currentPost);
}


function updateCommentCount(postElement) {
  const countSpan = postElement.querySelector('.comment-count');
  if (!countSpan) return;

  const base = parseInt(postElement.dataset.comments || "0");
  let count = 0;

  const sidebar = document.getElementById("comments-sidebar");
  const sidebarVisible = !sidebar.classList.contains("d-none");

  if (sidebarVisible && postElement === currentPost) {
    const sidebarList = document.getElementById("comments-list");
    count = sidebarList.querySelectorAll('.comment').length;
  } else {
    const commentList = postElement.querySelector('.comments-list');
    count = commentList.querySelectorAll('.comment').length;
  }

  countSpan.textContent = `${base + count}`;
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

document.getElementById("feedContainer").addEventListener("click", (e) => {
  if (e.target.closest(".like-btn")) {
    toggleLike(e.target.closest(".like-btn"));
  } else if (e.target.closest(".cmnt-btn")) {
    const btn = e.target.closest(".cmnt-btn");
    if (btn.innerText.includes("תגובות")) {
      toggleCommentsSidebar(btn);
    } else if (btn.querySelector(".bx-send")) {
      openShareModal(btn);
    }
  }
});
