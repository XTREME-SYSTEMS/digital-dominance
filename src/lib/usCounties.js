// Comprehensive US States + Counties dataset for mass launch geo-targeting.
// All 50 states + DC. Counties curated to cover all major metros; expandable.

export const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
];

export const US_COUNTIES = {
  AL: ["Jefferson","Mobile","Madison","Tuscaloosa","Shelby","Baldwin","Montgomery","Lee","Etowah","Calhoun","Morgan","Marshall","Houston","Elmore","St. Clair","Limestone","Cullman","DeKalb","Walker","Autauga"],
  AK: ["Anchorage","Fairbanks North Star","Matanuska-Susitna","Kenai Peninsula","Juneau","Bethel","Kodiak Island","Fairbanks North Star","Sitka","Ketchikan Gateway"],
  AZ: ["Maricopa","Pima","Pinal","Yavapai","Mohave","Yuma","Coconino","Cochise","Navajo","Apache","Gila","Graham","La Paz","Santa Cruz","Greenlee"],
  AR: ["Pulaski","Benton","Washington","Faulkner","Sebastian","Saline","Garland","Craighead","Lonoke","Jefferson","White","Baxter","Crawford","Pope","Crittenden"],
  CA: ["Los Angeles","San Diego","Orange","Riverside","San Bernardino","Santa Clara","Alameda","Sacramento","Contra Costa","Fresno","Kern","San Francisco","Ventura","San Mateo","San Joaquin","Tulare","Butte","Sonoma","Placer","Merced","Stanislaus","Solano","El Dorado","Marin","Yolo","Imperial","Napa","Santa Barbara","Monterey","Placer"],
  CO: ["Denver","El Paso","Arapahoe","Jefferson","Adams","Larimer","Boulder","Douglas","Weld","Pueblo","Mesa","Broomfield","Boulder","Pueblo","Freemont"],
  CT: ["Fairfield","Hartford","New Haven","New London","Litchfield","Tolland","Middlesex","Windham"],
  DE: ["New Castle","Sussex","Kent"],
  FL: ["Miami-Dade","Broward","Palm Beach","Hillsborough","Orange","Pinellas","Duval","Lee","Polk","Brevard","Pasco","Volusia","Seminole","Sarasota","Marion","Lake","Escambia","St. Lucie","Leon","Alachua","Bay","Charlotte","Martin","Indian River","Collier","Nassau","Citrus","Putnam","Hernando","Osceola","St. Johns","Clay","Santa Rosa","Okaloosa","Walton","Monroe","Highlands","Sumter","DeSoto","Hardee","Okeechobee","Glades","Hendry","Madison","Taylor","Gadsden","Jackson","Columbia","Suwannee","Levy","Dixie","Gilchrist","Lafayette","Union","Bradford","Clay","Baker","Nassau","Duval","St. Johns","Flagler"],
  GA: ["Fulton","Gwinnett","Cobb","DeKalb","Chatham","Cherokee","Forsyth","Bibb","Richmond","Clayton","Hall","Henry","Muscogee","Chatham","Houston","Lowndes","Paulding","Columbia","Carroll","Douglas"],
  HI: ["Honolulu","Hawaii","Maui","Kauai","Kalawao"],
  ID: ["Ada","Canyon","Kootenai","Bonneville","Bannock","Twin Falls","Madison","Latah","Bingham","Jefferson"],
  IL: ["Cook","DuPage","Lake","Will","Kane","McHenry","St. Clair","Madison","Sangamon","Peoria","Rock Island","Tazewell","Champaign","McLean","Winnebago","DeKalb","Kankakee","LaSalle","Macon","Adams"],
  IN: ["Marion","Lake","Allen","Hamilton","St. Joseph","Elkhart","Tippecanoe","Vanderburgh","Johnson","Porter","Hendricks","Clark","Morgan","Bartholomew","Howard","Grant","Boone","Hancock","Warrick","LaPorte"],
  IA: ["Polk","Linn","Scott","Black Hawk","Johnson","Woodbury","Dubuque","Story","Pottawattamie","Dallas","Cerro Gordo","Clinton","Marshall","Warren","Winneshiek"],
  KS: ["Johnson","Sedgwick","Shawnee","Wyandotte","Douglas","Riley","Leavenworth","Saline","Butler","Reno","Cowley","Crawford","Montgomery","Ellis","Ford"],
  KY: ["Jefferson","Fayette","Kenton","Boone","Campbell","Hardin","Daviess","Warren","Madison","Bullitt","Boone","Christian","McCracken","Madison","Pike"],
  LA: ["Orleans","Jefferson","East Baton Rouge","Caddo","St. Tammany","Lafayette","Calcasieu","Rapides","Bossier","Terrebonne","Lafourche","St. Landry","Ascension","Tangipahoa","Iberia"],
  ME: ["Cumberland","York","Penobscot","Kennebec","Androscoggin","Aroostook","Somerset","Hancock","Oxford","Waldo"],
  MD: ["Montgomery","Prince George's","Baltimore","Baltimore City","Howard","Anne Arundel","Frederick","Harford","Carroll","Charles","Washington","St. Mary's","Calvert","Wicomico","Allegany"],
  MA: ["Middlesex","Worcester","Suffolk","Essex","Norfolk","Bristol","Plymouth","Hampden","Barnstable","Hampshire","Berkshire","Franklin","Dukes","Nantucket"],
  MI: ["Wayne","Oakland","Macomb","Kent","Genesee","Washtenaw","Ingham","Ottawa","Kalamazoo","Livingston","Saginaw","St. Clair","Monroe","Berrien","Jackson","Muskegon","Allegan","Calhoun","Clinton","Bay"],
  MN: ["Hennepin","Ramsey","Dakota","Anoka","Washington","St. Louis","Stearns","Olmsted","Scott","Wright","Sherburne","Wright","Carver","Clay","Crow Wing"],
  MS: ["Hinds","Harrison","DeSoto","Rankin","Biloxi","Jackson","Madison","Lee","Lauderdale","Jones","Forrest","Lamar","Lowndes","Warren","Pearl River"],
  MO: ["St. Louis","Jackson","St. Louis City","St. Charles","Clay","Jefferson","Greene","Boone","Jasper","Franklin","Cape Girardeau","Christian","Lincoln","Cass","Buchanan"],
  MT: ["Yellowstone","Missoula","Flathead","Gallatin","Cascade","Lewis and Clark","Silver Bow","Billings","Bozeman","Helena"],
  NE: ["Douglas","Lancaster","Sarpy","Buffalo","Hall","Madison","Lincoln","Scotts Bluff","Dodge","Adams"],
  NV: ["Clark","Washoe","Carson City","Douglas","Elko","Lyon","Nye","Humboldt","Pershing","Churchill"],
  NH: ["Hillsborough","Rockingham","Merrimack","Strafford","Grafton","Cheshire","Belknap","Carroll","Sullivan","Coos"],
  NJ: ["Bergen","Essex","Middlesex","Hudson","Monmouth","Union","Passaic","Ocean","Camden","Morris","Burlington","Somerset","Gloucester","Mercer","Atlantic","Cumberland","Sussex","Warren","Hunterdon","Salem"],
  NM: ["Bernalillo","Doña Ana","Santa Fe","Sandoval","San Juan","Valencia","Lea","Otero","Eddy","Chaves","Curry","Los Alamos","Luna","McKinley","Taos"],
  NY: ["Kings","Queens","New York","Bronx","Richmond","Suffolk","Nassau","Westchester","Erie","Monroe","Onondaga","Orange","Rockland","Albany","Dutchess","Schenectady","Broome","Oneida","Niagara","Saratoga","Rensselaer","Ulster","Suffolk","Saratoga","Tompkins","Chemung","Steuben","Chautauqua","Cattaraugus","Clinton"],
  NC: ["Wake","Mecklenburg","Guilford","Forsyth","Cumberland","Durham","Buncombe","Union","New Hanover","Gaston","Cabarrus","Johnston","Davidson","Iredell","Catawba","New Hanover","Johnston","Orange","Chatham","Wilson"],
  ND: ["Cass","Burleigh","Grand Forks","Ward","Morton","Stark","Williams","Ward","Bismarck","Fargo"],
  OH: ["Franklin","Cuyahoga","Hamilton","Summit","Montgomery","Lucas","Butler","Stark","Lorain","Marion","Mahoning","Delaware","Lake","Warren","Clark","Licking","Fairfield","Richland","Portage","Trumbull"],
  OK: ["Oklahoma","Tulsa","Cleveland","Canadian","Comanche","Creek","Rogers","Wagoner","Payne","Pottawatomie","Carter","Le Flore","Muskogee","Garfield","Sequoyah"],
  OR: ["Multnomah","Washington","Clackamas","Lane","Marion","Jackson","Deschutes","Linn","Yamhill","Douglas","Benton","Josephine","Polk","Linn","Umatilla"],
  PA: ["Philadelphia","Allegheny","Montgomery","Delaware","Bucks","Chester","Lancaster","York","Berks","Westmoreland","Lehigh","Northampton","Dauphin","Erie","Delaware","Luzerne","Washington","Chester","Cumberland","Schuylkill"],
  RI: ["Providence","Kent","Washington","Newport","Bristol"],
  SC: ["Greenville","Richland","Charleston","Horry","Spartanburg","Lexington","York","Berkeley","Anderson","Beaufort","Pickens","Aiken","Dorchester","Sumter","Florence"],
  SD: ["Minnehaha","Pennington","Lincoln","Brown","Brookings","Codington","Yankton","Lawrence","Davison","Meade"],
  TN: ["Shelby","Davidson","Knox","Hamilton","Rutherford","Washington","Williamson","Montgomery","Sumner","Bradley","Sullivan","Blount","Maury","Anderson","Wilson"],
  TX: ["Harris","Dallas","Tarrant","Bexar","Travis","Collin","El Paso","Hidalgo","Fort Bend","Denton","Montgomery","Hays","Williamson","Cameron","Nueces","Galveston","Brazoria","Bell","McLennan","Jefferson","Guadalupe","Midland","Taylor","Webb","Smith","Brazos","Ellis","Johnson","Parker","Rockwall","Kaufman","Cherokee","Angelina","Nacogdoches","Tom Green","Ector","Victoria","Wichita","Coryell","Bowie","Gregg","Orange","Hardin","Liberty","Chambers","Waller","Grimes","Washington","Burleson","Lee","Fayette","Colorado","Austin","Waller"],
  UT: ["Salt Lake","Utah","Davis","Weber","Washington Cache","Tooele","Box Elder","Iron","Wasatch","Summit","Uintah","Sevier","Sanpete"],
  VT: ["Chittenden","Rutland","Washington","Franklin","Windsor","Addison","Orange","Caledonia","Bennington","Orleans"],
  VA: ["Fairfax","Prince William","Loudoun","Henrico","Chesterfield","Arlington","Virginia Beach City","Richmond City","Norfolk City","Chesapeake City","Newport News City","Alexandria City","Hampton City","Roanoke City","Suffolk City","Portsmouth City","Charlottesville City","Danville City","Harrisonburg City","Staunton City","Spotsylvania","Stafford","Fauquier","Bedford","Campbell","Roanoke","Albemarle","York","James City","Petersburg City"],
  WA: ["King","Pierce","Snohomish","Spokane","Clark","Thurston","Kitsap","Yakima","Whatcom","Benton","Skagit","Cowlitz","Grant","Chelan","Island"],
  WV: ["Kanawha","Berkeley","Jefferson","Monongalia","Cabell","Wood","Raleigh","Putnam Harrison","Mercer","Marion"],
  WI: ["Milwaukee","Dane","Waukesha","Brown","Racine","Outagamie","Kenosha","Winnebago","Rock","Washington","Marathon","Sheboygan","Eau Claire","St. Croix","La Crosse"],
  WY: ["Laramie","Natrona","Campbell","Sweetwater","Sheridan","Albany","Fremont","Teton","Park","Uinta"],
  DC: ["District of Columbia"],
};

export function getStateName(code) {
  const s = US_STATES.find((s) => s.code === code);
  return s ? s.name : code;
}

export function slugify(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}