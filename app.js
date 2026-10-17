const flights = [
  {
    id: 1, airline: "Saudi Arabian Airlines", logo: "🇸🇦",
    from: "Riyadh (RUH)", to: "London (LHR)",
    departTime: "08:00", arrivalTime: "13:30", duration: "7h 30m",
    price: 920, stops: "Non-stop",
    classMultiplier: { economy: 1, business: 2.2, first: 4 }
  },
  {
    id: 3, airline: "Qatar Airways", logo: "🇶🇦",
    from: "Jeddah (JED)", to: "Tokyo (HND)",
    departTime: "23:00", arrivalTime: "15:20", duration: "10h 20m",
    price: 1380, stops: "1 stop",
    classMultiplier: { economy: 1, business: 2.3, first: 4.2 }
  },
  {
    id: 4, airline: "Saudi Arabian Airlines", logo: "🇸🇦",
    from: "Riyadh (RUH)", to: "Paris (CDG)",
    departTime: "01:00", arrivalTime: "06:45", duration: "6h 45m",
    price: 980, stops: "Non-stop",
    classMultiplier: { economy: 1, business: 2.1, first: 3.8 }
  },
  {
    id: 6, airline: "Qatar Airways", logo: "🇶🇦",
    from: "Jeddah (JED)", to: "London (LHR)",
    departTime: "10:25", arrivalTime: "17:00", duration: "8h 35m",
    price: 890, stops: "1 stop",
    classMultiplier: { economy: 1, business: 2.25, first: 4.1 }
  }
];

const searchForm = document.getElementById("search-form");
const fromCity = document.getElementById("from-city");
const toCity = document.getElementById("to-city");
const departDate = document.getElementById("depart-date");
const returnDate = document.getElementById("return-date");
const returnField = document.getElementById("return-field");
const passengersSelect = document.getElementById("passengers");
const flightClass = document.getElementById("flight-class");
const airlineFilter = document.getElementById("airline-filter");
const flightsList = document.getElementById("flights-list");
const resultsSummary = document.getElementById("results-summary");
const modal = document.getElementById("booking-modal");
const closeModalButton = document.getElementById("close-modal");
const confirmBookingButton = document.getElementById("confirm-booking");
const bookingMessage = document.getElementById("booking-message");
let selectedFlight = null;
let lastSearch = null;

const money = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
});

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setDateDefaults() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 8);

  departDate.min = localDateString(today);
  departDate.value = localDateString(tomorrow);
  returnDate.min = departDate.value;
  returnDate.value = localDateString(nextWeek);
}

function updateTripType() {
  const selectedTrip = document.querySelector('input[name="trip"]:checked').value;
  const isRoundTrip = selectedTrip === "round";
  returnField.classList.toggle("field-disabled", !isRoundTrip);
  returnDate.disabled = !isRoundTrip;
  returnDate.required = isRoundTrip;
  if (isRoundTrip && returnDate.value < departDate.value) {
    const newReturn = new Date(`${departDate.value}T12:00:00`);
    newReturn.setDate(newReturn.getDate() + 7);
    returnDate.value = localDateString(newReturn);
  }
}

function validateRoute() {
  if (fromCity.value === toCity.value) {
    toCity.setCustomValidity("Please choose a destination different from your departure city.");
    toCity.reportValidity();
    return false;
  }
  toCity.setCustomValidity("");
  if (departDate.value < departDate.min) {
    departDate.setCustomValidity("Choose today or a future date.");
    departDate.reportValidity();
    return false;
  }
  departDate.setCustomValidity("");
  if (!returnDate.disabled && returnDate.value < departDate.value) {
    returnDate.setCustomValidity("Return date must be on or after your departure date.");
    returnDate.reportValidity();
    return false;
  }
  returnDate.setCustomValidity("");
  return true;
}

function renderFlights(useSearch = false) {
  const selectedAirline = airlineFilter.value;
  const chosenFrom = fromCity.value;
  const chosenTo = toCity.value;
  const chosenClass = flightClass.value;
  const passengerCount = Number(passengersSelect.value);

  let filtered = flights.filter((flight) => {
    const matchesAirline = selectedAirline === "all" || flight.airline === selectedAirline;
    const matchesRoute = !useSearch || (flight.from === chosenFrom && flight.to === chosenTo);
    return matchesAirline && matchesRoute;
  });

  flightsList.innerHTML = "";

  if (filtered.length === 0) {
    flightsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⌕</div>
        <h3>No sample flights found</h3>
        <p>Try another route or select “All airlines”. This demo only includes a limited set of sample routes.</p>
        <button class="outline-btn" type="button" id="show-all-flights">Explore featured routes</button>
      </div>`;
    document.getElementById("show-all-flights").addEventListener("click", () => {
      airlineFilter.value = "all";
      renderFlights(false);
    });
    resultsSummary.textContent = useSearch
      ? `No sample options for ${chosenFrom} to ${chosenTo}.`
      : "Explore a selection of sample routes.";
    return;
  }

  resultsSummary.textContent = useSearch
    ? `${filtered.length} sample option${filtered.length === 1 ? "" : "s"} for ${chosenFrom} to ${chosenTo}.`
    : `${filtered.length} curated sample routes to explore.`;

  filtered.forEach((flight, index) => {
    const basePrice = flight.price * flight.classMultiplier[chosenClass];
    const totalPrice = basePrice * passengerCount;
    const card = document.createElement("article");
    card.className = "flight-card";
    card.style.animationDelay = `${index * 70}ms`;
    card.innerHTML = `
      <div class="airline-info">
        <div class="airline-logo" aria-hidden="true">${flight.logo}</div>
        <div class="airline-copy">
          <h3>${flight.airline}</h3>
          <span class="flight-label">${flight.stops}</span>
        </div>
      </div>
      <div class="flight-route">
        <div class="route-end">
          <strong class="time">${flight.departTime}</strong>
          <span class="city-code">${flight.from}</span>
        </div>
        <div class="route-middle">
          <span class="duration">${flight.duration}</span>
          <span class="route-track"><span></span></span>
          <span class="stops-label">${flight.stops}</span>
        </div>
        <div class="route-end">
          <strong class="time">${flight.arrivalTime}</strong>
          <span class="city-code">${flight.to}</span>
        </div>
      </div>
      <div class="flight-price">
        <span class="price-caption">${passengerCount} traveler${passengerCount === 1 ? "" : "s"} · ${chosenClass === "first" ? "First class" : chosenClass === "business" ? "Business" : "Economy"}</span>
        <strong class="price-val">${money.format(totalPrice)}</strong>
        <span class="price-per-person">${money.format(basePrice)} per traveler</span>
        <button class="gold-btn book-button" type="button" data-flight-id="${flight.id}">Select flight <span aria-hidden="true">→</span></button>
      </div>`;
    flightsList.appendChild(card);
  });

  flightsList.querySelectorAll("[data-flight-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const flight = flights.find((item) => item.id === Number(button.dataset.flightId));
      openBooking(flight);
    });
  });
}

function openBooking(flight) {
  const chosenClass = flightClass.value;
  const passengerCount = Number(passengersSelect.value);
  const unitPrice = flight.price * flight.classMultiplier[chosenClass];
  const totalPrice = unitPrice * passengerCount;
  const tripType = document.querySelector('input[name="trip"]:checked').value;
  const tripText = tripType === "round" ? "Round trip selected (sample pricing)" : "One-way trip";
  selectedFlight = { ...flight, unitPrice, totalPrice, passengerCount, chosenClass };

  document.getElementById("modal-flight-details").innerHTML = `
    <div class="detail-route"><span>${flight.from}</span><span class="detail-arrow">→</span><span>${flight.to}</span></div>
    <div class="detail-row"><span>Airline</span><strong>${flight.airline}</strong></div>
    <div class="detail-row"><span>Departure date</span><strong>${departDate.value}</strong></div>
    ${tripType === "round" ? `<div class="detail-row"><span>Return date</span><strong>${returnDate.value}</strong></div>` : ""}
    <div class="detail-row"><span>Cabin</span><strong>${chosenClass === "first" ? "First class" : chosenClass === "business" ? "Business" : "Economy"}</strong></div>
    <div class="detail-row"><span>Travelers</span><strong>${passengerCount}</strong></div>
    <div class="detail-row"><span>Trip</span><strong>${tripText}</strong></div>`;
  document.getElementById("modal-price").textContent = money.format(totalPrice);
  bookingMessage.textContent = "";
  confirmBookingButton.disabled = false;
  confirmBookingButton.innerHTML = 'Confirm demo selection <span aria-hidden="true">→</span>';
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  closeModalButton.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  selectedFlight = null;
}

function swapCities() {
  const previousFrom = fromCity.value;
  const previousTo = toCity.value;
  const fromHasTo = [...fromCity.options].some((option) => option.value === previousTo);
  const toHasFrom = [...toCity.options].some((option) => option.value === previousFrom);
  if (fromHasTo && toHasFrom) {
    fromCity.value = previousTo;
    toCity.value = previousFrom;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateRoute()) return;
  lastSearch = {
    from: fromCity.value,
    to: toCity.value,
    date: departDate.value
  };
  renderFlights(true);
  document.querySelector(".results-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

airlineFilter.addEventListener("change", () => renderFlights(Boolean(lastSearch)));
document.querySelectorAll('input[name="trip"]').forEach((radio) => {
  radio.addEventListener("change", updateTripType);
});
departDate.addEventListener("change", () => {
  returnDate.min = departDate.value;
  if (returnDate.value < departDate.value) {
    const next = new Date(`${departDate.value}T12:00:00`);
    next.setDate(next.getDate() + 7);
    returnDate.value = localDateString(next);
  }
});
document.getElementById("swap-cities").addEventListener("click", swapCities);
closeModalButton.addEventListener("click", closeModal);
modal.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", closeModal));

confirmBookingButton.addEventListener("click", () => {
  if (!selectedFlight) return;
  bookingMessage.textContent = "Demo selection confirmed. No reservation or payment has been made.";
  confirmBookingButton.disabled = true;
  confirmBookingButton.textContent = "Demo selection confirmed";
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

document.getElementById("year").textContent = new Date().getFullYear();
setDateDefaults();
updateTripType();
renderFlights(false);
