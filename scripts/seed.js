const axios = require('axios');
const Typesense = require('typesense');
require('dotenv').config({ path: '../.env' });

const TYPESENSE_CONFIG = {
  'nodes': [{
    'host': 'localhost',
    'port': process.env.TYPESENSE_PORT || 8108,
    'protocol': process.env.TYPESENSE_PROTOCOL || 'http'
  }],
  'apiKey': process.env.TYPESENSE_API_KEY || 'typesense_admin_key',
  'connectionTimeoutSeconds': 5
};

const client = new Typesense.Client(TYPESENSE_CONFIG);

async function setupSchema() {
  const schema = {
    name: 'events',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string', optional: true },
      { name: 'category', type: 'string', facet: true },
      { name: 'venue', type: 'string' },
      { name: 'date', type: 'int64' },
      { name: 'location', type: 'geopoint' },
      { name: 'image', type: 'string', optional: true }
    ]
  };

  try {
    await client.collections('events').delete();
    console.log('Old schema deleted.');
  } catch (err) {
    // Schema didn't exist yet, safe to ignore
  }

  console.log('Creating new Typesense schema...');
  await client.collections().create(schema);
}

async function fetchFromTicketmaster() {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('Please provide a valid TICKETMASTER_API_KEY in your .env file');
  }

  const events = [];
  let page = 0;
  const targetSize = 200;

  console.log('Fetching data from Ticketmaster API...');

  while (events.length < targetSize && page < 5) {
    try {
      const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
        params: {
          apikey: apiKey,
          city: 'New York',
          size: 50,
          page: page
        }
      });

      const fetchedEvents = response.data?._embedded?.events || [];
      if (fetchedEvents.length === 0) break;

      for (const item of fetchedEvents) {
        const venue = item._embedded?.venues?.[0];
        const lat = parseFloat(venue?.location?.latitude);
        const lon = parseFloat(venue?.location?.longitude);

        if (!isNaN(lat) && !isNaN(lon)) {
          events.push({
            id: item.id,
            name: item.name,
            description: item.description || item.info || 'No description available.',
            category: item.classifications?.[0]?.segment?.name || 'Uncategorized',
            venue: venue.name || 'Unknown Venue',
            date: Math.floor(new Date(item.dates.start.dateTime || item.dates.start.localDate).getTime() / 1000),
            location: [lat, lon],
            image: item.images?.[0]?.url || ''
          });
        }
      }

      page++;
      // Sleep briefly to prevent hitting Ticketmaster per-second rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (error) {
      console.error(`Error on page ${page}:`, error.message);
      break;
    }
  }

  return events.slice(0, targetSize);
}

async function run() {
  try {
    await setupSchema();
    const cleanData = await fetchFromTicketmaster();
    
    if (cleanData.length < 200) {
      console.warn(`Warning: Only collected ${cleanData.length} valid events. Attempting to seed anyway.`);
    }

    console.log(`Indexing ${cleanData.length} documents into Typesense...`);
    const returnData = await client.collections('events').documents().import(cleanData, { action: 'upsert' });
    
    const failedItems = returnData.filter(item => item.success === false);
    if (failedItems.length > 0) {
      console.error(`${failedItems.length} items failed to index.`, failedItems[0]);
    } else {
      console.log('Seeding completed successfully!');
    }
  } catch (error) {
    console.error('Seeding critical failure:', error);
  }
}

run();