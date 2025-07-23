localStorage.setItem("profilePic", user.profilePic || "/assets/Photos/defaultprfl.png");
localStorage.setItem("username", user.username);

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (username === "" || password === "") {
      alert("אנא מלא את כל השדות");
      return;
    }

   try {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("loggedInUser", data.username);
    localStorage.setItem("profilePic", data.profilePic || "/assets/Photos/defaultprfl.png");
    alert("התחברת בהצלחה!");
    window.location.href = "feed.html";
  } else {
    alert(data.error || "שגיאת התחברות");
  }

} catch (err) {
  alert("שגיאת שרת. נסה שוב מאוחר יותר.");
  console.error(err);
}

  });
});
const username = localStorage.getItem("loggedInUser");

fetch(`/api/users/${username}`)
  .then(res => res.json())
  .then(user => {
    const profilePic = user.profilePic || "/assets/Photos/default-profile.png";
    localStorage.setItem("profilePic", profilePic);
    document.getElementById("profile-picture").src = profilePic;
  });
