const scanForm = document.getElementById("scan-form");
const websiteInput = document.getElementById("website-url");
const statusMessage = document.getElementById("status");

scanForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const websiteURL = websiteInput.value.trim();

    // Check whether the entered URL is valid
    try {
        const parsedURL = new URL(websiteURL);

        if (
            parsedURL.protocol !== "http:" &&
            parsedURL.protocol !== "https:"
        ) {
            throw new Error("Invalid protocol");
        }
    } catch {
        statusMessage.textContent =
            "Please enter a valid website URL, such as https://example.com";
        return;
    }

    // The backend is not connected yet
    statusMessage.textContent =
        "URL accepted! Your frontend is ready. " +
        "Actual accessibility scanning will be enabled " +
        "when we connect the FastAPI backend.";
});
