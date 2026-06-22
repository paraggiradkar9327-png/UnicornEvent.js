const leadershipTeam = [
    {
        name: "Tushar Yerpude",
        role: "Asst. Manager - Operations",
        image: "./assets/team/Mr.Tushar-Yerpude.png",
        bio: "He is a dedicated operations professional with a creative mindset. He is known for his innovative approach, attention to detail, and ability to ensure seamless and impactful experiences in every event he handles."
    },
    {
        name: "Kirti Deshkar",
        role: "Business Development & Office Admin",
        image: "./assets/team/kirti-deshkar-img-1.jpg",
        bio: "She has strong experience in office administration and management, known for her professionalism. She manages daily office operations smoothly and ensures everything is well-organized and coordinated."
    },
    {
        name: "Rashmi Kaware",
        role: "Business Development",
        image: "./assets/team/ms-rashmi-kaware.jpg",
        bio: "She is a creative professional with expertise in business development, production, and designing. She is known for her innovative mindset and smooth project coordination."
    },
    {
        name: "Shambhavi Singh",
        role: "Graphic Designer",
        image: "./assets/team/Ms.Shambhavi-Singh.png",
        bio: "She is a talented creative designer known for her strong design skills and innovative thinking. She also contributes to event execution whenever required, ensuring smooth and effective event delivery."
    },
    {
        name: "Ritik Dhumal",
        role: "Executive Operations",
        image: "./assets/team/Mr.Ritik-Dhumal.png",
        bio: "He is a skilled operations professional known for efficiently managing and executing various events. He has strong experience in handling operational responsibilities and ensuring smooth on-ground execution."
    },
    {
        name: "Parag Giradkar",
        role: "Business Development",
        image: "./assets/team/Mr.-Parag-Giradkar.png",
        bio: "He is a creative professional with strong expertise in business development and event execution. He is known for his innovative mindset and effective handling of project delivery."
    },
    {
        name: "Kanishk Mehta",
        role: "Business Development",
        image: "./assets/team/Mr.Kanishk-Mehta.png",
        bio: "He helps brands grow through creative branding and result-driven digital marketing strategies, turning ideas into impactful solutions through innovation and smart marketing."
    },
    {
        name: "Tulsidas Kaurate",
        role: "Office Admin",
        image: "./assets/team/mr-tulsidas-kaurate-img-1.jpg",
        bio: "Tulsidas, our steadfast Office Admin, has been with Unicorn Events since day one, ensuring everything runs seamlessly. His loyalty and dedication make him the backbone of our journey."
    },
    {
        name: "Salmon Thakur",
        role: "Office Admin",
        image: "./assets/team/mr-salmon-thakur-img-1.jpg",
        bio: "Salmon Thakur, our dedicated Office Admin, skillfully manages all office operations and ensures every event runs flawlessly. His efficiency and commitment keep Unicorn Events organized and thriving."
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("leadershipGrid");

    if (!grid || !leadershipTeam) return;

    grid.innerHTML = leadershipTeam.map(member => `
    <div class="tm-leader-card fade-in">
      <div class="tm-leader-portrait">
        <div class="tm-leader-initials">
          <img src="${member.image}"
               alt="${member.name}"
               class="tm-leader-photo">
        </div>
      </div>

      <div class="tm-leader-info">
        <h3 class="tm-leader-name">${member.name}</h3>
        <span class="tm-leader-role">${member.role}</span>
        <p class="tm-leader-bio">${member.bio}</p>
      </div>
    </div>
  `).join('');
});