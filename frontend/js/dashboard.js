// ==========================================
// InternshipX Dashboard
// ==========================================

const token = localStorage.getItem("token");
let editingInternshipId = null;
let allInternships = [];
let user = null;

try {
    user = JSON.parse(localStorage.getItem("user"));
} catch (error) {
    user = null;
}

const currentPage = window.location.pathname.toLowerCase();

if (!token || !user) {
    window.location.href = "login.html";
}

const companyName = document.getElementById("companyName");
const studentName = document.getElementById("studentName");
const profileBtn = document.getElementById("profileBtn");

updateHeaderNames();

if (profileBtn) {
    profileBtn.addEventListener("click", () => {
        window.location.href = getProfilePath();
    });
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("verifyEmail");

    window.location.href = "login.html";
}

const myApplicationsBtn = document.getElementById("myApplicationsBtn");

if (myApplicationsBtn) {
    myApplicationsBtn.addEventListener("click", () => {
        window.location.href = "my-applications.html";
    });
}

const modal = document.getElementById("internshipModal");
const openBtn = document.getElementById("openModalBtn");
const closeBtn = document.getElementById("closeModal");
const internshipForm = document.getElementById("internshipForm");
const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileName");
const profileEmailInput = document.getElementById("profileEmail");
const profileEmailOtpInput = document.getElementById("profileEmailOtp");
const emailVerifyPanel = document.getElementById("emailVerifyPanel");
const changeEmailBtn = document.getElementById("changeEmailBtn");
const sendEmailCodeBtn = document.getElementById("sendEmailCodeBtn");
const verifyEmailBtn = document.getElementById("verifyEmailBtn");
let isEditingProfileEmail = false;

if (openBtn && modal && internshipForm) {
    openBtn.addEventListener("click", () => {
        editingInternshipId = null;
        internshipForm.reset();
        modal.style.display = "flex";
    });
}

if (closeBtn && modal) {
    closeBtn.addEventListener("click", closeModal);
}

window.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

function closeModal() {
    if (modal) {
        modal.style.display = "none";
    }
}

if (internshipForm) {
    internshipForm.addEventListener("submit", saveInternship);
}

if (profileForm) {
    profileForm.addEventListener("submit", saveProfile);
}

if (profileEmailInput) {
    profileEmailInput.addEventListener("input", () => {
        clearProfileEmailOtp();
        syncEmailVerificationUI();
    });
}

if (profileEmailOtpInput) {
    profileEmailOtpInput.addEventListener("input", () => {
        profileEmailOtpInput.value = profileEmailOtpInput.value
            .replace(/\D/g, "")
            .slice(0, 6);
        syncEmailVerificationUI();
    });
}

if (changeEmailBtn) {
    changeEmailBtn.addEventListener("click", () => {
        setProfileEmailEditing(!isEditingProfileEmail);
    });
}

if (sendEmailCodeBtn) {
    sendEmailCodeBtn.addEventListener("click", requestProfileEmailVerification);
}

if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener("click", verifyProfileEmail);
}

async function saveInternship(event) {
    event.preventDefault();

    const internship = {
        title: document.getElementById("title").value.trim(),
        companyName: user.name,
        location: document.getElementById("location").value.trim(),
        duration: document.getElementById("duration").value.trim(),
        stipend: document.getElementById("stipend").value.trim(),
        skills: document
            .getElementById("skills")
            .value
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        description: document.getElementById("description").value.trim()
    };

    try {
        const response = editingInternshipId
            ? await apiRequest(`/internships/${editingInternshipId}`, "PUT", internship)
            : await apiRequest("/internships", "POST", internship);

        showToast(response.message);
        editingInternshipId = null;
        internshipForm.reset();
        closeModal();
        loadCompanyInternships();
    } catch (error) {
        showToast(error.message);
    }
}

if (currentPage.includes("company-dashboard")) {
    loadCompanyDashboard();
}

if (currentPage.includes("student-dashboard")) {
    loadStudentDashboard();
}

if (currentPage.includes("my-applications")) {
    loadMyApplications();
}

if (currentPage.includes("company-applications")) {
    loadCompanyApplications();
}

if (currentPage.includes("student-profile") || currentPage.includes("company-profile")) {
    loadProfilePage();
}

async function loadCompanyDashboard() {
    loadCompanyInternships();
    loadCompanyApplicationStats();
}

async function loadCompanyInternships() {
    try {
        const data = await apiRequest("/internships/company");
        window.companyInternships = data;
        renderCompanyInternships(data);
    } catch (error) {
        showToast(error.message);
    }
}

async function loadCompanyApplicationStats() {
    try {
        const response = await apiRequest("/applications/company");
        updateCompanyApplicationStats(response.applications || []);
    } catch (error) {
        console.log(error);
    }
}

function renderCompanyInternships(data) {
    const list = document.getElementById("internshipList");

    if (!list) return;

    updateText("totalInternships", data.length);

    if (data.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>No internships posted yet.</h3>
                <p>Post your first internship to start collecting applications.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = data
        .map((item) => `
            <div class="internship-card">
                <h3>${escapeHTML(item.title)}</h3>
                ${renderMeta([
                    item.location ? `Location: ${item.location}` : null,
                    item.duration ? `Duration: ${item.duration}` : null,
                    item.stipend ? `Stipend: ${item.stipend}` : null
                ])}
                ${renderSkills(item.skills)}
                <p class="card-description">${escapeHTML(item.description || "No description added yet.")}</p>

                <div class="card-actions">
                    <button
                        class="btn-secondary edit-btn"
                        data-id="${item._id}">
                        Edit
                    </button>

                    <button
                        class="btn-danger delete-btn"
                        data-id="${item._id}">
                        Delete
                    </button>
                </div>
            </div>
        `)
        .join("");
}

async function loadStudentDashboard() {
    try {
        const internships = await apiRequest("/internships");
        allInternships = internships;
        renderStudentInternships(allInternships);
    } catch (error) {
        showToast(error.message);
    }

    loadStudentApplicationStats();
}

async function loadStudentApplicationStats() {
    try {
        const data = await apiRequest("/applications/student");
        const applications = data.applications || [];
        const accepted = applications.filter((app) => app.status === "Accepted").length;

        updateText("myApplications", applications.length);
        updateText("acceptedApplications", accepted);
    } catch (error) {
        console.log(error);
    }
}

async function loadProfilePage() {
    const expectedRole = document.body.dataset.profileRole;

    if (expectedRole && user?.role !== expectedRole) {
        window.location.href = getProfilePath();
        return;
    }

    renderProfile(user);

    try {
        const response = await apiRequest("/profile");
        saveUserSession(response.user, response.token);
        renderProfile(response.user);
    } catch (error) {
        showProfileMessage(error.message, true);
        showToast(error.message);
    }
}

async function saveProfile(event) {
    event.preventDefault();

    const submitButton = profileForm.querySelector('button[type="submit"]');
    const profile = {
        name: profileNameInput.value.trim(),
        email: profileEmailInput.value.trim()
    };

    if (normalizeProfileEmail(profile.email) !== normalizeProfileEmail(user?.email)) {
        showProfileMessage("Verify the new email first.", true);
        syncEmailVerificationUI();
        return;
    }

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Saving...";
        }

        showProfileMessage("Saving profile...");

        const response = await apiRequest("/profile", "PUT", profile);

        saveUserSession(response.user, response.token);
        renderProfile(response.user);
        showProfileMessage(response.message);
        showToast(response.message);
    } catch (error) {
        showProfileMessage(error.message, true);
        showToast(error.message);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Save Profile";
        }
    }
}

function renderProfile(profileUser) {
    if (!profileUser) return;

    if (profileNameInput) {
        profileNameInput.value = profileUser.name || "";
    }

    if (profileEmailInput) {
        profileEmailInput.value = profileUser.pendingEmail || profileUser.email || "";
    }

    updateText("profileDisplayName", profileUser.name || "Profile");
    updateText("profileDisplayEmail", profileUser.email || "");
    updateText("profileRoleBadge", getRoleLabel(profileUser.role));
    updateText("profileInitials", getInitials(profileUser.name));
    setProfileEmailEditing(Boolean(profileUser.pendingEmail), {
        keepFocus: true,
        keepValue: true
    });
}

function saveUserSession(nextUser, nextToken) {
    if (nextToken) {
        localStorage.setItem("token", nextToken);
    }

    if (nextUser) {
        user = {
            ...user,
            ...nextUser
        };

        localStorage.setItem("user", JSON.stringify(user));
        updateHeaderNames();
    }
}

async function requestProfileEmailVerification() {
    if (!profileEmailInput.checkValidity()) {
        profileEmailInput.reportValidity();
        return;
    }

    const email = profileEmailInput.value.trim();

    if (normalizeProfileEmail(email) === normalizeProfileEmail(user?.email)) {
        showProfileMessage("This email is already verified.", false);
        syncEmailVerificationUI();
        return;
    }

    try {
        sendEmailCodeBtn.disabled = true;
        sendEmailCodeBtn.textContent = "Sending...";
        showProfileMessage("Sending verification code...");

        const response = await apiRequest(
            "/profile/email-verification",
            "POST",
            { email }
        );

        user = {
            ...user,
            pendingEmail: response.pendingEmail
        };
        localStorage.setItem("user", JSON.stringify(user));

        if (profileEmailOtpInput) {
            profileEmailOtpInput.value = "";
            profileEmailOtpInput.focus();
        }

        showProfileMessage(response.message);
        showToast(response.message);
    } catch (error) {
        showProfileMessage(error.message, true);
        showToast(error.message);
    } finally {
        sendEmailCodeBtn.disabled = false;
        syncEmailVerificationUI();
    }
}

async function verifyProfileEmail() {
    if (!profileNameInput.checkValidity()) {
        profileNameInput.reportValidity();
        return;
    }

    if (!profileEmailInput.checkValidity()) {
        profileEmailInput.reportValidity();
        return;
    }

    const email = profileEmailInput.value.trim();
    const otp = profileEmailOtpInput.value.trim().replace(/\D/g, "");

    if (otp.length !== 6) {
        showProfileMessage("Enter the 6-digit verification code.", true);
        profileEmailOtpInput.focus();
        return;
    }

    try {
        verifyEmailBtn.disabled = true;
        verifyEmailBtn.textContent = "Verifying...";
        showProfileMessage("Verifying email...");

        const response = await apiRequest(
            "/profile/verify-email",
            "POST",
            {
                email,
                otp,
                name: profileNameInput.value.trim()
            }
        );

        saveUserSession(response.user, response.token);
        renderProfile(response.user);

        if (profileEmailOtpInput) {
            profileEmailOtpInput.value = "";
        }

        showProfileMessage(response.message);
        showToast(response.message);
    } catch (error) {
        showProfileMessage(error.message, true);
        showToast(error.message);
    } finally {
        verifyEmailBtn.disabled = false;
        verifyEmailBtn.textContent = "Verify Email";
        syncEmailVerificationUI();
    }
}

function renderStudentInternships(data) {
    const list = document.getElementById("internshipList");

    if (!list) return;

    updateText("availableInternships", data.length);

    if (data.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>No internships available.</h3>
                <p>Try a different search or check again later.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = data
        .map((item) => `
            <div class="internship-card">
                <h3>${escapeHTML(item.title)}</h3>
                <p><strong>Company:</strong> ${escapeHTML(item.companyName || "N/A")}</p>
                ${renderMeta([
                    item.location ? `Location: ${item.location}` : null,
                    item.duration ? `Duration: ${item.duration}` : null,
                    item.stipend ? `Stipend: ${item.stipend}` : null
                ])}
                ${renderSkills(item.skills)}
                <p class="card-description">${escapeHTML(item.description || "No description added yet.")}</p>

                <div class="card-actions">
                    <button
                        class="btn-primary apply-btn"
                        data-id="${item._id}">
                        Apply Now
                    </button>
                </div>
            </div>
        `)
        .join("");
}

document.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("apply-btn")) return;

    const internshipId = event.target.dataset.id;

    try {
        const response = await apiRequest(`/applications/${internshipId}`, "POST");

        showToast(response.message);
        event.target.innerText = "Applied";
        event.target.disabled = true;
        loadStudentApplicationStats();
    } catch (error) {
        showToast(error.message);
    }
});

async function loadMyApplications() {
    try {
        const data = await apiRequest("/applications/student");
        renderApplications(data.applications || []);
    } catch (error) {
        showToast(error.message);
    }
}

function renderApplications(applications) {
    const list = document.getElementById("applicationList");

    if (!list) return;

    if (applications.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>You have not applied anywhere yet.</h3>
                <p>Browse open internships and apply when a role fits.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = applications
        .map((app) => {
            const internship = app.internship || {};

            return `
                <div class="internship-card">
                    <h3>${escapeHTML(internship.title || "Internship")}</h3>
                    <p><strong>Company:</strong> ${escapeHTML(internship.companyName || "N/A")}</p>
                    ${renderMeta([
                        internship.location ? `Location: ${internship.location}` : null,
                        internship.duration ? `Duration: ${internship.duration}` : null,
                        internship.stipend ? `Stipend: ${internship.stipend}` : null
                    ])}
                    <p>Status: ${renderStatus(app.status)}</p>
                </div>
            `;
        })
        .join("");
}

async function loadCompanyApplications() {
    try {
        const response = await apiRequest("/applications/company");
        renderCompanyApplications(response.applications || []);
    } catch (error) {
        showToast(error.message);
    }
}

function renderCompanyApplications(applications) {
    const list = document.getElementById("applicationList");

    if (!list) return;

    updateCompanyApplicationStats(applications);

    if (applications.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>No applications received.</h3>
                <p>Applications will appear here once students apply.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = applications
        .map((app) => `
            <div class="internship-card">
                <h3>${escapeHTML(app.student?.name || "Student")}</h3>
                <p>${escapeHTML(app.student?.email || "No email available")}</p>
                <p><strong>${escapeHTML(app.internship?.title || "Internship")}</strong></p>
                <p>Status: ${renderStatus(app.status)}</p>

                <div class="card-actions">
                    <button
                        class="btn-primary accept-btn"
                        data-id="${app._id}">
                        Accept
                    </button>

                    <button
                        class="btn-secondary reject-btn"
                        data-id="${app._id}">
                        Reject
                    </button>
                </div>
            </div>
        `)
        .join("");
}

function updateCompanyApplicationStats(applications) {
    const pending = applications.filter((app) => app.status === "Pending").length;
    const accepted = applications.filter((app) => app.status === "Accepted").length;

    updateText("totalApplications", applications.length);
    updateText("pendingApplications", pending);
    updateText("acceptedApplications", accepted);
}

document.addEventListener("click", (event) => {
    if (event.target.classList.contains("accept-btn")) {
        updateStatus(event.target.dataset.id, "Accepted");
    }

    if (event.target.classList.contains("reject-btn")) {
        updateStatus(event.target.dataset.id, "Rejected");
    }
});

async function updateStatus(id, status) {
    try {
        const response = await apiRequest(
            `/applications/${id}/status`,
            "PATCH",
            { status }
        );

        showToast(response.message);
        loadCompanyApplications();
    } catch (error) {
        showToast(error.message);
    }
}

document.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("delete-btn")) return;

    if (!confirm("Delete this internship?")) return;

    try {
        const response = await apiRequest(
            `/internships/${event.target.dataset.id}`,
            "DELETE"
        );

        showToast(response.message);
        loadCompanyInternships();
    } catch (error) {
        showToast(error.message);
    }
});

document.addEventListener("click", (event) => {
    if (!event.target.classList.contains("edit-btn")) return;

    editingInternshipId = event.target.dataset.id;

    const internship = window.companyInternships.find(
        (item) => item._id === editingInternshipId
    );

    if (!internship) return;

    document.getElementById("title").value = internship.title || "";
    document.getElementById("location").value = internship.location || "";
    document.getElementById("duration").value = internship.duration || "";
    document.getElementById("stipend").value = internship.stipend || "";
    document.getElementById("skills").value = normalizeSkills(internship.skills).join(", ");
    document.getElementById("description").value = internship.description || "";

    if (modal) {
        modal.style.display = "flex";
    }
});

const searchInput = document.getElementById("searchInput");

if (searchInput) {
    searchInput.addEventListener("input", searchInternships);
}

function searchInternships() {
    const keyword = document.getElementById("searchInput").value.toLowerCase();

    const filtered = allInternships.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const company = (item.companyName || "").toLowerCase();
        const location = (item.location || "").toLowerCase();
        const skills = normalizeSkills(item.skills).join(" ").toLowerCase();

        return (
            title.includes(keyword) ||
            company.includes(keyword) ||
            location.includes(keyword) ||
            skills.includes(keyword)
        );
    });

    renderStudentInternships(filtered);
}

function updateHeaderNames() {
    const displayName = user?.name || "User";

    if (companyName) {
        companyName.textContent = `Welcome, ${displayName}`;
    }

    if (studentName) {
        studentName.textContent = `Welcome, ${displayName}`;
    }
}

function getProfilePath() {
    if (user?.role === "company") {
        return "company-profile.html";
    }

    if (user?.role === "student") {
        return "student-profile.html";
    }

    return "login.html";
}

function getInitials(name = "") {
    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return initials || "IX";
}

function getRoleLabel(role = "") {
    if (!role) return "Profile";

    return role.charAt(0).toUpperCase() + role.slice(1);
}

function showProfileMessage(message, isError = false) {
    const profileMessage = document.getElementById("profileMessage");

    if (!profileMessage) return;

    profileMessage.textContent = message;
    profileMessage.className = isError
        ? "profile-message error"
        : "profile-message success";
}

function setProfileEmailEditing(isEditing, options = {}) {
    if (!profileEmailInput) return;

    isEditingProfileEmail = isEditing;
    profileEmailInput.readOnly = !isEditingProfileEmail;

    if (isEditingProfileEmail && !options.keepValue) {
        clearProfileEmailOtp();
    }

    if (!isEditingProfileEmail && !options.keepValue) {
        profileEmailInput.value = user?.email || "";
        user = {
            ...user,
            pendingEmail: ""
        };
        localStorage.setItem("user", JSON.stringify(user));
        clearProfileEmailOtp();
    }

    if (changeEmailBtn) {
        changeEmailBtn.textContent = isEditingProfileEmail ? "Cancel" : "Change Email";
    }

    if (isEditingProfileEmail && !options.keepFocus) {
        setTimeout(() => {
            profileEmailInput.focus();
            profileEmailInput.select();
        }, 0);
    }

    syncEmailVerificationUI();
}

function clearProfileEmailOtp() {
    if (profileEmailOtpInput) {
        profileEmailOtpInput.value = "";
    }
}

function syncEmailVerificationUI() {
    if (!emailVerifyPanel || !profileEmailInput || !sendEmailCodeBtn || !verifyEmailBtn) return;

    const typedEmail = normalizeProfileEmail(profileEmailInput.value);
    const currentEmail = normalizeProfileEmail(user?.email);
    const pendingEmail = normalizeProfileEmail(user?.pendingEmail);
    const isChangingEmail = Boolean(typedEmail) && typedEmail !== currentEmail;
    const canRequestCode = isEditingProfileEmail && isChangingEmail && profileEmailInput.checkValidity();
    const codeReady = !profileEmailOtpInput ||
        profileEmailOtpInput.value.trim().replace(/\D/g, "").length === 6;

    emailVerifyPanel.classList.toggle("active", isEditingProfileEmail);
    sendEmailCodeBtn.disabled = !canRequestCode;
    verifyEmailBtn.disabled = !isEditingProfileEmail || !isChangingEmail || !codeReady;
    sendEmailCodeBtn.textContent = pendingEmail && pendingEmail === typedEmail
        ? "Resend Verification Code"
        : "Send Verification Code";
}

function normalizeProfileEmail(email = "") {
    return email.trim().toLowerCase();
}

function renderMeta(items) {
    const meta = items
        .filter(Boolean)
        .map((item) => `<span class="meta-pill">${escapeHTML(item)}</span>`)
        .join("");

    return meta ? `<div class="internship-meta">${meta}</div>` : "";
}

function renderSkills(skills) {
    const skillItems = normalizeSkills(skills);

    if (skillItems.length === 0) return "";

    return `
        <div class="skill-list">
            <strong>Skills:</strong>
            ${skillItems
                .map((skill) => `<span class="skill-pill">${escapeHTML(skill)}</span>`)
                .join("")}
        </div>
    `;
}

function normalizeSkills(skills) {
    if (Array.isArray(skills)) {
        return skills.filter(Boolean);
    }

    if (typeof skills === "string") {
        return skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);
    }

    return [];
}

function renderStatus(status = "Pending") {
    const normalized = status.toLowerCase();
    const className = normalized === "accepted"
        ? "accepted"
        : normalized === "rejected"
            ? "rejected"
            : "";

    return `<span class="status-badge ${className}">${escapeHTML(status)}</span>`;
}

function updateText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(message) {
    const toast = document.createElement("div");

    toast.className = "toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
