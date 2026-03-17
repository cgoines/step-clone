const { faker } = require('faker');
const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

require('dotenv').config();

// Import comprehensive world countries data
const countries = require('./world-countries');

// Sample embassy contacts
const embassyContacts = [
    {
        country: 'United Kingdom',
        name: 'US Embassy London',
        address: '33 Nine Elms Lane, London SW11 7US',
        phone: '+44 20 7499 9000',
        email: 'consularLondon@state.gov',
        emergency_phone: '+44 20 7499 9000',
        website: 'https://uk.usembassy.gov/'
    },
    {
        country: 'France',
        name: 'US Embassy Paris',
        address: '2 Avenue Gabriel, 75008 Paris',
        phone: '+33 1 43 12 22 22',
        email: 'consularParis@state.gov',
        emergency_phone: '+33 1 43 12 22 22',
        website: 'https://fr.usembassy.gov/'
    },
    {
        country: 'Germany',
        name: 'US Embassy Berlin',
        address: 'Clayallee 170, 14195 Berlin',
        phone: '+49 30 8305 0',
        email: 'consularBerlin@state.gov',
        emergency_phone: '+49 30 8305 0',
        website: 'https://de.usembassy.gov/'
    },
    {
        country: 'Japan',
        name: 'US Embassy Tokyo',
        address: '1-10-5 Akasaka, Minato-ku, Tokyo 107-8420',
        phone: '+81 3 3224 5000',
        email: 'consularTokyo@state.gov',
        emergency_phone: '+81 3 3224 5000',
        website: 'https://jp.usembassy.gov/'
    },
    {
        country: 'Brazil',
        name: 'US Embassy Brasilia',
        address: 'SES - Av. das Nações, Quadra 801, Lote 3, Brasília - DF, 70403-900',
        phone: '+55 61 3312 7000',
        email: 'consularBrasilia@state.gov',
        emergency_phone: '+55 61 3312 7000',
        website: 'https://br.usembassy.gov/'
    }
];

// Sample travel alerts
const sampleAlerts = [
    {
        title: 'Travel Advisory: Increased Security Measures',
        message: 'Enhanced security measures are in effect at major airports and tourist areas. Allow extra time for travel and follow instructions from local authorities.',
        severity: 'warning',
        alert_type: 'security'
    },
    {
        title: 'Weather Alert: Severe Storms Expected',
        message: 'Severe thunderstorms with potential flooding are forecast. Monitor local weather reports and avoid unnecessary travel.',
        severity: 'warning',
        alert_type: 'weather'
    },
    {
        title: 'Health Advisory: Vaccination Requirements',
        message: 'New vaccination requirements are now in effect for entry. Ensure you have proper documentation before travel.',
        severity: 'info',
        alert_type: 'health'
    },
    {
        title: 'Critical Security Alert: Avoid All Travel',
        message: 'Due to ongoing civil unrest and security concerns, the State Department recommends avoiding all travel to this region.',
        severity: 'critical',
        alert_type: 'security'
    },
    {
        title: 'Embassy Services Update',
        message: 'Embassy services are temporarily limited due to local holidays. Emergency services remain available 24/7.',
        severity: 'info',
        alert_type: 'embassy'
    }
];

async function seedCountries() {
    logger.info('Seeding countries...');

    for (const country of countries) {
        try {
            await query(`
                INSERT INTO countries (name, code, iso_code, latitude, longitude, risk_level)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (code) DO NOTHING
            `, [country.name, country.code, country.iso_code, country.latitude, country.longitude, country.risk_level]);
        } catch (error) {
            logger.error(`Error inserting country ${country.name}:`, error);
        }
    }

    logger.info(`Seeded ${countries.length} countries`);
}

async function seedEmbassyContacts() {
    logger.info('Seeding embassy contacts...');

    for (const embassy of embassyContacts) {
        try {
            // Get country ID
            const countryResult = await query('SELECT id FROM countries WHERE name = $1', [embassy.country]);
            if (countryResult.rows.length === 0) {
                logger.warn(`Country not found for embassy: ${embassy.country}`);
                continue;
            }

            const countryId = countryResult.rows[0].id;

            await query(`
                INSERT INTO embassy_contacts (country_id, name, address, phone, email, emergency_phone, website)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [countryId, embassy.name, embassy.address, embassy.phone, embassy.email, embassy.emergency_phone, embassy.website]);
        } catch (error) {
            logger.error(`Error inserting embassy contact for ${embassy.country}:`, error);
        }
    }

    logger.info(`Seeded ${embassyContacts.length} embassy contacts`);
}

async function seedAlerts() {
    logger.info('Seeding sample alerts...');

    // Get random countries
    const countriesResult = await query('SELECT id FROM countries ORDER BY RANDOM() LIMIT 10');
    const countryIds = countriesResult.rows.map(row => row.id);

    for (let i = 0; i < sampleAlerts.length; i++) {
        const alert = sampleAlerts[i];
        const countryId = countryIds[i % countryIds.length];

        try {
            await query(`
                INSERT INTO alerts (title, message, severity, alert_type, country_id, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [alert.title, alert.message, alert.severity, alert.alert_type, countryId, 'system']);
        } catch (error) {
            logger.error(`Error inserting alert: ${alert.title}:`, error);
        }
    }

    // Generate some additional random alerts
    const alertTypes = ['travel_advisory', 'weather', 'security', 'health', 'embassy'];
    const severities = ['info', 'warning', 'critical', 'emergency'];

    for (let i = 0; i < 20; i++) {
        const countryId = countryIds[Math.floor(Math.random() * countryIds.length)];
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];

        try {
            await query(`
                INSERT INTO alerts (title, message, severity, alert_type, country_id, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                faker.lorem.sentence(6),
                faker.lorem.paragraph(2),
                severity,
                alertType,
                countryId,
                'system'
            ]);
        } catch (error) {
            logger.error('Error inserting random alert:', error);
        }
    }

    logger.info('Seeded sample alerts');
}

async function seedTestUsers() {
    logger.info('Seeding test users...');

    const bcrypt = require('bcryptjs');
    const testUsers = [
        {
            email: 'demo@stepclone.com',
            password: 'demo123456',
            firstName: 'Demo',
            lastName: 'User',
            phone: '+1234567890'
        },
        {
            email: 'admin@stepclone.com',
            password: 'admin123456',
            firstName: 'Admin',
            lastName: 'User',
            phone: '+1987654321'
        }
    ];

    for (const user of testUsers) {
        try {
            const passwordHash = await bcrypt.hash(user.password, 12);
            const countryResult = await query('SELECT id FROM countries WHERE code = $1', ['US']);
            const countryId = countryResult.rows.length > 0 ? countryResult.rows[0].id : null;

            await query(`
                INSERT INTO users (email, password_hash, first_name, last_name, phone, country_id, is_verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (email) DO NOTHING
            `, [user.email, passwordHash, user.firstName, user.lastName, user.phone, countryId, true]);
        } catch (error) {
            logger.error(`Error inserting test user ${user.email}:`, error);
        }
    }

    logger.info(`Seeded ${testUsers.length} test users`);
}

async function seedTravelPlans() {
    logger.info('Seeding sample travel plans...');

    // Get test users
    const usersResult = await query('SELECT id FROM users LIMIT 5');
    const userIds = usersResult.rows.map(row => row.id);

    if (userIds.length === 0) {
        logger.warn('No users found, skipping travel plans seeding');
        return;
    }

    // Get countries
    const countriesResult = await query('SELECT id FROM countries LIMIT 15');
    const countryIds = countriesResult.rows.map(row => row.id);

    const purposes = ['business', 'tourism', 'study', 'family'];

    for (let i = 0; i < 10; i++) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        const countryId = countryIds[Math.floor(Math.random() * countryIds.length)];
        const purpose = purposes[Math.floor(Math.random() * purposes.length)];

        const departureDate = new Date();
        departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 90)); // 0-90 days in future

        const returnDate = new Date(departureDate);
        returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 14) + 3); // 3-17 days after departure

        try {
            await query(`
                INSERT INTO travel_plans (user_id, destination_country_id, departure_date, return_date, purpose)
                VALUES ($1, $2, $3, $4, $5)
            `, [userId, countryId, departureDate.toISOString().split('T')[0], returnDate.toISOString().split('T')[0], purpose]);
        } catch (error) {
            logger.error('Error inserting travel plan:', error);
        }
    }

    logger.info('Seeded sample travel plans');
}

async function runSeeding() {
    try {
        logger.info('Starting database seeding...');

        await seedCountries();
        await seedEmbassyContacts();
        await seedAlerts();
        await seedTestUsers();
        await seedTravelPlans();

        logger.info('Database seeding completed successfully');

        // Print some useful information
        const stats = await query(`
            SELECT
                (SELECT COUNT(*) FROM countries) as countries,
                (SELECT COUNT(*) FROM embassy_contacts) as embassies,
                (SELECT COUNT(*) FROM alerts) as alerts,
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM travel_plans) as travel_plans
        `);

        logger.info('Database statistics:', stats.rows[0]);

    } catch (error) {
        logger.error('Seeding failed:', error);
        throw error;
    }
}

// Run seeding if this file is executed directly
if (require.main === module) {
    runSeeding()
        .then(() => {
            logger.info('Seeding script completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Seeding script failed:', error);
            process.exit(1);
        });
}

module.exports = { runSeeding };