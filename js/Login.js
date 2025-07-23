document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const inputUsername = document.getElementById("username").value.trim(); // ⬅️ שינוי כאן
    const password = document.getElementById("password").value;

    if (inputUsername === "" || password === "") {
      alert("אנא מלא את כל השדות");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: inputUsername, password }) // ⬅️ גם פה
      });

      const data = await res.json();
      console.log("data שהתקבלה מהשרת:", data);

      if (res.ok) {
        console.log("התחברות הצליחה, data:", data);
        localStorage.setItem("loggedInUser", data.username);
        localStorage.setItem("profilePic", data.profilePic || "/assets/Photos/defaultprfl.png");

        console.log("מה נשמר ב-localStorage:", localStorage.getItem("loggedInUser"), localStorage.getItem("profilePic"));

        alert("התחברת בהצלחה!");

        console.log("נשלח לשרת:", username, password);

        window.location.href = "feed.html";
      } else {
        alert(data.error || "שגיאת התחברות");
      }
    } catch (err) {
      alert("שגיאת שרת. נסה שוב מאוחר יותר.");
      console.error(err);
    }
  });

  const savedUsername = localStorage.getItem("loggedInUser"); // ⬅️ שינוי שם

  if (savedUsername) {
    fetch(`/api/users/${savedUsername}`)
      .then(res => res.json())
      .then(data => {
        const profilePic = data.user.profilePic || "/assets/Photos/default-profile.png";
        localStorage.setItem("profilePic", profilePic);
        const img = document.getElementById("profilePic");
        if (img) img.src = profilePic;
      })
      .catch(err => {
        console.error("שגיאה בטעינת תמונת הפרופיל:", err);
      });
  } else {
    console.warn("לא נמצא משתמש מחובר");
  }
});
