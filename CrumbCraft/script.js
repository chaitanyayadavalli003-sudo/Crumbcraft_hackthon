
const flavorPrices = {
    "Chocolate Truffle": 650,
    "Red Velvet": 750,
    "Mango": 700,
    "Black Forest": 800
};

const capacityLimit = 25;

const ingredientRatios = {
    flour: 400,
    sugar: 250,
    cream: 300,
    chocolate: 150
};

const $ = id => document.getElementById(id);

const flavor = $("flavor");
const weight = $("weight");
const shape = $("shape");
const frosting = $("frosting");
const decoration = $("decoration");
const message = $("message");
const orderDate = $("orderDate");
const pickup = $("pickup");
const customer = $("customer");
const phone = $("phone");

function getOrders() {
    try {
        return JSON.parse(localStorage.getItem("crumbcraft_orders")) || [];
    } catch {
        return [];
    }
}

function saveOrders(orders) {
    localStorage.setItem("crumbcraft_orders", JSON.stringify(orders));
}

function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

orderDate.min = getToday();
orderDate.value = getToday();

function calculatePrice() {
    const kg = Number(weight.value);
    const base = flavorPrices[flavor.value] * kg;
    const shapeFee = shape.value === "Heart" ? 100 : 0;
    const frostingFee = frosting.value === "Fondant" ? 200 :
                        frosting.value === "Chocolate Ganache" ? 100 : 0;
    const decorationFee = Number(decoration.value);

    return Math.round(base + shapeFee + frostingFee + decorationFee);
}

function updatePreview() {
    const price = calculatePrice();

    $("totalPrice").textContent = `₹${price.toLocaleString("en-IN")}`;
    $("previewFlavor").textContent = flavor.value;
    $("previewWeight").textContent = `${weight.value} kg`;
    $("previewDecoration").textContent = decoration.options[decoration.selectedIndex].text;
    $("previewMessage").textContent = message.value || "Your sweet creation";
}

[flavor, weight, shape, frosting, decoration, message].forEach(element => {
    element.addEventListener("input", updatePreview);
    element.addEventListener("change", updatePreview);
});

function ordersOnDate(date) {
    return getOrders().filter(order => order.date === date).length;
}

function checkCapacity(date) {
    return ordersOnDate(date) < capacityLimit;
}

function calculateForecast(orders) {
    const totals = {
        flour: 0,
        sugar: 0,
        cream: 0,
        chocolate: 0
    };

    orders.forEach(order => {
        const kg = Number(order.weight);

        totals.flour += ingredientRatios.flour * kg;
        totals.sugar += ingredientRatios.sugar * kg;
        totals.cream += ingredientRatios.cream * kg;
        totals.chocolate += ingredientRatios.chocolate * kg;
    });

    return totals;
}

function renderForecast() {
    const orders = getOrders();
    const totals = calculateForecast(orders);

    const ingredients = [
        ["Flour", totals.flour],
        ["Sugar", totals.sugar],
        ["Cream", totals.cream],
        ["Chocolate", totals.chocolate]
    ];

    $("forecastList").innerHTML = ingredients.map(([name, grams]) => `
        <div class="forecast-item">
            <span>${name}</span>
            <strong>${(grams / 1000).toFixed(2)} kg</strong>
        </div>
    `).join("");
}

function renderDashboard() {
    const orders = getOrders();
    const todayCount = ordersOnDate(getToday());

    $("totalOrders").textContent = orders.length;
    $("availableSlots").textContent = capacityLimit - todayCount;

    const percent = (todayCount / capacityLimit) * 100;
    $("capacityBar").style.width = `${percent}%`;
    $("capacityText").textContent =
        `${todayCount} / ${capacityLimit} cakes booked for today`;

    if (todayCount >= capacityLimit) {
        $("capacityText").textContent += " — Fully booked!";
    }

    renderForecast();
    renderOrders();
}

function renderOrders() {
    const orders = getOrders();

    if (orders.length === 0) {
        $("ordersList").innerHTML =
            "<p>No orders yet. Your orders will appear here.</p>";
        return;
    }

    const recent = [...orders].reverse().slice(0, 10);

    $("ordersList").innerHTML = recent.map(order => `
        <div class="order-item">
            <div>
                <strong>${escapeHTML(order.name)}</strong>
                <small>${escapeHTML(order.flavor)} • ${order.weight} kg</small>
                <small>${escapeHTML(order.date)} • ${escapeHTML(order.time)}</small>
            </div>
            <strong>₹${order.price.toLocaleString("en-IN")}</strong>
        </div>
    `).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function createOrder() {
    if (!customer.value.trim()) {
        alert("Please enter your name.");
        customer.focus();
        return;
    }

    if (!/^\d{10}$/.test(phone.value.trim())) {
        alert("Please enter a valid 10-digit phone number.");
        phone.focus();
        return;
    }

    if (!orderDate.value) {
        alert("Please select a pickup date.");
        orderDate.focus();
        return;
    }

    if (orderDate.value < getToday()) {
        alert("Please select today or a future date.");
        return;
    }

    if (!checkCapacity(orderDate.value)) {
        alert("Sorry! This date is fully booked. Please choose another date.");
        return;
    }

    const order = {
        id: "CC" + Date.now(),
        name: customer.value.trim(),
        phone: phone.value.trim(),
        flavor: flavor.value,
        weight: weight.value,
        shape: shape.value,
        frosting: frosting.value,
        decoration: decoration.options[decoration.selectedIndex].text,
        message: message.value.trim(),
        date: orderDate.value,
        time: pickup.value,
        price: calculatePrice()
    };

    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    showReceipt(order);
    renderDashboard();
}

function showReceipt(order) {
    $("receiptContent").innerHTML = `
        <div class="receipt-details">
            <div><span>Order ID</span><strong>${escapeHTML(order.id)}</strong></div>
            <div><span>Name</span><strong>${escapeHTML(order.name)}</strong></div>
            <div><span>Flavor</span><strong>${escapeHTML(order.flavor)}</strong></div>
            <div><span>Weight</span><strong>${escapeHTML(order.weight)} kg</strong></div>
            <div><span>Shape</span><strong>${escapeHTML(order.shape)}</strong></div>
            <div><span>Frosting</span><strong>${escapeHTML(order.frosting)}</strong></div>
            <div><span>Decoration</span><strong>${escapeHTML(order.decoration)}</strong></div>
            <div><span>Message</span><strong>${escapeHTML(order.message || "None")}</strong></div>
            <div><span>Pickup date</span><strong>${escapeHTML(order.date)}</strong></div>
            <div><span>Pickup time</span><strong>${escapeHTML(order.time)}</strong></div>
            <div><span>Phone</span><strong>${escapeHTML(order.phone)}</strong></div>
            <div><span>Total</span><strong>₹${order.price.toLocaleString("en-IN")}</strong></div>
        </div>
    `;

    $("receiptModal").classList.add("show");
}

$("orderBtn").addEventListener("click", createOrder);

$("closeReceipt").addEventListener("click", () => {
    $("receiptModal").classList.remove("show");
});

$("printReceipt").addEventListener("click", () => {
    window.print();
});

$("receiptModal").addEventListener("click", event => {
    if (event.target === $("receiptModal")) {
        $("receiptModal").classList.remove("show");
    }
});

orderDate.addEventListener("change", () => {
    if (orderDate.value && !checkCapacity(orderDate.value)) {
        alert("This date is currently fully booked. Please select another date.");
    }
});

$("photoCake").addEventListener("change", event => {
    const file = event.target.files[0];
    const preview = $("photoPreview");

    if (!file) {
        preview.style.display = "none";
        preview.removeAttribute("src");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5 MB.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = event => {
        preview.src = event.target.result;
        preview.style.display = "block";
    };

    reader.readAsDataURL(file);
});

updatePreview();
renderDashboard();
