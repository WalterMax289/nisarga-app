document.addEventListener("DOMContentLoaded", () => {
  const pricePerCan = 60; // ₹60 per 20L can

  const btnDecrease = document.getElementById("btn-decrease");
  const btnIncrease = document.getElementById("btn-increase");
  const inputQuantity = document.getElementById("can-quantity");
  const totalPriceDisplay = document.getElementById("total-price");

  // Only initialize if we are on the order page where these elements exist
  if (btnDecrease && btnIncrease && inputQuantity && totalPriceDisplay) {

    // Core calculator function
    function updatePrice() {
      let qty = parseInt(inputQuantity.value, 10);

      // Fallback if NaN or too low
      if (isNaN(qty) || qty < 1) {
        qty = 1;
        inputQuantity.value = 1;
      }

      // Calculate total
      const total = qty * pricePerCan;

      // Animate price change slightly for better UX
      totalPriceDisplay.style.transform = "scale(1.1)";
      totalPriceDisplay.textContent = `₹${total}`;

      setTimeout(() => {
        totalPriceDisplay.style.transform = "scale(1)";
        totalPriceDisplay.style.transition = "transform 0.2s ease";
      }, 150);
    }

    // Decrease logic
    btnDecrease.addEventListener("click", () => {
      let qty = parseInt(inputQuantity.value, 10);
      if (qty > 1) {
        inputQuantity.value = qty - 1;
        updatePrice();
      }
    });

    // Increase logic
    btnIncrease.addEventListener("click", () => {
      let qty = parseInt(inputQuantity.value, 10);
      if (qty < 50) { // arbitrary max logic to avoid ridiculous totals
        inputQuantity.value = qty + 1;
        updatePrice();
      }
    });

    // Initial display string render
    updatePrice();
  }

  // Location and Map logic
  const btnLocation = document.getElementById("btn-location");
  const addressInput = document.getElementById("address");
  const mapContainer = document.getElementById("map");
  let map = null;
  let marker = null;

  if (btnLocation && addressInput && mapContainer) {
    btnLocation.addEventListener("click", () => {
      if (navigator.geolocation) {
        btnLocation.innerHTML = '<span style="opacity:0.7">Locating...</span>';
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Show map container
            mapContainer.style.display = "block";

            // Initialize map if not already done using Leaflet (loaded in HTML)
            if (typeof L !== 'undefined') {
              if (!map) {
                map = L.map('map').setView([lat, lon], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap'
                }).addTo(map);
                marker = L.marker([lat, lon]).addTo(map);
              } else {
                map.setView([lat, lon], 16);
                marker.setLatLng([lat, lon]);
              }
              // Required to fix map tile loading within dynamically displayed div
              setTimeout(() => { map.invalidateSize(); }, 100);
            }

            btnLocation.innerHTML = '✓ Located';

            // Reverse Geocoding via Nominatim
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
              const data = await res.json();
              if (data && data.display_name) {
                addressInput.value = data.display_name;
              } else {
                addressInput.value = `Lat: ${lat}, Lon: ${lon}`;
              }
            } catch (err) {
              addressInput.value = `Lat: ${lat}, Lon: ${lon} (Could not fetch formatted address)`;
            }
          },
          (error) => {
            alert("Unable to retrieve your location. Make sure location permissions are enabled.");
            btnLocation.innerHTML = 'Locate Me';
          }
        );
      } else {
        alert("Geolocation is not supported by your browser");
      }
    });
  }

  // Star Rating Logic (Profile Page)
  const starContainer = document.getElementById("star-rating");
  const ratingInput = document.getElementById("rating-value");

  if (starContainer && ratingInput) {
    const stars = starContainer.querySelectorAll("span");

    function updateStars(val, isHover = false) {
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute("data-value"), 10);
        if (sVal <= val) {
          s.style.color = isHover ? "#fcd34d" : "#fbbf24";
        } else {
          s.style.color = "#cbd5e1";
        }
      });
    }

    stars.forEach(star => {
      star.addEventListener("click", () => {
        const val = parseInt(star.getAttribute("data-value"), 10);
        ratingInput.value = val;
        updateStars(val);
        // Small active animation
        star.style.transform = "scale(1.2)";
        setTimeout(() => { star.style.transform = "scale(1)"; }, 150);
      });

      star.addEventListener("mouseover", () => {
        const val = parseInt(star.getAttribute("data-value"), 10);
        updateStars(val, true);
      });

      star.addEventListener("mouseout", () => {
        updateStars(parseInt(ratingInput.value, 10), false);
      });
    });

    const btnSubmitFeedback = document.getElementById("btn-submit-feedback");
    const feedbackText = document.getElementById("feedback-text");

    if (btnSubmitFeedback && feedbackText) {
      btnSubmitFeedback.addEventListener("click", () => {
        const rating = ratingInput.value || "0";
        const comments = feedbackText.value.trim();

        if (rating === "0" && comments === "") {
          alert("Please provide a rating or some comments before submitting!");
          return;
        }

        const emailAddress = "vinayr1811@gmail.com";

        // Disable button and show loading state
        const originalText = btnSubmitFeedback.innerHTML;
        btnSubmitFeedback.innerHTML = "Sending...";
        btnSubmitFeedback.disabled = true;

        // Send a background AJAX POST request to FormSubmit free tier API using clean JSON payload
        fetch(`https://formsubmit.co/ajax/${emailAddress}`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: "New Feedback for Nisarga Water",
            Rating: `${rating} / 5 Stars`,
            Comments: comments || "No comments provided."
          })
        })
          .then(response => response.json())
          .then(data => {
            if (data.success === "true" || data.success === true) {
              alert("Thank you! Your feedback has been successfully received.");
            } else {
              console.warn("FormSubmit response:", data);
              alert("Sent! Note: If this is your first time checking, please verify the activation email at vinayr1811@gmail.com.");
            }

            // Reset form fields
            ratingInput.value = "0";
            feedbackText.value = "";
            updateStars(0);
            btnSubmitFeedback.innerHTML = originalText;
            btnSubmitFeedback.disabled = false;
          })
          .catch(error => {
            console.error(error);
            alert("We encountered an issue sending your feedback. Please try again.");
            btnSubmitFeedback.innerHTML = originalText;
            btnSubmitFeedback.disabled = false;
          });
      });
    }
  }
});
