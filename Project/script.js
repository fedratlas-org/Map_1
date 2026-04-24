// ===============================
// GLOBALS
// ===============================
let uploadedImage = "";
let marker = null;
let selecting = false;
let savedMarkers = [];

// ===============================
// MAP INIT
// ===============================
const map = L.map("map").setView([7.8731, 80.7718], 10);
map.doubleClickZoom.disable();

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);

// ===============================
// SEARCH
// ===============================
function searchLocation() {
    const query = document
        .getElementById("searchbox")
        .value
        .trim()
        .toLowerCase();

    if (!query) return;

    // Search saved places first
    fetch("https://fedratlas-map.onrender.com/places")
        .then(res => res.json())
        .then(places => {
            const found = places.find(place =>
                place.name.toLowerCase().includes(query)
            );

            if (found) {
                showSavedPlace(found);
            } else {
                searchOnline(query);
            }
        });
}

function searchOnline(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                alert("Location not found 😢");
                return;
            }

            const place = data[0];

            setMarker(place.lat, place.lon);
            map.setView([place.lat, place.lon], 14);

            showPlaceCard(place);
        });
}

// ===============================
// PLACE DISPLAY
// ===============================
function showSavedPlace(place) {
    setMarker(place.lat, place.lon);
    map.setView([place.lat, place.lon], 16);

    document.getElementById("placeCard").classList.remove("hidden");
    document.getElementById("placeTitle").innerText = place.name;
    document.getElementById("placeType").innerText = "Saved Place";
    document.getElementById("placeDesc").innerText = place.desc;
    document.getElementById("placeAddress").innerText = place.address;

    document.getElementById("placeImage").src =
        place.image || "https://via.placeholder.com/400x200?text=No+Image";
}

function showPlaceCard(place) {
    const name = place.display_name.split(",")[0];

    document.getElementById("placeCard").classList.remove("hidden");
    document.getElementById("placeTitle").innerText = name;
    document.getElementById("placeAddress").innerText = place.display_name;
    document.getElementById("placeType").innerText = detectType(place.type);
    document.getElementById("placeDesc").innerText =
        "Selected from map search.";

    fetchPlaceData(name);
}

function detectType(type = "") {
    if (type.includes("country")) return "🌍 Country";
    if (type.includes("city") || type.includes("town")) return "🏙 City";
    if (type.includes("village")) return "🏡 Village";
    if (type.includes("road")) return "🛣 Street";
    if (type.includes("hotel")) return "🏨 Hotel";
    if (type.includes("university")) return "🎓 University";

    return "📍 Place";
}

// ===============================
// WIKIPEDIA DATA
// ===============================
function fetchPlaceData(name) {
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("placeImage").src =
                data.thumbnail?.source ||
                "https://via.placeholder.com/400x200?text=No+Image";

            document.getElementById("placeDesc").innerText =
                data.extract || "No description available.";

            if (data.content_urls?.desktop?.page) {
                document.getElementById("seeMoreLink").href =
                    data.content_urls.desktop.page;
            }
        });
}

// ===============================
// MAP HELPERS
// ===============================
function setMarker(lat, lon) {
    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lon]).addTo(map);
}

function closeCard() {
    document.getElementById("placeCard").classList.add("hidden");
}

// ===============================
// SELECT ON MAP
// ===============================
function enableMapSelection() {
    selecting = true;
    alert("Click map to select location 📍");
}

// SINGLE CLICK = only for select mode
map.on("click", function (e) {

    if (!selecting) return;

    selecting = false;

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    setMarker(lat, lon);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => {
            openAddPlaceForm(lat, lon, data.display_name);
        });
});


// DOUBLE CLICK = show place/city info
map.on("dblclick", function (e) {

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    setMarker(lat, lon);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => {

            if (!data || !data.display_name) {
                alert("Place not found 😢");
                return;
            }

            showPlaceCard(data);
        });
});

// ===============================
// MODAL
// ===============================
function openAddPlaceForm(lat, lon, address) {

    // show modal
    document.getElementById("addPlace").classList.remove("hidden");

    // reset fields
    document.getElementById("placeName").value = "";
    document.getElementById("placeDescInput").value = "";
    document.getElementById("placeAddressInput").value = address;

    // reset image memory
    uploadedImage = "";

    // reset upload box UI
    document.querySelector(".add-upload").innerHTML = `
        <i class="fa-solid fa-camera"></i>
        <p>Upload Place Photo</p>
        <small>PNG, JPG up to 10MB</small>
        <input type="file" id="placeImageInput" hidden>
    `;

    // store coords
    window.selectedLat = lat;
    window.selectedLon = lon;

    // reconnect upload listener
    bindUploadInput();
}
function bindUploadInput() {
    document.getElementById("placeImageInput")
        .addEventListener("change", function(e) {

            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = function(event) {
                uploadedImage = event.target.result;

                document.querySelector(".add-upload").innerHTML =
                    `<img src="${uploadedImage}" style="width:100%; border-radius:10px;">`;
            };

            reader.readAsDataURL(file);
        });
}

function closeModal() {
    document.getElementById("addPlace").classList.add("hidden");
}

// ===============================
// IMAGE UPLOAD
// ===============================
function triggerUpload() {
    document.getElementById("placeImageInput").click();
}

document.getElementById("placeImageInput")
    .addEventListener("change", function (e) {

        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (event) {
            uploadedImage = event.target.result;

            document.querySelector(".add-upload").innerHTML =
                `<img src="${uploadedImage}" style="width:100%; border-radius:10px;">`;
        };

        reader.readAsDataURL(file);
    });

// ===============================
// SAVE PLACE
// ===============================
function savePlace() {
    const place = {
        name: document.getElementById("placeName").value,
        desc: document.getElementById("placeDescInput").value,
        address: document.getElementById("placeAddressInput").value,
        lat: window.selectedLat,
        lon: window.selectedLon,
        image: uploadedImage
    };

    fetch("http://localhost:3000/places", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(place)
    })
        .then(res => res.json())
        .then(() => {
            alert("Place saved 😏🔥");
            closeModal();
            function closeModal() {
                document.getElementById("addPlace").classList.add("hidden");

                uploadedImage = "";
            }
        });
}

// ===============================
// LOAD SAVED PLACES
// ===============================
function loadPlaces() {

    savedMarkers.forEach(m => map.removeLayer(m));
    savedMarkers = [];

    fetch("http://localhost:3000/places")
        .then(res => res.json())
        .then(data => {

            data.forEach(place => {

                const m = L.marker([place.lat, place.lon])
                    .addTo(map)
                    .bindPopup(`
                        <b>${place.name}</b><br>
                        ${place.desc}
                    `);

                savedMarkers.push(m);
            });
        });
}

// ===============================
// EVENTS
// ===============================
document.getElementById("searchbox")
    .addEventListener("keypress", function (e) {
        if (e.key === "Enter") searchLocation();
    });

// ===============================
// START
// ===============================
loadPlaces();