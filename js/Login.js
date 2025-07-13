document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");
    const inputField = document.getElementById("email");
    const passwordField = document.getElementById("password");
    const errorMsg = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const togglePassword = document.getElementById("togglePassword");

    function updateLoginButtonState() {
        const inputValue = inputField.value.trim();
        const passwordValue = passwordField.value.trim();
        const allFieldsFilled = inputValue !== "" && passwordValue !== "";

        if (!allFieldsFilled && !isValidInput(inputValue))
            loginBtn.disabled = true;
        else 
        loginBtn.disabled=false;

    
        if (allFieldsFilled && isValidInput(inputValue))
            {
                loginBtn.style.opacity = 1
            }
            else
            loginBtn.style.opacity = 0.7
    }

    inputField.addEventListener("input", updateLoginButtonState);
    passwordField.addEventListener("input", updateLoginButtonState);

    function isValidInput(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/;
        const phoneRegex = /^05\d{8}$/;
        return (
            emailRegex.test(value) ||
            usernameRegex.test(value) ||
            phoneRegex.test(value)
        );
    }

    loginBtn.addEventListener("click", function (e) {
        e.preventDefault();

        const inputValue = inputField.value.trim();
        const passwordValue = passwordField.value.trim();

        let formValid = true;

        if (!isValidInput(inputValue)) {
            errorMsg.style.display = "block";
            inputField.classList.add("is-invalid");
            formValid = false;
        } else {
            errorMsg.style.display = "none";
            inputField.classList.remove("is-invalid");
        }

        if (passwordValue === "") {
            passwordError.style.display = "block";
            passwordField.classList.add("is-invalid");
            formValid = false;
        } else {
            passwordError.style.display = "none";
            passwordField.classList.remove("is-invalid");
        }

        if (formValid) {
        fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: inputValue,
            password: passwordValue
            })
        })
            .then((res) => res.json())
            .then((result) => {
            if (result.message) {// התחברות הצליחה

                window.location.href = "feed.html";
            } else {// שגיאת התחברות
                alert(result.error || "שגיאה בהתחברות");
            }
            })
            .catch((err) => {
            alert("שגיאת שרת. נסה שוב מאוחר יותר.");
            console.error(err);
            });
        }

    });

    togglePassword.addEventListener("click", function () {
        const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
        passwordField.setAttribute("type", type);

        this.classList.toggle("bx-show");
        this.classList.toggle("bx-hide");
    });
});

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const isPhone = /^[0-9]{10}$/.test(username);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);

    if ((isPhone || isEmail) && password.length >= 8) {
    } else {
      let msg = "";
      if (!isPhone && !isEmail) {
        msg += "הכנס מספר טלפון תקני או כתובת מייל תקינה.\n";
      }
      if (password.length < 8) {
        msg += "הסיסמה חייבת להכיל לפחות 8 תווים.";
      }
      alert(msg);
    }
  });
});
