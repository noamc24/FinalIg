// Helper to resolve media/profile URLs
function resolveMediaUrl(u) {
  if (!u) return '../assets/Photos/userp.jpg';
  const s = String(u).trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (s.startsWith('/uploads/')) return 'http://localhost:3000' + s;
  if (s.match(/\.(jpg|png|jpeg|gif)$/i)) return 'http://localhost:3000/uploads/' + s;
  return s;
}
const API_BASE = window.location.origin.includes('5500') ? 'http://localhost:3000' : window.location.origin;
// publicProfile.js
// Load and display public user profile and posts

// Get username from query string
function getUsernameFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('user');
}

async function loadPublicProfile() {
  const username = getUsernameFromQuery();
  console.log('Loading public profile for:', username);
  if (!username) {
    document.body.innerHTML = '<h2>משתמש לא נמצא</h2>';
    return;
  }
  try {
    // Fetch user profile
  const res = await fetch(`${API_BASE}/api/users/profile/${username}`);
    console.log('Profile API status:', res.status);
    const data = await res.json();
    console.log('Profile API response:', data);
    if (!data.success) throw new Error('User not found');
    document.getElementById('publicProfileUsername').textContent = data.username;
    document.getElementById('publicProfileFullName').textContent = data.fullName || '';
  document.getElementById('publicProfilePic').src = resolveMediaUrl(data.profilePic);
    // Hide follow button if this is your own profile
    const myUsername = localStorage.getItem('loggedInUser');
    console.log('My username:', myUsername);
    const followBtn = document.getElementById('followBtn');
    if (myUsername && myUsername === data.username) {
      followBtn.style.display = 'none';
    } else {
      followBtn.style.display = '';
      followBtn.disabled = false;
      // Check if already following
      let isFollowing = false;
      if (data.followers && myUsername) {
        isFollowing = data.followers.includes(myUsername);
      }
      followBtn.textContent = isFollowing ? 'Following' : 'Follow';
      followBtn.classList.toggle('following', isFollowing);
      followBtn.onclick = () => toggleFollowUnified(data.username, myUsername, followBtn);
    }
    // Fetch user posts
  const postsRes = await fetch(`${API_BASE}/api/posts/user/${username}`);
    console.log('Posts API status:', postsRes.status);
    const postsData = await postsRes.json();
    console.log('Posts API response:', postsData);
    if (postsData.success && Array.isArray(postsData.posts)) {
      renderGallery(postsData.posts);
      document.getElementById('publicProfilePosts').textContent = postsData.posts.length;
    }
    // Fetch followers/following counts
    if (data.followers) document.getElementById('publicProfileFollowers').textContent = data.followers.length;
    if (data.following) document.getElementById('publicProfileFollowing').textContent = data.following.length;
  } catch (e) {
    console.error('Error loading public profile:', e);
    document.body.innerHTML = '<h2>משתמש לא נמצא</h2>';
  }
}

function renderGallery(posts) {
  const gallery = document.getElementById('publicProfileGallery');
  gallery.innerHTML = '';
  posts.forEach(post => {
    let el;
    if (post.mediaType === 'video' || (post.mediaUrl && post.mediaUrl.match(/\.mp4$/i))) {
      el = document.createElement('video');
      el.src = resolveMediaUrl(post.mediaUrl);
      el.controls = true;
    } else {
      el = document.createElement('img');
      el.src = resolveMediaUrl(post.mediaUrl);
      el.alt = post.caption || '';
    }
    gallery.appendChild(el);
  });
}



// Unified follow button logic (same as feed)
async function toggleFollowUnified(followeeUsername, followerUsername, button) {
  if (!followerUsername) {
    alert('עליך להתחבר כדי לעקוב');
    return;
  }
  const isFollowing = button.classList.contains('following');
  const action = isFollowing ? 'unfollow' : 'follow';
  try {
    const res = await fetch(`${API_BASE}/api/users/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerUsername, followeeUsername })
    });
    const result = await res.json();
    if (res.ok) {
      if (action === 'follow') {
        button.textContent = 'Following';
        button.classList.add('following');
      } else {
        button.textContent = 'Follow';
        button.classList.remove('following');
      }
      // Refresh profile and stats after follow/unfollow
      await loadPublicProfile();
    } else {
      alert(result.error || 'שגיאה בבקשה');
    }
  } catch (err) {
    console.error('שגיאה בבקשת follow/unfollow:', err);
    // alert('שגיאה בשרת');
  }
}

window.addEventListener('DOMContentLoaded', loadPublicProfile);
