const RULES = [
  { sector: "Financial Services", category: "Finance", industry: "Banks", terms: ["BANK", "BANKING", "NBFC", "FINANCE", "FINANCIAL", "CREDIT", "CAPITAL", "MONEY", "MICROFINANCE"] },
  { sector: "Financial Services", category: "Finance", industry: "Insurance", terms: ["INSURANCE", "LIFE INSURANCE", "GENERAL INSURANCE"] },
  { sector: "Technology", category: "Information Technology", industry: "IT Services", terms: ["TECH", "TECHNOLOGY", "SOFTWARE", "INFOTECH", "INFO TECH", "SYSTEMS", "DIGITAL", "COMPUTER", "CYBER", "SOFT"] },
  { sector: "Healthcare", category: "Healthcare", industry: "Pharmaceuticals", terms: ["PHARMA", "PHARMACEUTICAL", "DRUG", "LIFE SCIENCE", "BIO", "BIOTECH", "RESEARCH"] },
  { sector: "Healthcare", category: "Healthcare", industry: "Hospitals and Diagnostics", terms: ["HOSPITAL", "HEALTHCARE", "HEALTH CARE", "CLINIC", "DIAGNOSTIC", "MEDICAL"] },
  { sector: "Automobile", category: "Automotive", industry: "Automobiles and Auto Components", terms: ["MOTOR", "MOTORS", "AUTO", "AUTOMOBILE", "TYRE", "TIRES", "TRACTOR", "VEHICLE", "MOBILITY"] },
  { sector: "Materials", category: "Basic Materials", industry: "Metals and Mining", terms: ["STEEL", "METAL", "MINING", "MINE", "ALUMINIUM", "ALUMINUM", "COPPER", "ZINC", "GOLD", "IRON", "ORE"] },
  { sector: "Materials", category: "Basic Materials", industry: "Chemicals", terms: ["CHEMICAL", "CHEM", "FERTILIZER", "FERTILISER", "PETROCHEM", "SPECIALTY"] },
  { sector: "Materials", category: "Basic Materials", industry: "Cement and Construction Materials", terms: ["CEMENT", "CONCRETE", "CERAMIC", "TILE", "GLASS", "MARBLE"] },
  { sector: "Energy", category: "Energy", industry: "Oil, Gas and Fuels", terms: ["OIL", "GAS", "PETROLEUM", "ENERGY", "REFINERY", "POWER", "ELECTRIC", "RENEWABLE", "SOLAR", "WIND"] },
  { sector: "Industrials", category: "Industrials", industry: "Capital Goods and Engineering", terms: ["ENGINEERING", "MACHINE", "INDUSTRIES", "INDUSTRIAL", "EQUIPMENT", "ELECTRICAL", "TECHNOLOGIES", "FABRICATION"] },
  { sector: "Industrials", category: "Industrials", industry: "Construction and Infrastructure", terms: ["CONSTRUCTION", "INFRA", "PROJECTS", "BUILDERS", "BUILDTECH", "ROADS", "TOLL", "STRUCTURE"] },
  { sector: "Consumer Discretionary", category: "Consumer", industry: "Consumer Durables", terms: ["APPLIANCE", "ELECTRONICS", "FURNITURE", "JEWELLERY", "JEWELRY", "RETAIL", "FASHION", "LIFESTYLE"] },
  { sector: "Consumer Staples", category: "Consumer", industry: "Food and Beverages", terms: ["FOOD", "FOODS", "BEVERAGE", "BEVERAGES", "SUGAR", "DAIRY", "FLOUR", "EDIBLE"] },
  { sector: "Consumer Staples", category: "Consumer", industry: "Household and Personal Products", terms: ["TEXTILE", "COTTON", "PAPER", "SOAP", "DETERGENT", "PERSONAL CARE"] },
  { sector: "Telecommunications", category: "Communication Services", industry: "Telecom Services", terms: ["TELECOM", "TELECOMMUNICATION", "COMMUNICATION", "MOBILE", "BROADBAND"] },
  { sector: "Real Estate", category: "Real Estate", industry: "Real Estate Development", terms: ["REALTY", "REAL ESTATE", "PROPERTIES", "PROPERTY", "ESTATE", "DEVELOPERS"] },
  { sector: "Utilities", category: "Utilities", industry: "Utilities", terms: ["UTILITY", "UTILITIES", "WATER", "TRANSMISSION", "DISTRIBUTION"] },
  { sector: "Transportation", category: "Transportation", industry: "Logistics and Transport", terms: ["LOGISTICS", "SHIPPING", "PORT", "AIRPORT", "AIRLINES", "RAIL", "TRANSPORT", "EXPRESS", "CARGO"] },
  { sector: "Media and Entertainment", category: "Communication Services", industry: "Media", terms: ["MEDIA", "ENTERTAINMENT", "BROADCAST", "TELEVISION", "TV", "FILM", "CINEMA"] }
];

const SYMBOL_OVERRIDES = {
  INFY: ["Technology", "Information Technology", "IT Services"],
  TCS: ["Technology", "Information Technology", "IT Services"],
  WIPRO: ["Technology", "Information Technology", "IT Services"],
  HDFCBANK: ["Financial Services", "Finance", "Banks"],
  ICICIBANK: ["Financial Services", "Finance", "Banks"],
  SBIN: ["Financial Services", "Finance", "Banks"],
  RELIANCE: ["Energy", "Energy", "Oil, Gas and Fuels"],
  SUNPHARMA: ["Healthcare", "Healthcare", "Pharmaceuticals"],
  MARUTI: ["Automobile", "Automotive", "Automobiles and Auto Components"]
};

function classifyStock({ symbol = "", company = "" } = {}) {
  const normalizedSymbol = String(symbol).toUpperCase().trim();
  const text = `${normalizedSymbol} ${String(company).toUpperCase()}`;
  const override = SYMBOL_OVERRIDES[normalizedSymbol];
  if (override) return { sector: override[0], category: override[1], industry: override[2], classificationSource: "symbol-override" };

  const rule = RULES.find((candidate) => candidate.terms.some((term) => text.includes(term)));
  if (rule) return { sector: rule.sector, category: rule.category, industry: rule.industry, classificationSource: "company-name-rule" };

  return { sector: "Other", category: "Other", industry: "Unclassified", classificationSource: "fallback" };
}

module.exports = { classifyStock };
