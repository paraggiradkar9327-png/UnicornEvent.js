const brands = [
    { name: 'Adani', logo: './assets/brandIcon/adani-1.png' },
    { name: 'Audi', logo: './assets/brandIcon/audi-1.png' },
    { name: 'CEAT', logo: './assets/brandIcon/ceat-logo.png' },
    { name: 'Eicher', short: 'EICHER', color: '#cc1418', industry: 'Commercial Vehicles', logo: './assets/brandIcon/eicher-logo.png' },
    { name: 'Mahindra', logo: './assets/brandIcon/mahindra-logo.png' },
    { name: 'Morarjee', logo: './assets/brandIcon/morariee-logo1.png' },
    { name: 'Tata', logo: './assets/brandIcon/tata-logo.png' },
    { name: 'ITC', logo: './assets/brandIcon/itc-1.png' },
    { name: 'ABD', logo: './assets/brandIcon/abd-logo.png' },
    { name: 'Bacardi', logo: './assets/brandIcon/bacardi-1.png' },
    { name: 'Maharashtra Police', logo: './assets/brandIcon/maha-police-2.png' },
    { name: 'Radiocity', logo: './assets/brandIcon/radiocity-1.png' },
    { name: 'Rio', logo: './assets/brandIcon/rio-strong-logo.png' },
    { name: 'Seagrams', logo: './assets/brandIcon/seagrams-logo.png' },
];

const marqueeTrack = document.getElementById("marqueeTrack");

function createMarquee() {

    const doubledBrands = [...brands, ...brands];

    marqueeTrack.innerHTML = doubledBrands.map(brand => `
        <div class="brand-item">
            <img src="${brand.logo}" alt="${brand.name}">
            <h4>${brand.name}</h4>
        </div>
    `).join('');
}

createMarquee();