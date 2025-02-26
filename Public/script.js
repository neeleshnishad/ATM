let currentPin = null;

function showSetPinForm() {
    document.getElementById("initial-screen").classList.add("hidden");
    document.getElementById("set-pin-form").classList.remove("hidden");
    startCardAnimation();
}

function showLoginForm() {
    document.getElementById("initial-screen").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
    startCardAnimation();
}

async function setPin() {
    const name = document.getElementById("name-input").value;
    const pin = document.getElementById("new-pin-input").value;
    const photo = document.getElementById("photo-input").files[0];
    const docs = document.getElementById("doc-input").files;

    if (pin.length === 4 && name) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("pin", pin);
        if (photo) formData.append("photo", photo);
        if (docs.length > 0) Array.from(docs).forEach(doc => formData.append("documents", doc));

        try {
            const response = await fetch("http://localhost:3000/set-pin", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                alert("PIN set successfully! Please login.");
                document.getElementById("set-pin-form").classList.add("hidden");
                document.getElementById("login-form").classList.remove("hidden");
                document.getElementById("name-input").value = "";
                document.getElementById("new-pin-input").value = "";
                document.getElementById("photo-input").value = "";
                document.getElementById("doc-input").value = "";
            } else {
                alert("This PIN is already taken! Try another.");
            }
        } catch (error) {
            console.error("Error setting PIN:", error);
            alert("Something went wrong!");
        }
    } else {
        alert("Please enter a valid 4-digit PIN and your name!");
    }
}

async function validatePin() {
    const pinInput = document.getElementById("pin-input").value;

    if (pinInput.length === 4) {
        try {
            const response = await fetch(`http://localhost:3000/validate-pin?pin=${pinInput}`);
            const result = await response.json();

            if (result.success) {
                currentPin = pinInput;
                document.getElementById("user-name").innerText = result.name;
                document.getElementById("user-photo").src = result.photo || "https://via.placeholder.com/50";
                document.getElementById("avatar-img").src = result.photo || "https://via.placeholder.com/50";
                document.getElementById("login-form").classList.add("hidden");
                document.getElementById("atm-options").classList.remove("hidden");
                stopCardAnimation();
                showAvatar();
            } else {
                alert("Invalid PIN! Please enter a valid 4-digit PIN.");
            }
        } catch (error) {
            console.error("Error validating PIN:", error);
            alert("Something went wrong!");
        }
    } else {
        alert("Please enter a valid 4-digit PIN!");
    }
}

async function checkBalance() {
    try {
        const response = await fetch(`http://localhost:3000/check-balance?pin=${currentPin}`);
        const result = await response.json();

        if (result.success) {
            document.getElementById("balance-display").innerText = `Current Balance: ₹${result.balance}`;
            hideTransactionSection();
            triggerAvatarAction("👉");
        } else {
            alert("Error fetching balance!");
        }
    } catch (error) {
        console.error("Error checking balance:", error);
        alert("Something went wrong!");
    }
}

function showDeposit() {
    document.getElementById("transaction-section").classList.remove("hidden");
    document.getElementById("confirm-btn").onclick = () => deposit();
    document.getElementById("amount-input").value = "";
}

function showWithdraw() {
    document.getElementById("transaction-section").classList.remove("hidden");
    document.getElementById("confirm-btn").onclick = () => withdraw();
    document.getElementById("amount-input").value = "";
}

async function deposit() {
    const amount = parseInt(document.getElementById("amount-input").value);

    if (amount > 0) {
        try {
            const response = await fetch("http://localhost:3000/update-balance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: currentPin, amount, isDeposit: true }),
            });
            const result = await response.json();

            if (result.success) {
                document.getElementById("balance-display").innerText = `New Balance: ₹${result.newBalance}`;
                hideTransactionSection();
                triggerAvatarAction("👍");
            } else {
                alert("Error depositing amount!");
            }
        } catch (error) {
            console.error("Error depositing:", error);
            alert("Something went wrong!");
        }
    } else {
        alert("Please enter a valid amount!");
    }
}

async function withdraw() {
    const amount = parseInt(document.getElementById("amount-input").value);

    if (amount > 0) {
        try {
            const response = await fetch("http://localhost:3000/update-balance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: currentPin, amount, isDeposit: false }),
            });
            const result = await response.json();

            if (result.success) {
                document.getElementById("balance-display").innerText = `New Balance: ₹${result.newBalance}`;
                hideTransactionSection();
                triggerAvatarAction("👍");
            } else {
                alert(result.message || "Insufficient balance!");
            }
        } catch (error) {
            console.error("Error withdrawing:", error);
            alert("Something went wrong!");
        }
    } else {
        alert("Please enter a valid amount!");
    }
}

function hideTransactionSection() {
    document.getElementById("transaction-section").classList.add("hidden");
}

function logout() {
    currentPin = null;
    document.getElementById("atm-options").classList.add("hidden");
    document.getElementById("initial-screen").classList.remove("hidden");
    document.getElementById("balance-display").innerText = "";
    document.getElementById("pin-input").value = "";
    document.getElementById("user-name").innerText = "";
    document.getElementById("user-photo").src = "";
    document.getElementById("avatar").classList.remove("show");
    startCardAnimation();
}

// Animation Control Functions
function startCardAnimation() {
    const card = document.getElementById("atm-card");
    card.classList.remove("paused");
}

function stopCardAnimation() {
    const card = document.getElementById("atm-card");
    card.classList.add("paused");
}

function showAvatar() {
    const avatar = document.getElementById("avatar");
    avatar.classList.add("show");
}

function triggerAvatarAction(action) {
    const avatarAction = document.getElementById("avatar-action");
    avatarAction.innerText = action;
    avatarAction.style.animation = "thumbsUp3D 1s ease-in-out";
    setTimeout(() => {
        avatarAction.style.animation = "";
        avatarAction.innerText = "";
    }, 1000);
}

// Event Listeners for Interaction
document.getElementById("set-pin-form").addEventListener("click", stopCardAnimation);
document.getElementById("set-pin-form").addEventListener("mouseover", stopCardAnimation);
document.getElementById("set-pin-form").addEventListener("input", stopCardAnimation);
document.getElementById("login-form").addEventListener("click", stopCardAnimation);
document.getElementById("login-form").addEventListener("mouseover", stopCardAnimation);
document.getElementById("login-form").addEventListener("input", stopCardAnimation);