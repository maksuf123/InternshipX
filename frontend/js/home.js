const featuredList = document.getElementById("featuredInternshipList");
const featuredCount = document.getElementById("featuredInternshipCount");

if (featuredList && featuredCount) {
    loadFeaturedInternships();
}

async function loadFeaturedInternships() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
        const response = await fetch(
            `${CONFIG.API_URL}/internships/public/latest`,
            { signal: controller.signal }
        );

        if (!response.ok) {
            throw new Error("Unable to load internships.");
        }

        const internships = await response.json();

        featuredCount.textContent = internships.length;
        renderFeaturedInternships(internships);
    } catch (error) {
        featuredCount.textContent = "0";
        featuredList.innerHTML = `
            <div class="preview-empty">
                <h4>Live internships unavailable</h4>
                <p>Start the backend server to show current internship listings here.</p>
            </div>
        `;
    } finally {
        clearTimeout(timeoutId);
    }
}

function renderFeaturedInternships(internships) {
    if (internships.length === 0) {
        featuredList.innerHTML = `
            <div class="preview-empty">
                <h4>No internships posted yet</h4>
                <p>Company-posted internships will appear here automatically.</p>
            </div>
        `;
        return;
    }

    featuredList.innerHTML = internships
        .map((internship) => `
            <article class="preview-card">
                <h4>${escapeHTML(internship.title)}</h4>
                <p>
                    ${escapeHTML(internship.companyName)}
                    ${renderInlineMeta(internship.location)}
                    ${renderInlineMeta(internship.duration)}
                </p>
                ${renderPreviewTags(internship.skills)}
            </article>
        `)
        .join("");
}

function renderInlineMeta(value) {
    return value ? ` - ${escapeHTML(value)}` : "";
}

function renderPreviewTags(skills) {
    if (!Array.isArray(skills) || skills.length === 0) return "";

    return `
        <div class="preview-tags">
            ${skills
                .slice(0, 4)
                .map((skill) => `<span>${escapeHTML(skill)}</span>`)
                .join("")}
        </div>
    `;
}

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
