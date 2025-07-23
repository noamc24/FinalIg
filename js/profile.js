document.addEventListener("DOMContentLoaded", async () => {
  const usernameFromURL = window.location.pathname.split("/").pop();
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
  console.warn("אין משתמש מחובר");
  window.location.href = "login.html";
  return;
  }

  try {
    const res = await fetch(`/api/users/${usernameFromURL}`);
    const { user, posts } = await res.json();

    // פרטי המשתמש
    const usernameElem = document.getElementById("username");
    if (usernameElem) usernameElem.textContent = "@" + user.username;

    const bioElem = document.getElementById("bio");
    if (bioElem) bioElem.textContent = user.bio || "No bio available";

   const profilePicElem = document.getElementById("profilePic");
   if (profilePicElem) {
   console.log("🧠 user.profilePic מהשרת:", user.profilePic);
  
   const finalPic = user.profilePic || "/assets/Photos/defaultPrfl.png";
   profilePicElem.src = finalPic;

   console.log("📷 src שהוגדר בפועל:", profilePicElem.src);
}

    const postsCountElem = document.getElementById("posts-count");
    if (postsCountElem) postsCountElem.textContent = `${posts.length} posts`;

    const followersCountElem = document.getElementById("followersCount");
    if (followersCountElem) followersCountElem.textContent = `${user.followers.length} followers`;

    const followingCountElem = document.getElementById("followingCount");
    if (followingCountElem) followingCountElem.textContent = `${user.following.length} following`;

    // כפתור Edit/Follow
    const actionBtn = document.getElementById("actionBtn");
    if (actionBtn) {
      if (loggedInUser === user.username) {
        actionBtn.textContent = "Edit Profile";
      } else {
        actionBtn.textContent = user.followers.includes(loggedInUser) ? "Unfollow" : "Follow";
        actionBtn.onclick = () => {
          alert("Coming soon"); // אפשר להחליף בקוד follow/unfollow בעתיד
        };
      }
    }

    // תבנית פוסטים 
    const postsGrid = document.getElementById("postsGrid");
    if (postsGrid) {
      posts.forEach(post => {
        const col = document.createElement("div");
        col.className = "col-4 mb-3";
        col.innerHTML = `<img src="${post.mediaUrl}" class="post-img rounded" />`;
        postsGrid.appendChild(col);
      });
    }

    //  תבנית פוסטים למדיה שונה (תמונות / סרטונים)
    const postsContainer = document.getElementById("user-posts");
    if (postsContainer) {
      posts.forEach(post => {
        const div = document.createElement("div");
        div.innerHTML = `
          ${post.mediaType === "image"
            ? `<img src="${post.mediaUrl}" style="width: 100%; height: 300px; object-fit: cover;">`
            : `<video src="${post.mediaUrl}" controls style="width: 100%; height: 300px; object-fit: cover;"></video>`}
        `;
        postsContainer.appendChild(div);
      });
    }

  } catch (err) {
    console.error("❌ שגיאה בטעינת הפרופיל:", err);
  }
  });
