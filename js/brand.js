const brands = [
    { name: 'Adani', logo: './assets/brandIcon/adani-1.png' },
    { name: 'Audi', short: 'AUDI', color: '#cc0000', industry: 'Automotive', logo: './assets/brandIcon/audi-1.png' },
    { name: 'CEAT', short: 'CEAT', color: '#e63329', industry: 'Tyre Industry', logo: './assets/brandIcon/ceat-logo.png' },
    { name: 'Eicher', short: 'EICHER', color: '#cc1418', industry: 'Commercial Vehicles', logo: './assets/brandIcon/eicher-logo.png' },
    { name: 'Konkan', short: 'KNK', color: '#d4000a', industry: 'Manufacturing', logo: './assets/brandIcon/konkan-1.png' },
    { name: 'Mahindra', short: 'M&M', color: '#c0c0c0', industry: 'Automotive', logo: './assets/brandIcon/mahindra-logo.png' },
    { name: 'Morarjee', short: 'MRJ', color: '#5b3ea6', industry: 'Textile', logo: './assets/brandIcon/morariee-logo1.png' },
    { name: 'Tata', short: 'TATA', color: '#1a5fce', industry: 'Conglomerate', logo: './assets/brandIcon/tata-logo.png' },
    { name: 'ITC', short: 'ITC', color: '#c8a84b', industry: 'FMCG & Hotels', logo: './assets/brandIcon/itc-1.png' },
    { name: 'ABD', short: 'ABD', color: '#c8a84b', industry: 'Alcoholic Beverages', logo: './assets/brandIcon/abd-logo.png' },
    { name: 'Bacardi', short: 'BACARDI', color: '#c8a84b', industry: 'Alcoholic Beverages', logo: './assets/brandIcon/bacardi-1.png' },
    { name: 'Maharashtra Police', short: 'MP', color: '#c8a84b', industry: 'Law Enforcement', logo: './assets/brandIcon/maha-police-2.png' },
    { name: 'Mercedes-benz', short: 'MB', color: '#c8a84b', industry: 'Automotive', logo: './assets/brandIcon/mercedes-benz.png' },
    { name: 'Radiocity', short: 'RC', color: '#c8a84b', industry: 'Media & Entertainment', logo: './assets/brandIcon/radiocity-1.png' },
    { name: 'Rio', short: 'RIO', color: '#00a3e0', industry: 'Alcoholic Beverages', logo: './assets/brandIcon/rio-strong-logo.png' },
    { name: 'Seagrams', short: 'SEAGRAMS', color: '#cc0000', industry: 'Alcoholic Beverages', logo: './assets/brandIcon/seagrams-logo.png' },
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