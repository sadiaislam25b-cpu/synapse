import pool from "./db.js";

const companies = [
    { name: "Neuralink", location: "Fremont, CA", website: "https://neuralink.com", tags: ["BCI", "Implants"], description: "Develops a fully implanted wireless brain-computer interface placed by a surgical robot." },
    { name: "Synchron", location: "New York, NY", website: "https://synchron.com", tags: ["BCI", "Implants", "Medical"], description: "Builds a brain-computer interface delivered through blood vessels, avoiding open brain surgery." },
    { name: "Blackrock Neurotech", location: "Salt Lake City, UT", website: "https://blackrockneurotech.com", tags: ["BCI", "Implants"], description: "Makes the Utah array electrodes used in many academic BCI studies." },
    { name: "Precision Neuroscience", location: "New York, NY", website: "https://precisionneuro.io", tags: ["BCI", "Implants", "Medical"], description: "Develops a thin, flexible electrode film that sits on the brain's surface." },
    { name: "Paradromics", location: "Austin, TX", website: "https://paradromics.com", tags: ["BCI", "Implants"], description: "Focuses on high-data-rate implants aimed at restoring communication." },
    { name: "NeuroPace", location: "Mountain View, CA", website: "https://neuropace.com", tags: ["Implants", "Medical"], description: "Makes a responsive neurostimulation system used to treat epilepsy." },
    { name: "Kernel", location: "Los Angeles, CA", website: "https://kernel.com", tags: ["Imaging", "Wearables"], description: "Builds wearable headsets that measure brain activity with light." },
    { name: "Emotiv", location: "San Francisco, CA", website: "https://emotiv.com", tags: ["EEG", "Wearables"], description: "Sells EEG headsets for research, consumer, and workplace use." },
    { name: "Neurable", location: "Boston, MA", website: "https://neurable.com", tags: ["EEG", "Wearables"], description: "Puts EEG sensors into headphones to estimate focus." },
    { name: "Muse (Interaxon)", location: "Toronto, Canada", website: "https://choosemuse.com", tags: ["EEG", "Wearables"], description: "Makes EEG headbands that give feedback during meditation and sleep." },
    { name: "Cognixion", location: "Santa Barbara, CA", website: "https://cognixion.com", tags: ["BCI", "EEG", "Medical"], description: "Combines EEG with augmented reality to help people with speech loss communicate." },
];

for (const c of companies) {
    await pool.query(
        `INSERT INTO companies (name, location, website, tags, description)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (name) DO NOTHING`,
        [c.name, c.location, c.website, c.tags, c.description]
    );
}

console.log(`Seeded ${companies.length} companies`);
await pool.end();