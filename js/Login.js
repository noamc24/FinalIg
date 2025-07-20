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

      const result = await res.json();

      if (res.ok) {
        localStorage.setItem("loggedInUser", username);
        alert("התחברת בהצלחה!");
        window.location.href = "feed.html";

      } else {
        alert(result.error || "שגיאת התחברות");
      }

    } catch (err) {
      alert("שגיאת שרת. נסה שוב מאוחר יותר.");
      console.error(err);
    }
  });
});
