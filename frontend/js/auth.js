// InternshipX Authentication
// Crafted by ByteForge

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", registerUser);

}

async function registerUser(e) {

    e.preventDefault();

    const button = document.getElementById("registerBtn");
    const message = document.getElementById("message");

    message.innerHTML = "";

    button.disabled = true;
    button.innerText = "Creating Account...";

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const role = document.getElementById("role").value;
    const college = document.getElementById("college") ? document.getElementById("college").value.trim() : "";
    const industry = document.getElementById("industry") ? document.getElementById("industry").value.trim() : "";
    const location = document.getElementById("location") ? document.getElementById("location").value.trim() : "";

    // Validation

    if (name.length < 3) {

        message.style.color = "#EF4444";
        message.innerHTML = "Name must contain at least 3 characters.";

        button.disabled = false;
        button.innerText = "Create Account";

        return;
    }

    if (password.length < 8) {

        message.style.color = "#EF4444";
        message.innerHTML = "Password must be at least 8 characters.";

        button.disabled = false;
        button.innerText = "Create Account";

        return;
    }

    try {

        const response = await apiRequest(
            "/auth/register",
            "POST",
            {
                name,
                email,
                password,
                role,
                college: role === "student" ? college : "",
                industry: role === "company" ? industry : "",
                location: role === "company" ? location : ""
            }
        );

        message.style.color = "#22C55E";

        message.innerHTML = response.message;

        // Save email for OTP page

        sessionStorage.setItem("verifyEmail", email);

        setTimeout(() => {

            window.location.href = "verify-otp.html";

        }, 1200);

    }

    catch (error) {

        message.style.color = "#EF4444";

        message.innerHTML = error.message;

    }

    finally {

        button.disabled = false;

        button.innerText = "Create Account";

    }

}

const emailInput = document.getElementById("email");

if (emailInput) {

    const savedEmail = sessionStorage.getItem("verifyEmail");

    if (savedEmail) {
        emailInput.value = savedEmail;
    }

}
/* =========================================
   VERIFY OTP
========================================= */

const verifyForm = document.getElementById("verifyForm");

if (verifyForm) {

    const savedEmail = sessionStorage.getItem("verifyEmail");

    if (savedEmail) {
        document.getElementById("email").value = savedEmail;
    }

    verifyForm.addEventListener("submit", verifyOTP);

}

async function verifyOTP(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const otp = document.getElementById("otp").value.trim();

    const message = document.getElementById("message");

    message.innerHTML = "";

    try {

        const response = await apiRequest(
            "/auth/verify-otp",
            "POST",
            {
                email,
                otp
            }
        );

        message.style.color = "#22C55E";
        message.innerHTML = response.message;

        sessionStorage.removeItem("verifyEmail");

        setTimeout(() => {

            window.location.href = "login.html";

        },1500);

    }

    catch(error){

        message.style.color="#EF4444";
        message.innerHTML=error.message;

    }

}
/* =========================================
   RESEND OTP
========================================= */

const resendBtn = document.getElementById("resendBtn");

if(resendBtn){

    resendBtn.addEventListener("click", resendOTP);

}

async function resendOTP(){

    const email=document.getElementById("email").value.trim();

    if(!email){

        alert("Enter your email first.");

        return;

    }

    try{

        const response=await apiRequest(
            "/auth/resend-otp",
            "POST",
            {
                email
            }
        );

        alert(response.message);

    }

    catch(error){

        alert(error.message);

    }

}
/* =========================================
   LOGIN
========================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", loginUser);

}

async function loginUser(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("message");

    try {

        const response = await apiRequest(
            "/auth/login",
            "POST",
            {
                email,
                password
            }
        );

        sessionStorage.setItem("token", response.token);
        sessionStorage.setItem("user", JSON.stringify(response.user));

        message.style.color = "#22C55E";
        message.innerHTML = response.message;

        setTimeout(() => {

            if (response.user.role === "student") {

                window.location.href = "student-dashboard.html";

            } else {

                window.location.href = "company-dashboard.html";

            }

        },1000);

    }
    catch(error){

        message.style.color="#EF4444";
        message.innerHTML=error.message;

    }

}

/* =========================================
   FORGOT PASSWORD
========================================= */

const forgotPasswordForm = document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener("submit", sendResetCode);

}

async function sendResetCode(e) {

    e.preventDefault();

    const button = document.getElementById("sendCodeBtn");
    const message = document.getElementById("message");
    const email = document.getElementById("email").value.trim();

    message.innerHTML = "";

    if (!email) {
        message.style.color = "#EF4444";
        message.innerHTML = "Please enter your email.";
        return;
    }

    button.disabled = true;
    button.innerText = "Sending...";

    try {

        const response = await apiRequest(
            "/auth/forgot-password",
            "POST",
            { email }
        );

        message.style.color = "#22C55E";
        message.innerHTML = response.message;

        // Save email and show step 2
        sessionStorage.setItem("resetEmail", email);

        setTimeout(() => {
            showResetForm(email);
        }, 800);

    } catch (error) {

        message.style.color = "#EF4444";
        message.innerHTML = error.message;

    } finally {

        button.disabled = false;
        button.innerText = "Send Reset Code";

    }

}

function showResetForm(email) {

    const step1 = document.getElementById("forgotPasswordForm");
    const step2 = document.getElementById("verifyResetOtpForm");
    const title = document.getElementById("fpTitle");
    const subtitle = document.getElementById("fpSubtitle");

    if (step1) step1.style.display = "none";
    if (step2) step2.style.display = "block";

    if (title) title.textContent = "Reset Password";
    if (subtitle) subtitle.textContent = "Enter the code sent to your email and set a new password.";

    const resetEmailInput = document.getElementById("resetEmail");
    if (resetEmailInput) resetEmailInput.value = email;

}

/* =========================================
   RESET PASSWORD (Step 2)
========================================= */

const verifyResetOtpForm = document.getElementById("verifyResetOtpForm");

if (verifyResetOtpForm) {

    verifyResetOtpForm.addEventListener("submit", resetPassword);

    // If page reloaded and email is stored, show step 2
    const savedResetEmail = sessionStorage.getItem("resetEmail");

    if (savedResetEmail) {
        showResetForm(savedResetEmail);
    }

}

async function resetPassword(e) {

    e.preventDefault();

    const button = document.getElementById("resetPasswordBtn");
    const message = document.getElementById("resetMessage");

    const email = document.getElementById("resetEmail").value.trim();
    const otp = document.getElementById("resetOtp").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    message.innerHTML = "";

    // Client-side validation
    if (!otp || otp.length !== 6) {
        message.style.color = "#EF4444";
        message.innerHTML = "Please enter a valid 6-digit code.";
        return;
    }

    if (newPassword.length < 8) {
        message.style.color = "#EF4444";
        message.innerHTML = "Password must be at least 8 characters.";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.style.color = "#EF4444";
        message.innerHTML = "Passwords do not match.";
        return;
    }

    button.disabled = true;
    button.innerText = "Resetting...";

    try {

        const response = await apiRequest(
            "/auth/reset-password",
            "POST",
            {
                email,
                otp,
                newPassword
            }
        );

        message.style.color = "#22C55E";
        message.innerHTML = response.message;

        sessionStorage.removeItem("resetEmail");

        setTimeout(() => {

            window.location.href = "login.html";

        }, 1500);

    } catch (error) {

        message.style.color = "#EF4444";
        message.innerHTML = error.message;

    } finally {

        button.disabled = false;
        button.innerText = "Reset Password";

    }

}

/* =========================================
   RESEND RESET CODE
========================================= */

const resendResetBtn = document.getElementById("resendResetBtn");

if (resendResetBtn) {

    resendResetBtn.addEventListener("click", resendResetCode);

}

async function resendResetCode() {

    const email = document.getElementById("resetEmail").value.trim();
    const message = document.getElementById("resetMessage");

    if (!email) {
        message.style.color = "#EF4444";
        message.innerHTML = "Email is missing. Please go back and try again.";
        return;
    }

    try {

        const response = await apiRequest(
            "/auth/forgot-password",
            "POST",
            { email }
        );

        message.style.color = "#22C55E";
        message.innerHTML = "A new reset code has been sent.";

    } catch (error) {

        message.style.color = "#EF4444";
        message.innerHTML = error.message;

    }

}