// 🗺 CREATE MAP (ONLY ONCE)
var map = L.map('map').setView([7.8731, 80.7718], 10);
map.doubleClickZoom.disable();
// 🌍 TILE LAYER
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker;

// 🔍 SEARCH FUNCTION
function searchLocation() {
    const query = document.getElementById("searchbox").value;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                alert("Location not found");
                return;
            }

            const place = data[0];

            //  DYNAMIC ZOOM
            const bbox = place.boundingbox;

            if (bbox) {
                const bounds = [
                    [parseFloat(bbox[0]), parseFloat(bbox[2])],
                    [parseFloat(bbox[1]), parseFloat(bbox[3])]
                ];
                map.fitBounds(bounds);
            } else {
                map.setView([place.lat, place.lon], 12);
            }

            //  REMOVE OLD MARKER
            if (marker) {
                map.removeLayer(marker);
            }

            //  ADD MARKER (NO POPUP)
            marker = L.marker([place.lat, place.lon]).addTo(map);

            // UPDATE INPUT
            const input = document.getElementById("locationInput");
            if (input) {
                input.value = place.display_name;
            }

            //  SHOW CARD
            showPlaceCard(place);
        });
}
let selecting = false;

function enableMapSelection() {
    selecting = true;
    alert("Click on map to select location 📍");
}
// SHOW PLACE CARD
function showPlaceCard(place) {
    document.getElementById("placeCard").classList.remove("hidden");

    const name = place.display_name.split(",")[0];

    document.getElementById("placeTitle").innerText = name;
    document.getElementById("placeAddress").innerText = place.display_name;

    // 🧠 DEFAULT
    let label = "Place";

    // 🔥 Use place.type (from search API)
    const type = place.type || "";

    if (type.includes("country")) {
        label = "Country";
    } else if (type.includes("city") || type.includes("town")) {
        label = "City";
    } else if (type.includes("village")) {
        label = "Village";
    } else if (type.includes("road")) {
        label = "Street";
    } else if (type.includes("university")) {
        label = "University";
    } else if (type.includes("hotel")) {
        label = "Hotel";
    }

    // ✅ SET TYPE
    document.getElementById("placeType").innerText = label;

    // 📖 Default description first
    document.getElementById("placeDesc").innerText =
        "Selected from map search. Explore or save this place.";

    // 🖼 + 📖 REAL DATA
    fetchPlaceData(name);
}
function fetchPlaceData(name) {

    // 🔥 RESET image first (prevents old image bug)
    document.getElementById("placeImage").src = "";

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {

            const img = document.getElementById("placeImage");
            const uploadSection = document.getElementById("uploadSection");

            // 🖼 IMAGE
            if (data.thumbnail && data.thumbnail.source) {
                img.src = data.thumbnail.source;

                // ❌ hide upload if image exists
                uploadSection.style.display = "none";

            } else {
                showUploadOption();
            }

            // 📖 DESCRIPTION
            const descElement = document.getElementById("placeDesc");

            if (data.extract) {
                descElement.innerText = data.extract;

                document.getElementById("seeMoreLink").href =
                    data.content_urls.desktop.page;
            } else {
                descElement.innerText = "No description available.";
            }
        })
        .catch(() => {
            showUploadOption();

            document.getElementById("placeDesc").innerText =
                "No description available.";
        });
}
function showUploadOption() {
    const img = document.getElementById("placeImage");

    // placeholder image
    img.src = "https://via.placeholder.com/400x200?text=No+Image";

    // show upload UI
    document.getElementById("uploadSection").style.display = "block";
}
// ❌ CLOSE CARD
function closeCard() {
    document.getElementById("placeCard").classList.add("hidden");
}

// ⌨️ ENTER KEY SEARCH
document.getElementById("searchbox").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        searchLocation();
    }
});
map.on('dblclick', function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => {

            const place = {
                lat: lat,
                lon: lon,
                display_name: data.display_name || "Selected Location"
            };

            if (marker) {
                map.removeLayer(marker);
            }

            marker = L.marker([lat, lon]).addTo(map);

            showPlaceCard(place);
        });
});
map.on('click', function(e) {

    if (!selecting) return;

    selecting = false;

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    if (marker) {
        map.removeLayer(marker);
    }

    marker = L.marker([lat, lon]).addTo(map);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(data => {

            const address = data.display_name || "Selected location";

            openAddPlaceForm(lat, lon, address);
        });
});
document.getElementById("imageUpload").addEventListener("change", function(e) {
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            document.getElementById("placeImage").src = event.target.result;
        };

        reader.readAsDataURL(file);
    }
});
function openAddPlaceForm(lat, lon, address) {
    document.getElementById("addPlace").classList.remove("hidden");
    document.getElementById("placeAddressInput").value = address;
    window.selectedLat = lat;
    window.selectedLon = lon;
}

// ❌ CLOSE MODAL
function closeModal() {
    document.getElementById("addPlace").classList.add("hidden");
}

// 📸 TRIGGER UPLOAD (MODAL)
function triggerUpload() {
    document.getElementById("placeImageInput").click();
}

// 🖼 PREVIEW IMAGE (MODAL)
document.getElementById("placeImageInput").addEventListener("change", function(e) {
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            document.querySelector(".upload-box").innerHTML =
                `<img src="${event.target.result}" style="width:100%; border-radius:10px;">`;
        };

        reader.readAsDataURL(file);
    }
});

// 💾 SAVE PLACE
function savePlace() {
    const name = document.getElementById("placeName").value;
    const desc = document.getElementById("placeDescInput").value;
    const address = document.getElementById("placeAddressInput").value;

    const place = {
        name,
        desc,
        address,
        lat: window.selectedLat,
        lon: window.selectedLon
    };

    console.log("Saved:", place);

    alert("Place saved 😎");

    closeModal();
}