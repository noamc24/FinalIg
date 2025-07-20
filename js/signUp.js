
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/;

  let errors = [];

  if (!emailRegex.test(email)) {
    errors.push("אימייל לא תקין");
  }
  if (fullName.length < 2) {
    errors.push("שם מלא חייב להכיל לפחות 2 תווים");
  }
  if (!usernameRegex.test(username)) {
    errors.push("שם משתמש חייב להכיל לפחות 3 תווים (אותיות, מספרים, _, .)");
  }
  if (password.length < 8) {
    errors.push("הסיסמה חייבת להכיל לפחות 8 תווים");
  }

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  // אם הכל תקין – שולחים לשרת
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, fullName, username, password })
  });

  const result = await res.json();

  if (res.ok) {
    alert("נרשמת בהצלחה!");
    window.location.href = "login.html";
  } else {
    alert(result.error || "שגיאה בהרשמה");
  }
});
