/**
 * UNICORN EVENTS ADMIN DASHBOARD
 */
document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
});


// ================= WEDDING TABLE =================

function createWeddingTable(data) {

    const table = document.getElementById("weddingTable");

    table.innerHTML = "";
    data.forEach((item, index) => {
        table.innerHTML += `
        <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.mobile}</td>
        <td>${item.email}</td>
        <td>${item.city}</td>
        <td>${item.bride_name}</td>
        <td>${item.groom_name}</td>
        <td>${item.wedding_date}</td>
        <td>${item.venue_location}</td>
        <td>${item.guests}</td>
        <td>${item.budget}</td>
        <td>${item.venue_type}</td>
        <td>${item.theme}</td>
        <td>${item.special}</td>
        </tr>`;
    });
}
// ================= CONTACT TABLE =================

function createContactTable(data) {

    const table = document.getElementById("contactTable");

    table.innerHTML = "";
    data.forEach((item, index) => {
        table.innerHTML += `
        <tr>
        <td>${index + 1}</td>
        <td>${item.first_name}</td>
        <td>${item.last_name}</td>
        <td>${item.email}</td>
        <td>${item.phone}</td>
        <td>${item.service}</td>
        <td>${item.event_date}</td>
        <td>${item.event_location}</td>
        <td>${item.message}</td>
        </tr>`;
    });
}