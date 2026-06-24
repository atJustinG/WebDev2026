let currentUser = null;
let currentLocation = null;
let map = null;
let markers = [];
let markerMap = {};

console.log("app.js load");

function showError(message) {

    const errorBox =
        document.getElementById("login-error");

    errorBox.textContent = message;
}

async function login(username, password) {

    try {

        const response = await fetch("/login", {
            method: "POST",

            headers: {"Content-Type":"application/json"},

            body: JSON.stringify({username, password})
        });

        const data = await response.json();

        if (!response.ok) {

            showError(data.message || "Login fehlgeschlagen" );
            return null;
        }

        return data;

    } catch (err) {

        console.error(err);

        showError("Server nicht erreichbar");
        return null;
    }
}

function logout() {
    currentUser = null;

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("login-error").textContent = "";

    showScreen("login-screen");
}

async function loadLocations() {

    try {
        const response = await fetch("/loc");
        const locations = await response.json();

        renderLocations(locations);

        if(map){
            renderMarkers(locations);
        }

    } catch(err) {
        console.error("Fehler beim Laden", err );
    }
}

function renderLocations(locations) {

    const container = document.getElementById("locations-container");

    container.innerHTML = "";

    locations.forEach(location => {

        const div = document.createElement("div");

        div.classList.add("location-card");

        div.innerHTML = `
            <h3>${location.name}</h3>

            <p>
                ${location.street}
            </p>

            <p>
                ${location.zip}
                ${location.city}
            </p>

            <p>
                ${location.category}
            </p>
        `;
        div.addEventListener("mouseenter", () => {
            highlightMarker(location._id);
        });

        div.addEventListener("mouseleave", () => {
            const marker = markerMap[location._id];

            if(marker){
                marker.closePopup();
            }
        });

        div.addEventListener("click", () => {
            openDetails(location._id);});

        container.appendChild(div);
    });
}

async function openDetails(id) {

    try {

        const response = await fetch(`/loc/${id}`);
        const location = await response.json();

        currentLocation = location;
        renderDetails(location);
        showScreen("detail-screen");

    } catch(err) {
        console.error(err);
    }

}

async function updateLocation() {
    try {
        const street = document.getElementById("detail-street").value;
        const zip = document.getElementById("detail-zip").value;
        const city = document.getElementById("detail-city").value;
        const coordinates = await getCoordinatesFromAddress(street, zip, city);

        if (!coordinates) {
            alert("Adresse konnte nicht gefunden werden.");
        return;
    }

        const responseLocation = await fetch(`/loc/${currentLocation._id}`);
        const latestLocation = await responseLocation.json();
        const updatedLocation = {

            name:
                document.getElementById(
                    "detail-name"
                ).value,

            description:
                document.getElementById(
                    "detail-description"
                ).value,

            street: street,

            zip: zip,

            city: city, 

            category:
                document.getElementById(
                    "detail-category"
                ).value,

            lat:
                coordinates.lat,

            lng:
                coordinates.lng,

            imageUrl:
                latestLocation.imageUrl

        };

        const response = await fetch(`/loc/${currentLocation._id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                        "application/json"
                    },

                    body: JSON.stringify(updatedLocation)
                }
            );

        if (!response.ok) {
            throw new Error("Update fehlgeschlagen");
        }

        alert("Location aktualisiert");
        loadLocations();
        showScreen("main-screen");

    } catch(err) {
        console.error(err);
    }
}

async function addLocation() {

    try {
        const street = document.getElementById("add-street").value;
        const zip = document.getElementById("add-zip").value;
        const city = document.getElementById("add-city").value;
        const coordinates = await getCoordinatesFromAddress(street, zip, city);

        if (!coordinates) {
            alert("Adresse konnte nicht gefunden werden.");
            return;
        }

        const newLocation = {

            name:
                document.getElementById("add-name").value,

            description: document.getElementById("add-description").value,

            street: street,

            zip: zip,

            city: city,

            category: document.getElementById("add-category").value,

            lat: coordinates.lat,

            lng: coordinates.lng,

            imageUrl: ""

        };

        const response = await fetch("/loc", {
                method: "POST",
                headers: {
                    "Content-Type":
                    "application/json"
                },
                body: JSON.stringify(newLocation)
            });

        if (!response.ok) {
            throw new Error("Location konnte nicht gespeichert werden");
        }

        const createdLocation = await response.json();
        console.log(document.getElementById("add-image").files[0]);
        await uploadImage(createdLocation._id);

        alert("Location gespeichert");
        loadLocations();
        showScreen("main-screen");

    } catch(err) {
        console.error(err);
    }
}

async function uploadImage(locationId) {

    const imageInput = document.getElementById("add-image");
    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`/loc/${locationId}/image`, {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error("Bild Upload fehlgeschlagen"        );
    }
}

async function replaceImage() {

    const imageInput = document.getElementById("replace-image");
    const file = imageInput.files[0];

    if (!file) {
        alert("Bitte Bild auswählen");
        return;
    }

    const formData = new FormData();
    console.log(file);
    formData.append("image", file);

    try {
        const response = await fetch(`/loc/${currentLocation._id}/image`,
                {
                    method: "POST",
                    body: formData
                }
            );


        console.log("Status:", response.status);



        if (!response.ok) {
            throw new Error("Upload fehlgeschlagen");
        }

        const updatedLocation = await response.json();


        console.log("Server Antwort:", updatedLocation);
        console.log("Neue imageUrl:", updatedLocation.imageUrl);


        currentLocation = updatedLocation;
        renderDetails(updatedLocation);
        await loadLocations();

    } catch(err) {
        console.error(err);
    }
}

async function deleteImage() {

    console.log("deleteImage gestartet");
    const confirmed = confirm("Bild wirklich löschen?");
    console.log("confirmed =", confirmed);

    if (!confirmed) {
        return;
    }

    console.log("nach confrim");
    console.log("vor fetch");

    try {
        const response = await fetch(`/loc/${currentLocation._id}/image`,
                {
                    method: "DELETE"
                }
            );
        
        console.log(response.status);    

        if (!response.ok) {
            throw new Error("Löschen fehlgeschlagen");
        }
        currentLocation.imageUrl = "";
        renderDetails(currentLocation);
        await loadLocations();

    } catch(err) {
        console.error(err);
    }
}

async function deleteLocation() {

    const confirmed = confirm("Location wirklich löschen?");

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(`/loc/${currentLocation._id}`,
                {
                    method: "DELETE"
                }
            );

        if (!response.ok) {
            throw new Error("Delete fehlgeschlagen");
        }

        alert("Location gelöscht");
        loadLocations();
        showScreen("main-screen");

    } catch(err) {
        console.error(err);
    }
}

function renderDetails(location) {

    const container = document.getElementById("detail-content");
    console.log(location.imageUrl);
    const isAdmin = currentUser.role ==="admin";
    const readOnly = !isAdmin;
    container.innerHTML = `


        ${location.imageUrl
            ? `
                <img
                    src="${location.imageUrl}?t=${Date.now()}"
                    class="location-image"
                >

                <br><br>

                ${isAdmin ? `
                    <input
                        type="file"
                        id="replace-image"
                        accept="image/*"
                    >
                ` : ""}

                ${isAdmin ? `
                    <button
                        type="button"
                        id="replace-image-btn"
                    >
                        Bild ersetzen
                    </button>

                    <button
                        type="button"
                        id="delete-image-btn"
                    >
                    Bild löschen
                    </button>
                ` : ""}

                <br><br>
                `
            : `
                <input
                    type="file"
                    id="replace-image"
                    accept="image/*"
                >

                ${isAdmin ? `
                    <button
                        type="button"
                        id="replace-image-btn"
                    >
                        Bild hochladen
                    </button>
                ` : ""}

                <br><br>
                `
    }



        <label>Name</label>
        <input
            id="detail-name"
            value="${location.name}"
            ${readOnly ? "readonly" : ""}
        >

        <label>Beschreibung</label>
        <textarea
            id="detail-description"
            ${readOnly ? "readonly" : ""}
        >${location.description}</textarea>

        <label>Straße</label>
        <input
            id="detail-street"
            value="${location.street}"
            ${readOnly ? "readonly" : ""}
        >

        <label>PLZ</label>
        <input
            id="detail-zip"
            value="${location.zip}"
            ${readOnly ? "readonly" : ""}
        >

        <label>Stadt</label>
        <input
            id="detail-city"
            value="${location.city}"
            ${readOnly ? "readonly" : ""}
        >

        <label>Kategorie</label>
        <input
            id="detail-category"
            value="${location.category}"
            ${readOnly ? "readonly" : ""}
        >

        <br><br>

        ${isAdmin ? `
            <button
                type="button"
                id="update-location-btn"
            >
                Update
            </button>

            <button
                type="button"
                id="delete-location-btn"
            >
                Delete
            </button>
        ` : ""}

    `;    
    
    const updateBtn = document.getElementById("update-location-btn");

    if (updateBtn) {
    updateBtn.addEventListener("click", updateLocation);
    }

    const deleteBtn = document.getElementById("delete-location-btn");

    if (deleteBtn) {
        deleteBtn.addEventListener("click", deleteLocation);
    }
    
    
    const replaceBtn = document.getElementById("replace-image-btn");

    if (replaceBtn) {
    replaceBtn.addEventListener("click", replaceImage);
    }

    const deleteImageBtn = document.getElementById("delete-image-btn");

    if (deleteImageBtn) {
        deleteImageBtn.addEventListener("click", deleteImage);
    }
}

function showScreen(screenId) {
    const screens = document.querySelectorAll("section");

    screens.forEach((screen) => {
        screen.style.display = "none";
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.style.display = "block";
    } else {
        console.warn("Screen nicht gefunden:", screenId);
    }
}

function initializeMap() {

    map = L.map("map").setView([52.5200, 13.4050], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {attribution:
                "&copy; OpenStreetMap"}).addTo(map);
}

function renderMarkers(locations) {

    markers.forEach(marker => {map.removeLayer(marker);});
    markers = [];
    markerMap = {};

    const group = L.featureGroup();

    locations.forEach(location => {
        if (!location.lat || !location.lng) {
            return;
        }

        const marker = L.marker([location.lat, location.lng])
        .addTo(map).bindPopup(`
            <strong>${location.name}</strong>
            <br>
            ${location.category}
        `);
        markers.push(marker);
        markerMap[location._id] = marker;

        group.addLayer(marker);
    });

    if(markers.length > 0) {
        map.fitBounds(group.getBounds(), {
            padding: [50, 50]
        });
    }
}

function highlightMarker(locationId) {

    const marker = markerMap[locationId];

    if (!marker) {
        return;
    }

    marker.openPopup();
}

async function getCoordinatesFromAddress(street, zip, city) {

    const address = `${street}, ${zip} ${city}`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    try {

        const response = await fetch(url);
        const data = await response.json();

        if (data.length === 0) {
            return null;
        }

        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
        };
    } catch(err) {
        console.error("Geocoding Fehler", err);
        return null;
    }
}

showScreen("login-screen");

document.getElementById("login-form").addEventListener("submit", async (e) => {

    e.preventDefault();

    const username = document.getElementById("username").value;

    const password = document.getElementById("password").value;

    const user = await login(username, password);

    if (!user) {
        return;
    }

    currentUser = user;

    console.log("Login erfolgreich", user);

    document.getElementById("welcome-message").textContent = `Welcome back, ${user.name}!`;

    if (user.role === "admin") {
        document.getElementById("go-add-screen").style.display = "block";
    } else {
        document.getElementById("go-add-screen").style.display = "none";
    }

    showScreen("main-screen");

    if(!map){
        initializeMap();
    }

    loadLocations();
});

document.getElementById("logout-btn").addEventListener("click", () => {
    logout();
});

document.getElementById("back-from-detail").addEventListener("click", () => {
    showScreen("main-screen");
});

document.getElementById("go-add-screen").addEventListener("click", () => {
        showScreen("add-screen");
    });

document.getElementById("add-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await addLocation();
    });

document.getElementById("cancel-add").addEventListener("click", () => {
        showScreen("main-screen");
    });