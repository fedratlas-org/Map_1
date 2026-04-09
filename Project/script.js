// 🗺 CREATE MAP (ONLY ONCE)
var map = L.map('map').setView([7.8731, 80.7718], 10);

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

// SHOW PLACE CARD
function showPlaceCard(place) {
    document.getElementById("placeCard").classList.remove("hidden");

    const name = place.display_name.split(",")[0];

    document.getElementById("placeTitle").innerText = name;
    document.getElementById("placeAddress").innerText = place.display_name;
    document.getElementById("placeDesc").innerText =
        "Selected from map search. Explore or save this place.";

    // 🖼 GET IMAGE (Wikipedia + fallback)
    fetchPlaceData(name);
}

function fetchPlaceData(name) {
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {

            // 🖼 IMAGE
            if (data.thumbnail && data.thumbnail.source) {
                document.getElementById("placeImage").src =
                    data.thumbnail.source;
            } else {
                fallbackImage(name);
            }

            // 📖 DESCRIPTION
            const descElement= document.getElementById("placeDesc");
            if (data.extract) {
                descElement.innerText = data.extract;
                document.getElementById("seeMoreLink").href = data.content_urls.desktop.page;
            } else {
                document.getElementById("placeDesc").innerText =
                    "No description available.";
            }
        })
        .catch(() => {
            fallbackImage(name);
            document.getElementById("placeDesc").innerText =
                "No description available.";
        });
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