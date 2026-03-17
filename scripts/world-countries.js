// Comprehensive world countries data for STEP Clone
// Based on UN member states and other recognized territories
// Total: 195 countries

const worldCountries = [
    // A
    { name: 'Afghanistan', code: 'AF', iso_code: 'AFG', latitude: 33.9391, longitude: 67.7100, risk_level: 'critical' },
    { name: 'Albania', code: 'AL', iso_code: 'ALB', latitude: 41.1533, longitude: 20.1683, risk_level: 'low' },
    { name: 'Algeria', code: 'DZ', iso_code: 'DZA', latitude: 28.0339, longitude: 1.6596, risk_level: 'medium' },
    { name: 'Andorra', code: 'AD', iso_code: 'AND', latitude: 42.5462, longitude: 1.6016, risk_level: 'low' },
    { name: 'Angola', code: 'AO', iso_code: 'AGO', latitude: -11.2027, longitude: 17.8739, risk_level: 'medium' },
    { name: 'Antigua and Barbuda', code: 'AG', iso_code: 'ATG', latitude: 17.0608, longitude: -61.7964, risk_level: 'low' },
    { name: 'Argentina', code: 'AR', iso_code: 'ARG', latitude: -38.4161, longitude: -63.6167, risk_level: 'medium' },
    { name: 'Armenia', code: 'AM', iso_code: 'ARM', latitude: 40.0691, longitude: 45.0382, risk_level: 'medium' },
    { name: 'Australia', code: 'AU', iso_code: 'AUS', latitude: -25.2744, longitude: 133.7751, risk_level: 'low' },
    { name: 'Austria', code: 'AT', iso_code: 'AUT', latitude: 47.5162, longitude: 14.5501, risk_level: 'low' },
    { name: 'Azerbaijan', code: 'AZ', iso_code: 'AZE', latitude: 40.1431, longitude: 47.5769, risk_level: 'medium' },

    // B
    { name: 'Bahamas', code: 'BS', iso_code: 'BHS', latitude: 25.0343, longitude: -77.3963, risk_level: 'low' },
    { name: 'Bahrain', code: 'BH', iso_code: 'BHR', latitude: 25.9304, longitude: 50.6378, risk_level: 'medium' },
    { name: 'Bangladesh', code: 'BD', iso_code: 'BGD', latitude: 23.6850, longitude: 90.3563, risk_level: 'medium' },
    { name: 'Barbados', code: 'BB', iso_code: 'BRB', latitude: 13.1939, longitude: -59.5432, risk_level: 'low' },
    { name: 'Belarus', code: 'BY', iso_code: 'BLR', latitude: 53.7098, longitude: 27.9534, risk_level: 'high' },
    { name: 'Belgium', code: 'BE', iso_code: 'BEL', latitude: 50.5039, longitude: 4.4699, risk_level: 'low' },
    { name: 'Belize', code: 'BZ', iso_code: 'BLZ', latitude: 17.1899, longitude: -88.4976, risk_level: 'medium' },
    { name: 'Benin', code: 'BJ', iso_code: 'BEN', latitude: 9.3077, longitude: 2.3158, risk_level: 'medium' },
    { name: 'Bhutan', code: 'BT', iso_code: 'BTN', latitude: 27.5142, longitude: 90.4336, risk_level: 'low' },
    { name: 'Bolivia', code: 'BO', iso_code: 'BOL', latitude: -16.2902, longitude: -63.5887, risk_level: 'medium' },
    { name: 'Bosnia and Herzegovina', code: 'BA', iso_code: 'BIH', latitude: 43.9159, longitude: 17.6791, risk_level: 'low' },
    { name: 'Botswana', code: 'BW', iso_code: 'BWA', latitude: -22.3285, longitude: 24.6849, risk_level: 'low' },
    { name: 'Brazil', code: 'BR', iso_code: 'BRA', latitude: -14.2350, longitude: -51.9253, risk_level: 'medium' },
    { name: 'Brunei', code: 'BN', iso_code: 'BRN', latitude: 4.5353, longitude: 114.7277, risk_level: 'low' },
    { name: 'Bulgaria', code: 'BG', iso_code: 'BGR', latitude: 42.7339, longitude: 25.4858, risk_level: 'low' },
    { name: 'Burkina Faso', code: 'BF', iso_code: 'BFA', latitude: 12.2383, longitude: -1.5616, risk_level: 'high' },
    { name: 'Burundi', code: 'BI', iso_code: 'BDI', latitude: -3.3731, longitude: 29.9189, risk_level: 'high' },

    // C
    { name: 'Cabo Verde', code: 'CV', iso_code: 'CPV', latitude: 16.5388, longitude: -24.0132, risk_level: 'low' },
    { name: 'Cambodia', code: 'KH', iso_code: 'KHM', latitude: 12.5657, longitude: 104.9910, risk_level: 'medium' },
    { name: 'Cameroon', code: 'CM', iso_code: 'CMR', latitude: 7.3697, longitude: 12.3547, risk_level: 'high' },
    { name: 'Canada', code: 'CA', iso_code: 'CAN', latitude: 56.1304, longitude: -106.3468, risk_level: 'low' },
    { name: 'Central African Republic', code: 'CF', iso_code: 'CAF', latitude: 6.6111, longitude: 20.9394, risk_level: 'critical' },
    { name: 'Chad', code: 'TD', iso_code: 'TCD', latitude: 15.4542, longitude: 18.7322, risk_level: 'high' },
    { name: 'Chile', code: 'CL', iso_code: 'CHL', latitude: -35.6751, longitude: -71.5430, risk_level: 'low' },
    { name: 'China', code: 'CN', iso_code: 'CHN', latitude: 35.8617, longitude: 104.1954, risk_level: 'medium' },
    { name: 'Colombia', code: 'CO', iso_code: 'COL', latitude: 4.5709, longitude: -74.2973, risk_level: 'medium' },
    { name: 'Comoros', code: 'KM', iso_code: 'COM', latitude: -11.6455, longitude: 43.3333, risk_level: 'medium' },
    { name: 'Congo', code: 'CG', iso_code: 'COG', latitude: -0.2280, longitude: 15.8277, risk_level: 'medium' },
    { name: 'Costa Rica', code: 'CR', iso_code: 'CRI', latitude: 9.7489, longitude: -83.7534, risk_level: 'low' },
    { name: 'Croatia', code: 'HR', iso_code: 'HRV', latitude: 45.1000, longitude: 15.2000, risk_level: 'low' },
    { name: 'Cuba', code: 'CU', iso_code: 'CUB', latitude: 21.5218, longitude: -77.7812, risk_level: 'medium' },
    { name: 'Cyprus', code: 'CY', iso_code: 'CYP', latitude: 35.1264, longitude: 33.4299, risk_level: 'low' },
    { name: 'Czech Republic', code: 'CZ', iso_code: 'CZE', latitude: 49.8175, longitude: 15.4730, risk_level: 'low' },

    // D
    { name: 'Democratic Republic of the Congo', code: 'CD', iso_code: 'COD', latitude: -4.0383, longitude: 21.7587, risk_level: 'high' },
    { name: 'Denmark', code: 'DK', iso_code: 'DNK', latitude: 56.2639, longitude: 9.5018, risk_level: 'low' },
    { name: 'Djibouti', code: 'DJ', iso_code: 'DJI', latitude: 11.8251, longitude: 42.5903, risk_level: 'medium' },
    { name: 'Dominica', code: 'DM', iso_code: 'DMA', latitude: 15.4150, longitude: -61.3710, risk_level: 'low' },
    { name: 'Dominican Republic', code: 'DO', iso_code: 'DOM', latitude: 18.7357, longitude: -70.1627, risk_level: 'medium' },

    // E
    { name: 'Ecuador', code: 'EC', iso_code: 'ECU', latitude: -1.8312, longitude: -78.1834, risk_level: 'medium' },
    { name: 'Egypt', code: 'EG', iso_code: 'EGY', latitude: 26.0975, longitude: 31.2357, risk_level: 'medium' },
    { name: 'El Salvador', code: 'SV', iso_code: 'SLV', latitude: 13.7942, longitude: -88.8965, risk_level: 'medium' },
    { name: 'Equatorial Guinea', code: 'GQ', iso_code: 'GNQ', latitude: 1.6508, longitude: 10.2679, risk_level: 'medium' },
    { name: 'Eritrea', code: 'ER', iso_code: 'ERI', latitude: 15.1794, longitude: 39.7823, risk_level: 'high' },
    { name: 'Estonia', code: 'EE', iso_code: 'EST', latitude: 58.5953, longitude: 25.0136, risk_level: 'low' },
    { name: 'Eswatini', code: 'SZ', iso_code: 'SWZ', latitude: -26.5225, longitude: 31.4659, risk_level: 'low' },
    { name: 'Ethiopia', code: 'ET', iso_code: 'ETH', latitude: 9.1450, longitude: 40.4897, risk_level: 'high' },

    // F
    { name: 'Fiji', code: 'FJ', iso_code: 'FJI', latitude: -16.7784, longitude: 179.4144, risk_level: 'low' },
    { name: 'Finland', code: 'FI', iso_code: 'FIN', latitude: 61.9241, longitude: 25.7482, risk_level: 'low' },
    { name: 'France', code: 'FR', iso_code: 'FRA', latitude: 46.2276, longitude: 2.2137, risk_level: 'low' },

    // G
    { name: 'Gabon', code: 'GA', iso_code: 'GAB', latitude: -0.8037, longitude: 11.6094, risk_level: 'medium' },
    { name: 'Gambia', code: 'GM', iso_code: 'GMB', latitude: 13.4432, longitude: -15.3101, risk_level: 'medium' },
    { name: 'Georgia', code: 'GE', iso_code: 'GEO', latitude: 42.3154, longitude: 43.3569, risk_level: 'low' },
    { name: 'Germany', code: 'DE', iso_code: 'DEU', latitude: 51.1657, longitude: 10.4515, risk_level: 'low' },
    { name: 'Ghana', code: 'GH', iso_code: 'GHA', latitude: 7.9465, longitude: -1.0232, risk_level: 'low' },
    { name: 'Greece', code: 'GR', iso_code: 'GRC', latitude: 39.0742, longitude: 21.8243, risk_level: 'low' },
    { name: 'Grenada', code: 'GD', iso_code: 'GRD', latitude: 12.1165, longitude: -61.6790, risk_level: 'low' },
    { name: 'Guatemala', code: 'GT', iso_code: 'GTM', latitude: 15.7835, longitude: -90.2308, risk_level: 'medium' },
    { name: 'Guinea', code: 'GN', iso_code: 'GIN', latitude: 9.9456, longitude: -9.6966, risk_level: 'medium' },
    { name: 'Guinea-Bissau', code: 'GW', iso_code: 'GNB', latitude: 11.8037, longitude: -15.1804, risk_level: 'medium' },
    { name: 'Guyana', code: 'GY', iso_code: 'GUY', latitude: 4.8604, longitude: -58.9302, risk_level: 'medium' },

    // H
    { name: 'Haiti', code: 'HT', iso_code: 'HTI', latitude: 18.9712, longitude: -72.2852, risk_level: 'critical' },
    { name: 'Honduras', code: 'HN', iso_code: 'HND', latitude: 15.2000, longitude: -86.2419, risk_level: 'high' },
    { name: 'Hungary', code: 'HU', iso_code: 'HUN', latitude: 47.1625, longitude: 19.5033, risk_level: 'low' },

    // I
    { name: 'Iceland', code: 'IS', iso_code: 'ISL', latitude: 64.9631, longitude: -19.0208, risk_level: 'low' },
    { name: 'India', code: 'IN', iso_code: 'IND', latitude: 20.5937, longitude: 78.9629, risk_level: 'medium' },
    { name: 'Indonesia', code: 'ID', iso_code: 'IDN', latitude: -0.7893, longitude: 113.9213, risk_level: 'medium' },
    { name: 'Iran', code: 'IR', iso_code: 'IRN', latitude: 32.4279, longitude: 53.6880, risk_level: 'high' },
    { name: 'Iraq', code: 'IQ', iso_code: 'IRQ', latitude: 33.2232, longitude: 43.6793, risk_level: 'critical' },
    { name: 'Ireland', code: 'IE', iso_code: 'IRL', latitude: 53.4129, longitude: -8.2439, risk_level: 'low' },
    { name: 'Israel', code: 'IL', iso_code: 'ISR', latitude: 31.0461, longitude: 34.8516, risk_level: 'medium' },
    { name: 'Italy', code: 'IT', iso_code: 'ITA', latitude: 41.8719, longitude: 12.5674, risk_level: 'low' },
    { name: 'Ivory Coast', code: 'CI', iso_code: 'CIV', latitude: 7.5400, longitude: -5.5471, risk_level: 'medium' },

    // J
    { name: 'Jamaica', code: 'JM', iso_code: 'JAM', latitude: 18.1096, longitude: -77.2975, risk_level: 'medium' },
    { name: 'Japan', code: 'JP', iso_code: 'JPN', latitude: 36.2048, longitude: 138.2529, risk_level: 'low' },
    { name: 'Jordan', code: 'JO', iso_code: 'JOR', latitude: 30.5852, longitude: 36.2384, risk_level: 'medium' },

    // K
    { name: 'Kazakhstan', code: 'KZ', iso_code: 'KAZ', latitude: 48.0196, longitude: 66.9237, risk_level: 'medium' },
    { name: 'Kenya', code: 'KE', iso_code: 'KEN', latitude: -0.0236, longitude: 37.9062, risk_level: 'medium' },
    { name: 'Kiribati', code: 'KI', iso_code: 'KIR', latitude: -3.3704, longitude: -168.7340, risk_level: 'low' },
    { name: 'Kuwait', code: 'KW', iso_code: 'KWT', latitude: 29.3117, longitude: 47.4818, risk_level: 'medium' },
    { name: 'Kyrgyzstan', code: 'KG', iso_code: 'KGZ', latitude: 41.2044, longitude: 74.7661, risk_level: 'medium' },

    // L
    { name: 'Laos', code: 'LA', iso_code: 'LAO', latitude: 19.8563, longitude: 102.4955, risk_level: 'medium' },
    { name: 'Latvia', code: 'LV', iso_code: 'LVA', latitude: 56.8796, longitude: 24.6032, risk_level: 'low' },
    { name: 'Lebanon', code: 'LB', iso_code: 'LBN', latitude: 33.8547, longitude: 35.8623, risk_level: 'high' },
    { name: 'Lesotho', code: 'LS', iso_code: 'LSO', latitude: -29.6100, longitude: 28.2336, risk_level: 'low' },
    { name: 'Liberia', code: 'LR', iso_code: 'LBR', latitude: 6.4281, longitude: -9.4295, risk_level: 'medium' },
    { name: 'Libya', code: 'LY', iso_code: 'LBY', latitude: 26.3351, longitude: 17.2283, risk_level: 'critical' },
    { name: 'Liechtenstein', code: 'LI', iso_code: 'LIE', latitude: 47.1660, longitude: 9.5554, risk_level: 'low' },
    { name: 'Lithuania', code: 'LT', iso_code: 'LTU', latitude: 55.1694, longitude: 23.8813, risk_level: 'low' },
    { name: 'Luxembourg', code: 'LU', iso_code: 'LUX', latitude: 49.8153, longitude: 6.1296, risk_level: 'low' },

    // M
    { name: 'Madagascar', code: 'MG', iso_code: 'MDG', latitude: -18.7669, longitude: 46.8691, risk_level: 'medium' },
    { name: 'Malawi', code: 'MW', iso_code: 'MWI', latitude: -13.2543, longitude: 34.3015, risk_level: 'low' },
    { name: 'Malaysia', code: 'MY', iso_code: 'MYS', latitude: 4.2105, longitude: 101.9758, risk_level: 'low' },
    { name: 'Maldives', code: 'MV', iso_code: 'MDV', latitude: 3.2028, longitude: 73.2207, risk_level: 'low' },
    { name: 'Mali', code: 'ML', iso_code: 'MLI', latitude: 17.5707, longitude: -3.9962, risk_level: 'high' },
    { name: 'Malta', code: 'MT', iso_code: 'MLT', latitude: 35.9375, longitude: 14.3754, risk_level: 'low' },
    { name: 'Marshall Islands', code: 'MH', iso_code: 'MHL', latitude: 7.1315, longitude: 171.1845, risk_level: 'low' },
    { name: 'Mauritania', code: 'MR', iso_code: 'MRT', latitude: 21.0079, longitude: -10.9408, risk_level: 'medium' },
    { name: 'Mauritius', code: 'MU', iso_code: 'MUS', latitude: -20.3484, longitude: 57.5522, risk_level: 'low' },
    { name: 'Mexico', code: 'MX', iso_code: 'MEX', latitude: 23.6345, longitude: -102.5528, risk_level: 'medium' },
    { name: 'Micronesia', code: 'FM', iso_code: 'FSM', latitude: 7.4256, longitude: 150.5508, risk_level: 'low' },
    { name: 'Moldova', code: 'MD', iso_code: 'MDA', latitude: 47.4116, longitude: 28.3699, risk_level: 'medium' },
    { name: 'Monaco', code: 'MC', iso_code: 'MCO', latitude: 43.7384, longitude: 7.4246, risk_level: 'low' },
    { name: 'Mongolia', code: 'MN', iso_code: 'MNG', latitude: 46.8625, longitude: 103.8467, risk_level: 'low' },
    { name: 'Montenegro', code: 'ME', iso_code: 'MNE', latitude: 42.7087, longitude: 19.3744, risk_level: 'low' },
    { name: 'Morocco', code: 'MA', iso_code: 'MAR', latitude: 31.7917, longitude: -7.0926, risk_level: 'low' },
    { name: 'Mozambique', code: 'MZ', iso_code: 'MOZ', latitude: -18.6657, longitude: 35.5296, risk_level: 'medium' },
    { name: 'Myanmar', code: 'MM', iso_code: 'MMR', latitude: 21.9162, longitude: 95.9560, risk_level: 'critical' },

    // N
    { name: 'Namibia', code: 'NA', iso_code: 'NAM', latitude: -22.9576, longitude: 18.4904, risk_level: 'low' },
    { name: 'Nauru', code: 'NR', iso_code: 'NRU', latitude: -0.5228, longitude: 166.9315, risk_level: 'low' },
    { name: 'Nepal', code: 'NP', iso_code: 'NPL', latitude: 28.3949, longitude: 84.1240, risk_level: 'medium' },
    { name: 'Netherlands', code: 'NL', iso_code: 'NLD', latitude: 52.1326, longitude: 5.2913, risk_level: 'low' },
    { name: 'New Zealand', code: 'NZ', iso_code: 'NZL', latitude: -40.9006, longitude: 174.8860, risk_level: 'low' },
    { name: 'Nicaragua', code: 'NI', iso_code: 'NIC', latitude: 12.2652, longitude: -85.2072, risk_level: 'medium' },
    { name: 'Niger', code: 'NE', iso_code: 'NER', latitude: 17.6078, longitude: 8.0817, risk_level: 'high' },
    { name: 'Nigeria', code: 'NG', iso_code: 'NGA', latitude: 9.0820, longitude: 8.6753, risk_level: 'high' },
    { name: 'North Korea', code: 'KP', iso_code: 'PRK', latitude: 40.3399, longitude: 127.5101, risk_level: 'critical' },
    { name: 'North Macedonia', code: 'MK', iso_code: 'MKD', latitude: 41.6086, longitude: 21.7453, risk_level: 'low' },
    { name: 'Norway', code: 'NO', iso_code: 'NOR', latitude: 60.4720, longitude: 8.4689, risk_level: 'low' },

    // O
    { name: 'Oman', code: 'OM', iso_code: 'OMN', latitude: 21.4735, longitude: 55.9754, risk_level: 'low' },

    // P
    { name: 'Pakistan', code: 'PK', iso_code: 'PAK', latitude: 30.3753, longitude: 69.3451, risk_level: 'high' },
    { name: 'Palau', code: 'PW', iso_code: 'PLW', latitude: 7.5150, longitude: 134.5825, risk_level: 'low' },
    { name: 'Panama', code: 'PA', iso_code: 'PAN', latitude: 8.5380, longitude: -80.7821, risk_level: 'low' },
    { name: 'Papua New Guinea', code: 'PG', iso_code: 'PNG', latitude: -6.3150, longitude: 143.9555, risk_level: 'medium' },
    { name: 'Paraguay', code: 'PY', iso_code: 'PRY', latitude: -23.4425, longitude: -58.4438, risk_level: 'low' },
    { name: 'Peru', code: 'PE', iso_code: 'PER', latitude: -9.1900, longitude: -75.0152, risk_level: 'medium' },
    { name: 'Philippines', code: 'PH', iso_code: 'PHL', latitude: 12.8797, longitude: 121.7740, risk_level: 'medium' },
    { name: 'Poland', code: 'PL', iso_code: 'POL', latitude: 51.9194, longitude: 19.1451, risk_level: 'low' },
    { name: 'Portugal', code: 'PT', iso_code: 'PRT', latitude: 39.3999, longitude: -8.2245, risk_level: 'low' },

    // Q
    { name: 'Qatar', code: 'QA', iso_code: 'QAT', latitude: 25.3548, longitude: 51.1839, risk_level: 'low' },

    // R
    { name: 'Romania', code: 'RO', iso_code: 'ROU', latitude: 45.9432, longitude: 24.9668, risk_level: 'low' },
    { name: 'Russia', code: 'RU', iso_code: 'RUS', latitude: 61.5240, longitude: 105.3188, risk_level: 'high' },
    { name: 'Rwanda', code: 'RW', iso_code: 'RWA', latitude: -1.9403, longitude: 29.8739, risk_level: 'low' },

    // S
    { name: 'Saint Kitts and Nevis', code: 'KN', iso_code: 'KNA', latitude: 17.3578, longitude: -62.7830, risk_level: 'low' },
    { name: 'Saint Lucia', code: 'LC', iso_code: 'LCA', latitude: 13.9094, longitude: -60.9789, risk_level: 'low' },
    { name: 'Saint Vincent and the Grenadines', code: 'VC', iso_code: 'VCT', latitude: 12.9843, longitude: -61.2872, risk_level: 'low' },
    { name: 'Samoa', code: 'WS', iso_code: 'WSM', latitude: -13.7590, longitude: -172.1046, risk_level: 'low' },
    { name: 'San Marino', code: 'SM', iso_code: 'SMR', latitude: 43.9424, longitude: 12.4578, risk_level: 'low' },
    { name: 'Sao Tome and Principe', code: 'ST', iso_code: 'STP', latitude: 0.1864, longitude: 6.6131, risk_level: 'low' },
    { name: 'Saudi Arabia', code: 'SA', iso_code: 'SAU', latitude: 23.8859, longitude: 45.0792, risk_level: 'medium' },
    { name: 'Senegal', code: 'SN', iso_code: 'SEN', latitude: 14.4974, longitude: -14.4524, risk_level: 'low' },
    { name: 'Serbia', code: 'RS', iso_code: 'SRB', latitude: 44.0165, longitude: 21.0059, risk_level: 'low' },
    { name: 'Seychelles', code: 'SC', iso_code: 'SYC', latitude: -4.6796, longitude: 55.4920, risk_level: 'low' },
    { name: 'Sierra Leone', code: 'SL', iso_code: 'SLE', latitude: 8.4606, longitude: -11.7799, risk_level: 'medium' },
    { name: 'Singapore', code: 'SG', iso_code: 'SGP', latitude: 1.3521, longitude: 103.8198, risk_level: 'low' },
    { name: 'Slovakia', code: 'SK', iso_code: 'SVK', latitude: 48.6690, longitude: 19.6990, risk_level: 'low' },
    { name: 'Slovenia', code: 'SI', iso_code: 'SVN', latitude: 46.1512, longitude: 14.9955, risk_level: 'low' },
    { name: 'Solomon Islands', code: 'SB', iso_code: 'SLB', latitude: -9.6457, longitude: 160.1562, risk_level: 'low' },
    { name: 'Somalia', code: 'SO', iso_code: 'SOM', latitude: 5.1521, longitude: 46.1996, risk_level: 'critical' },
    { name: 'South Africa', code: 'ZA', iso_code: 'ZAF', latitude: -30.5595, longitude: 22.9375, risk_level: 'medium' },
    { name: 'South Korea', code: 'KR', iso_code: 'KOR', latitude: 35.9078, longitude: 127.7669, risk_level: 'low' },
    { name: 'South Sudan', code: 'SS', iso_code: 'SSD', latitude: 6.8770, longitude: 31.3070, risk_level: 'critical' },
    { name: 'Spain', code: 'ES', iso_code: 'ESP', latitude: 40.4637, longitude: -3.7492, risk_level: 'low' },
    { name: 'Sri Lanka', code: 'LK', iso_code: 'LKA', latitude: 7.8731, longitude: 80.7718, risk_level: 'medium' },
    { name: 'Sudan', code: 'SD', iso_code: 'SDN', latitude: 12.8628, longitude: 30.2176, risk_level: 'critical' },
    { name: 'Suriname', code: 'SR', iso_code: 'SUR', latitude: 3.9193, longitude: -56.0278, risk_level: 'low' },
    { name: 'Sweden', code: 'SE', iso_code: 'SWE', latitude: 60.1282, longitude: 18.6435, risk_level: 'low' },
    { name: 'Switzerland', code: 'CH', iso_code: 'CHE', latitude: 46.8182, longitude: 8.2275, risk_level: 'low' },
    { name: 'Syria', code: 'SY', iso_code: 'SYR', latitude: 34.8021, longitude: 38.9968, risk_level: 'critical' },

    // T
    { name: 'Taiwan', code: 'TW', iso_code: 'TWN', latitude: 23.6978, longitude: 120.9605, risk_level: 'low' },
    { name: 'Tajikistan', code: 'TJ', iso_code: 'TJK', latitude: 38.8610, longitude: 71.2761, risk_level: 'medium' },
    { name: 'Tanzania', code: 'TZ', iso_code: 'TZA', latitude: -6.3690, longitude: 34.8888, risk_level: 'low' },
    { name: 'Thailand', code: 'TH', iso_code: 'THA', latitude: 15.8700, longitude: 100.9925, risk_level: 'medium' },
    { name: 'Timor-Leste', code: 'TL', iso_code: 'TLS', latitude: -8.8742, longitude: 125.7275, risk_level: 'low' },
    { name: 'Togo', code: 'TG', iso_code: 'TGO', latitude: 8.6195, longitude: 0.8248, risk_level: 'medium' },
    { name: 'Tonga', code: 'TO', iso_code: 'TON', latitude: -21.1789, longitude: -175.1982, risk_level: 'low' },
    { name: 'Trinidad and Tobago', code: 'TT', iso_code: 'TTO', latitude: 10.6918, longitude: -61.2225, risk_level: 'medium' },
    { name: 'Tunisia', code: 'TN', iso_code: 'TUN', latitude: 33.8869, longitude: 9.5375, risk_level: 'medium' },
    { name: 'Turkey', code: 'TR', iso_code: 'TUR', latitude: 38.9637, longitude: 35.2433, risk_level: 'medium' },
    { name: 'Turkmenistan', code: 'TM', iso_code: 'TKM', latitude: 38.9697, longitude: 59.5563, risk_level: 'medium' },
    { name: 'Tuvalu', code: 'TV', iso_code: 'TUV', latitude: -7.1095, longitude: 177.6493, risk_level: 'low' },

    // U
    { name: 'Uganda', code: 'UG', iso_code: 'UGA', latitude: 1.3733, longitude: 32.2903, risk_level: 'medium' },
    { name: 'Ukraine', code: 'UA', iso_code: 'UKR', latitude: 48.3794, longitude: 31.1656, risk_level: 'critical' },
    { name: 'United Arab Emirates', code: 'AE', iso_code: 'ARE', latitude: 23.4241, longitude: 53.8478, risk_level: 'low' },
    { name: 'United Kingdom', code: 'GB', iso_code: 'GBR', latitude: 55.3781, longitude: -3.4360, risk_level: 'low' },
    { name: 'United States', code: 'US', iso_code: 'USA', latitude: 39.8283, longitude: -98.5795, risk_level: 'low' },
    { name: 'Uruguay', code: 'UY', iso_code: 'URY', latitude: -32.5228, longitude: -55.7658, risk_level: 'low' },
    { name: 'Uzbekistan', code: 'UZ', iso_code: 'UZB', latitude: 41.3775, longitude: 64.5853, risk_level: 'medium' },

    // V
    { name: 'Vanuatu', code: 'VU', iso_code: 'VUT', latitude: -15.3767, longitude: 166.9592, risk_level: 'low' },
    { name: 'Vatican City', code: 'VA', iso_code: 'VAT', latitude: 41.9029, longitude: 12.4534, risk_level: 'low' },
    { name: 'Venezuela', code: 'VE', iso_code: 'VEN', latitude: 6.4238, longitude: -66.5897, risk_level: 'high' },
    { name: 'Vietnam', code: 'VN', iso_code: 'VNM', latitude: 14.0583, longitude: 108.2772, risk_level: 'low' },

    // Y
    { name: 'Yemen', code: 'YE', iso_code: 'YEM', latitude: 15.5527, longitude: 48.5164, risk_level: 'critical' },

    // Z
    { name: 'Zambia', code: 'ZM', iso_code: 'ZMB', latitude: -13.1339, longitude: 27.8493, risk_level: 'low' },
    { name: 'Zimbabwe', code: 'ZW', iso_code: 'ZWE', latitude: -19.0154, longitude: 29.1549, risk_level: 'medium' }
];

module.exports = worldCountries;