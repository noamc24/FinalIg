document.addEventListener("DOMContentLoaded", async () => {
  const usernameFromURL = window.location.pathname.split("/").pop();
  const loggedInUser = localStorage.getItem("loggedInUser");

  try {
    const res = await fetch(`/api/users/${usernameFromURL}`);
    const { user, posts } = await res.json();

    document.getElementById("username").textContent = "@" + user.username;
    document.getElementById("bio").textContent = user.bio || "No bio available";
    document.getElementById("profilePic").src = user.profilePicUrl || "/assets/Photos/defaultPrfl.png";
    document.getElementById("postsCount").textContent = `${posts.length} posts`;
    document.getElementById("followersCount").textContent = `${user.followers.length} followers`;
    document.getElementById("followingCount").textContent = `${user.following.length} following`;

    const actionBtn = document.getElementById("actionBtn");
    if (loggedInUser === user.username) {
      actionBtn.textContent = "Edit Profile";
    } else {
      actionBtn.textContent = user.followers.includes(loggedInUser) ? "Unfollow" : "Follow";
      actionBtn.onclick = () => {
        //קוד follow/unfollow 
        alert("Coming soon");
      };
    }

    const postsGrid = document.getElementById("postsGrid");
    posts.forEach(post => {
      const col = document.createElement("div");
      col.className = "col-4 mb-3";
      col.innerHTML = `<img src="${post.mediaUrl}" class="post-img rounded" />`;
      postsGrid.appendChild(col);
    });

  } catch (err) {
    console.error("Error loading profile:", err);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const username = window.location.pathname.split("/").pop();

  try {
    const res = await fetch(`/api/users/${username}`);
    const { user, posts } = await res.json();

    document.getElementById("username").textContent = "@" + user.username;
    document.getElementById("posts-count").textContent = `${posts.length} posts`;

    const postsContainer = document.getElementById("user-posts");
    posts.forEach(post => {
      const div = document.createElement("div");
      div.innerHTML = `
        ${post.mediaType === "image"
          ? `<img src="${post.mediaUrl}" style="width: 100%; height: 300px; object-fit: cover;">`
          : `<video src="${post.mediaUrl}" controls style="width: 100%; height: 300px; object-fit: cover;"></video>`
        }
      `;
      postsContainer.appendChild(div);
    });

  } catch (err) {
    console.error("שגיאה בטעינת הפוסטים:", err);
  }
});
