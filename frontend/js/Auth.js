document.addEventListener("DOMContentLoaded", () => {
  // ---------------- LOGIN ----------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      if (!username || !password) {
        alert("אנא מלא את כל השדות");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // שמירת נתוני התחברות
          localStorage.setItem("token", data.token);
          localStorage.setItem("loggedInUser", data.user.username);
          localStorage.setItem("profilePic", data.user.profilePic || "/assets/Photos/defaultprfl.png");

          alert("התחברת בהצלחה!");
          window.location.href = "feed.html";
        } else {
          alert(data.error || "שגיאת התחברות");
        }
      } catch (err) {
        console.error("❌ login error:", err);
        alert("שגיאת שרת. נסה שוב מאוחר יותר.");
      }
    });
  }

  // ---------------- REGISTER ----------------
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!username || !password) {
        alert("שם משתמש וסיסמה הם חובה");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, fullName, email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          alert("נרשמת בהצלחה! התחבר כעת");
          window.location.href = "login.html";
        } else {
          alert(data.error || "שגיאת הרשמה");
        }
      } catch (err) {
        console.error("❌ register error:", err);
        alert("שגיאת שרת. נסה שוב מאוחר יותר.");
      }
    });
  }
});
