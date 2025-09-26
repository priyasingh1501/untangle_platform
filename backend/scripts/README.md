# Seed Upgrader Scripts

This directory contains scripts for upgrading and managing your meal analysis system's seed data.

## Files

- **`seedUpgrader.js`** - Main script for ingesting, normalizing, and loading food data
- **`testOffApi.js`** - Test script for Open Food Facts API integration
- **`README.md`** - This documentation file

## Features

### Data Sources
- **IFCT CSV** - Indian food composition data
- **USDA API** - American food database (requires API key)
- **Open Food Facts** - Global food database with barcode lookup

### Data Processing
- Ingestion from multiple sources
- Normalization and deduplication
- Quality assurance checks
- Database loading with indexes
- Report generation

## Setup

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/untangle

# API Keys (optional)
USDA_API_KEY=your_usda_api_key_here

# Open Food Facts Configuration
OFF_DISABLE=false  # Set to 'true' to disable OFF ingestion
OFF_BARCODES=8901012000000,8901012000001,8901012000002  # Comma-separated barcodes

# Quality Assurance Settings
SEED_QA_ATWATER_TOLERANCE=30
SEED_QA_PORTION_BANDS={"roti": [35,60], "idli": [80,180]}
```

### 2. Install Dependencies

```bash
cd /Users/priyas/Untangle
npm install
```

### 3. Prepare Seed Data

Ensure you have the required seed data files in the `data/` directory:

- `ifct_seed.csv` - Indian food composition data
- `gi_seed.csv` - Glycemic Index data
- `fodmap_seed.json` - FODMAP classifications
- `nova_rules.json` - NOVA classification rules
- `aliases.json` - Food name aliases
- `portion_norms.json` - Portion size norms

## Usage

### Test Open Food Facts API

```bash
cd scripts
node testOffApi.js
```

This will test the Open Food Facts API integration with a sample barcode.

### Run Full Seed Upgrade

```bash
cd scripts
node seedUpgrader.js
```

This will:
1. Ingest data from all enabled sources
2. Normalize and merge the data
3. Derive additional values (GI, NOVA, FODMAP)
4. Run quality assurance checks
5. Load data to MongoDB
6. Generate reports

### Environment-Specific Runs

```bash
# Disable Open Food Facts
OFF_DISABLE=true node seedUpgrader.js

# Use custom barcodes
OFF_BARCODES=1234567890123,9876543210987 node seedUpgrader.js

# Custom QA tolerance
SEED_QA_ATWATER_TOLERANCE=50 node seedUpgrader.js
```

## Open Food Facts Integration

### How It Works

1. **Barcode Processing**: The script processes a list of barcodes to fetch product data
2. **API Integration**: Uses the Open Food Facts API v2 with proper rate limiting
3. **Data Normalization**: Converts OFF data to your FoodItem schema format
4. **Quality Tracking**: Maintains provenance information for all imported data

### Adding New Barcodes

1. **Environment Variable**:
   ```bash
   OFF_BARCODES=1234567890123,9876543210987,1111111111111
   ```

2. **Code Update**:
   ```javascript
   // In scripts/seedUpgrader.js, update CONFIG.OFF_BARCODES
   OFF_BARCODES: process.env.OFF_BARCODES ? process.env.OFF_BARCODES.split(',') : [
     '1234567890123', // Your product
     '9876543210987', // Another product
     // ... more barcodes
   ]
   ```

### Rate Limiting

The script includes a 200ms delay between API calls to be respectful to the Open Food Facts API. This means:
- 5 requests per second maximum
- Suitable for development and small-scale data ingestion
- For production use, consider implementing more sophisticated rate limiting

## Output

### Database
- Food items loaded into MongoDB
- Indexes created for optimal query performance
- Provenance tracking for all data sources

### Reports
Generated in the `reports/` directory:
- `seed_qa_report.md` - Markdown summary of QA results
- `seed_qa_failures.csv` - CSV list of QA failures

### Console Output
- Real-time progress updates
- Success/failure counts for each data source
- Quality assurance results
- Error details for debugging

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` environment variable
   - Ensure MongoDB is running
   - Verify network connectivity

2. **Open Food Facts API Errors**
   - Check internet connectivity
   - Verify barcode format (13 digits)
   - Check rate limiting compliance

3. **Data Quality Issues**
   - Review QA reports in `reports/` directory
   - Adjust tolerance values in environment variables
   - Check seed data file formats

### Debug Mode

For detailed debugging, you can modify the script to add more logging:

```javascript
// In seedUpgrader.js, add debug logging
console.log('Debug: Raw OFF response:', JSON.stringify(res.data, null, 2));
```

## Next Steps

After running the seed upgrader:

1. **Verify Data**: Check MongoDB for loaded food items
2. **Test API**: Ensure your food search endpoints work
3. **Monitor Quality**: Review QA reports for data issues
4. **Scale Up**: Add more barcodes or data sources as needed

## Contributing

When adding new data sources or features:

1. Follow the existing code structure
2. Add proper error handling
3. Include provenance tracking
4. Update this documentation
5. Add appropriate tests
