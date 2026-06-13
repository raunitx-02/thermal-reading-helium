const irctcData = {
  "12309": {
    "name": "Patna Rajdhani Express",
    "route": "Patna Jn (PNBE) to New Delhi (NDLS)",
    "stops": ["Patna", "Ara", "Buxar", "Duff", "Deen Dayal Upadhyaya", "Prayagraj", "Kanpur Central", "New Delhi"]
  },
  "12310": {
    "name": "New Delhi - Patna Rajdhani Express",
    "route": "New Delhi (NDLS) to Patna Jn (PNBE)",
    "stops": ["New Delhi", "Kanpur Central", "Prayagraj", "Deen Dayal Upadhyaya", "Buxar", "Ara", "Patna"]
  },
  "12221": {
    "name": "Pune - Howrah AC Duronto Express",
    "route": "Pune Jn (PUNE) to Howrah Jn (HWH)",
    "stops": ["Pune", "Daund", "Manmad", "Bhusaval", "Nagpur", "Raipur", "Bilaspur", "Tatanagar", "Howrah"]
  },
  "12222": {
    "name": "Howrah - Pune AC Duronto Express",
    "route": "Howrah Jn (HWH) to Pune Jn (PUNE)",
    "stops": ["Howrah", "Tatanagar", "Bilaspur", "Raipur", "Nagpur", "Bhusaval", "Manmad", "Daund", "Pune"]
  },
  "12951": {
    "name": "Mumbai Rajdhani Express",
    "route": "Mumbai Central (MMCT) to New Delhi (NDLS)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Borivali", "Surat", "Vadodara", "Ratlam", "Kota", "New Delhi"]
  },
  "12952": {
    "name": "New Delhi - Mumbai Rajdhani Express",
    "route": "New Delhi (NDLS) to Mumbai Central (MMCT)",
    "stops": ["New Delhi", "Kota", "Ratlam", "Vadodara", "Surat", "Borivali", "Mumbai Central", "Mumbai Suburban", "Mumbai City"]
  },
  "12301": {
    "name": "Howrah Rajdhani Express",
    "route": "Howrah Jn (HWH) to New Delhi (NDLS)",
    "stops": ["Howrah", "Asansol", "Dhanbad", "Gaya", "Deen Dayal Upadhyaya", "Prayagraj", "Kanpur Central", "New Delhi"]
  },
  "12302": {
    "name": "New Delhi - Howrah Rajdhani Express",
    "route": "New Delhi (NDLS) to Howrah Jn (HWH)",
    "stops": ["New Delhi", "Kanpur Central", "Prayagraj", "Deen Dayal Upadhyaya", "Gaya", "Dhanbad", "Asansol", "Howrah"]
  },
  "12002": {
    "name": "New Delhi - Bhopal Shatabdi Express",
    "route": "New Delhi (NDLS) to Rani Kamalapati (RKMP)",
    "stops": ["New Delhi", "Mathura", "Agra", "Morena", "Gwalior", "Jhansi", "Lalitpur", "Bhopal"]
  },
  "12001": {
    "name": "Bhopal - New Delhi Shatabdi Express",
    "route": "Rani Kamalapati (RKMP) to New Delhi (NDLS)",
    "stops": ["Bhopal", "Lalitpur", "Jhansi", "Gwalior", "Morena", "Agra", "Mathura", "New Delhi"]
  },
  "12263": {
    "name": "Pune - Hazrat Nizamuddin Duronto",
    "route": "Pune Jn (PUNE) to Hazrat Nizamuddin (NZM)",
    "stops": ["Pune", "Lonavala", "Kalyan", "Vasai Road", "Surat", "Vadodara", "Ratlam", "Kota", "Hazrat Nizamuddin"]
  },
  "12264": {
    "name": "Hazrat Nizamuddin - Pune Duronto",
    "route": "Hazrat Nizamuddin (NZM) to Pune Jn (PUNE)",
    "stops": ["Hazrat Nizamuddin", "Kota", "Ratlam", "Vadodara", "Surat", "Vasai Road", "Kalyan", "Lonavala", "Pune"]
  },
  "12626": {
    "name": "Kerala Express",
    "route": "New Delhi (NDLS) to Trivandrum Central (TVC)",
    "stops": ["New Delhi", "Mathura", "Agra", "Gwalior", "Jhansi", "Bhopal", "Nagpur", "Secunderabad", "Vijayawada", "Chennai", "Coimbatore", "Ernakulam", "Kollam", "Trivandrum", "Thiruvananthapuram"]
  },
  "12625": {
    "name": "Trivandrum Central - New Delhi Kerala Express",
    "route": "Trivandrum Central (TVC) to New Delhi (NDLS)",
    "stops": ["Thiruvananthapuram", "Trivandrum", "Kollam", "Ernakulam", "Coimbatore", "Chennai", "Vijayawada", "Secunderabad", "Nagpur", "Bhopal", "Jhansi", "Gwalior", "Agra", "Mathura", "New Delhi"]
  },
  "12424": {
    "name": "New Delhi - Dibrugarh Rajdhani Express",
    "route": "New Delhi (NDLS) to Dibrugarh (DBRG)",
    "stops": ["New Delhi", "Kanpur Central", "Prayagraj", "Deen Dayal Upadhyaya", "Patna", "Barauni", "Katihar", "Guwahati", "Dibrugarh"]
  },
  "12423": {
    "name": "Dibrugarh - New Delhi Rajdhani Express",
    "route": "Dibrugarh (DBRG) to New Delhi (NDLS)",
    "stops": ["Dibrugarh", "Guwahati", "Katihar", "Barauni", "Patna", "Deen Dayal Upadhyaya", "Prayagraj", "Kanpur Central", "New Delhi"]
  },
  "12860": {
    "name": "Gitanjali Express",
    "route": "Howrah Jn (HWH) to Mumbai CSMT (CSMT)",
    "stops": ["Howrah", "Kharagpur", "Tatanagar", "Rourkela", "Bilaspur", "Raipur", "Nagpur", "Bhusaval", "Nashik", "Kalyan", "Mumbai City", "Mumbai Suburban"]
  },
  "12859": {
    "name": "Gitanjali Express (CSMT to HWH)",
    "route": "Mumbai CSMT (CSMT) to Howrah Jn (HWH)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Kalyan", "Nashik", "Bhusaval", "Nagpur", "Raipur", "Bilaspur", "Rourkela", "Tatanagar", "Kharagpur", "Howrah"]
  },
  "12925": {
    "name": "Paschim Express",
    "route": "Mumbai Central (MMCT) to Amritsar (ASR)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Borivali", "Surat", "Vadodara", "Ratlam", "Kota", "New Delhi", "Ambala", "Ludhiana", "Jalandhar", "Amritsar"]
  },
  "12926": {
    "name": "Paschim Express (ASR to MMCT)",
    "route": "Amritsar (ASR) to Mumbai Central (MMCT)",
    "stops": ["Amritsar", "Jalandhar", "Ludhiana", "Ambala", "New Delhi", "Kota", "Ratlam", "Vadodara", "Surat", "Borivali", "Mumbai Central", "Mumbai Suburban", "Mumbai City"]
  },
  "12615": {
    "name": "Grand Trunk Express",
    "route": "Chennai Central (MAS) to New Delhi (NDLS)",
    "stops": ["Chennai", "Nellore", "Vijayawada", "Warangal", "Balharshah", "Nagpur", "Bhopal", "Jhansi", "Gwalior", "Agra", "Mathura", "New Delhi"]
  },
  "12616": {
    "name": "Grand Trunk Express (NDLS to MAS)",
    "route": "New Delhi (NDLS) to Chennai Central (MAS)",
    "stops": ["New Delhi", "Mathura", "Agra", "Gwalior", "Jhansi", "Bhopal", "Nagpur", "Balharshah", "Warangal", "Vijayawada", "Nellore", "Chennai"]
  },
  "12321": {
    "name": "Howrah - Mumbai Mail",
    "route": "Howrah Jn (HWH) to Mumbai CSMT (CSMT)",
    "stops": ["Howrah", "Bardhaman", "Asansol", "Dhanbad", "Gaya", "Deen Dayal Upadhyaya", "Prayagraj", "Jabalpur", "Itarsi", "Bhusaval", "Manmad", "Nashik", "Kalyan", "Mumbai City", "Mumbai Suburban"]
  },
  "12322": {
    "name": "Mumbai - Howrah Mail",
    "route": "Mumbai CSMT (CSMT) to Howrah Jn (HWH)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Kalyan", "Nashik", "Manmad", "Bhusaval", "Itarsi", "Jabalpur", "Prayagraj", "Deen Dayal Upadhyaya", "Gaya", "Dhanbad", "Asansol", "Bardhaman", "Howrah"]
  },
  "12260": {
    "name": "Sealdah Duronto Express",
    "route": "New Delhi (NDLS) to Sealdah (SDAH)",
    "stops": ["New Delhi", "Kanpur Central", "Deen Dayal Upadhyaya", "Dhanbad", "Kolkata"]
  },
  "12259": {
    "name": "Sealdah - New Delhi Duronto Express",
    "route": "Sealdah (SDAH) to New Delhi (NDLS)",
    "stops": ["Kolkata", "Dhanbad", "Deen Dayal Upadhyaya", "Kanpur Central", "New Delhi"]
  },
  "12223": {
    "name": "Lokmanya Tilak - Ernakulam Duronto",
    "route": "Mumbai LTT (LTT) to Ernakulam Jn (ERS)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Ratnagiri", "Madgaon", "Mangalore", "Kozhikode", "Ernakulam"]
  },
  "12224": {
    "name": "Ernakulam - Lokmanya Tilak Duronto",
    "route": "Ernakulam Jn (ERS) to Mumbai LTT (LTT)",
    "stops": ["Ernakulam", "Kozhikode", "Mangalore", "Madgaon", "Ratnagiri", "Mumbai Suburban", "Mumbai City"]
  },
  "12431": {
    "name": "Trivandrum Rajdhani Express",
    "route": "Trivandrum Central (TVC) to Hazrat Nizamuddin (NZM)",
    "stops": ["Thiruvananthapuram", "Kollam", "Alappuzha", "Ernakulam", "Shoranur", "Kozhikode", "Mangalore", "Udupi", "Karwar", "Madgaon", "Ratnagiri", "Panvel", "Vasai Road", "Surat", "Vadodara", "Kota", "Hazrat Nizamuddin"]
  },
  "12432": {
    "name": "Hazrat Nizamuddin - Trivandrum Rajdhani",
    "route": "Hazrat Nizamuddin (NZM) to Trivandrum Central (TVC)",
    "stops": ["Hazrat Nizamuddin", "Kota", "Vadodara", "Surat", "Vasai Road", "Panvel", "Ratnagiri", "Madgaon", "Karwar", "Udupi", "Mangalore", "Kozhikode", "Shoranur", "Ernakulam", "Alappuzha", "Kollam", "Thiruvananthapuram"]
  },
  "12009": {
    "name": "Mumbai Central - Ahmedabad Shatabdi",
    "route": "Mumbai Central (MMCT) to Ahmedabad Jn (ADI)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Borivali", "Vapi", "Surat", "Bharuch", "Vadodara", "Nadiad", "Ahmedabad"]
  },
  "12010": {
    "name": "Ahmedabad - Mumbai Central Shatabdi",
    "route": "Ahmedabad Jn (ADI) to Mumbai Central (MMCT)",
    "stops": ["Ahmedabad", "Nadiad", "Vadodara", "Bharuch", "Surat", "Vapi", "Borivali", "Mumbai Central", "Mumbai Suburban", "Mumbai City"]
  },
  "12810": {
    "name": "Howrah - Mumbai Mail (Via Nagpur)",
    "route": "Howrah Jn (HWH) to Mumbai CSMT (CSMT)",
    "stops": ["Howrah", "Kharagpur", "Tatanagar", "Chakradharpur", "Rourkela", "Jharsuguda", "Bilaspur", "Raipur", "Durg", "Gondia", "Nagpur", "Badnera", "Akola", "Bhusaval", "Manmad", "Nashik", "Kalyan", "Dadra and Nagar Haveli", "Mumbai Suburban", "Mumbai City"]
  },
  "12809": {
    "name": "Mumbai - Howrah Mail (Via Nagpur)",
    "route": "Mumbai CSMT (CSMT) to Howrah Jn (HWH)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Kalyan", "Nashik", "Manmad", "Bhusaval", "Akola", "Badnera", "Nagpur", "Gondia", "Durg", "Raipur", "Bilaspur", "Jharsuguda", "Rourkela", "Chakradharpur", "Tatanagar", "Kharagpur", "Howrah"]
  },
  "12451": {
    "name": "Shram Shakti Express",
    "route": "Kanpur Central (CNB) to New Delhi (NDLS)",
    "stops": ["Kanpur Nagar", "Kanpur Dehat", "Panki", "New Delhi"]
  },
  "12452": {
    "name": "Shram Shakti Express (NDLS to CNB)",
    "route": "New Delhi (NDLS) to Kanpur Central (CNB)",
    "stops": ["New Delhi", "Panki", "Kanpur Dehat", "Kanpur Nagar"]
  },
  "12235": {
    "name": "Madhupur - Anand Vihar Humsafar Express",
    "route": "Madhupur Jn (MDP) to Anand Vihar Terminal (ANVT)",
    "stops": ["Madhupur", "Jasidih", "Jhajha", "Jamui", "Kiul", "Mokama", "Patna", "Ara", "Buxar", "Deen Dayal Upadhyaya", "Allahabad", "Prayagraj", "Kanpur Central", "Delhi", "East Delhi"]
  },
  "12236": {
    "name": "Anand Vihar - Madhupur Humsafar Express",
    "route": "Anand Vihar Terminal (ANVT) to Madhupur Jn (MDP)",
    "stops": ["Delhi", "East Delhi", "Kanpur Central", "Prayagraj", "Deen Dayal Upadhyaya", "Buxar", "Ara", "Patna", "Mokama", "Kiul", "Jamui", "Jhajha", "Jasidih", "Madhupur"]
  },
  "12267": {
    "name": "Mumbai Central - Rajkot Duronto Express",
    "route": "Mumbai Central (MMCT) to Rajkot Jn (RJT)",
    "stops": ["Mumbai City", "Mumbai Suburban", "Surat", "Vadodara", "Ahmedabad", "Rajkot"]
  },
  "12268": {
    "name": "Rajkot - Mumbai Central Duronto Express",
    "route": "Rajkot Jn (RJT) to Mumbai Central (MMCT)",
    "stops": ["Rajkot", "Ahmedabad", "Vadodara", "Surat", "Mumbai Suburban", "Mumbai City"]
  },
  "12019": {
    "name": "Howrah - Ranchi Shatabdi Express",
    "route": "Howrah Jn (HWH) to Ranchi Jn (RNC)",
    "stops": ["Howrah", "Bardhaman", "Durgapur", "Raniganj", "Asansol", "Dhanbad", "Bokaro", "Muri", "Ranchi"]
  },
  "12020": {
    "name": "Ranchi - Howrah Shatabdi Express",
    "route": "Ranchi Jn (RNC) to Howrah Jn (HWH)",
    "stops": ["Ranchi", "Muri", "Bokaro", "Dhanbad", "Asansol", "Raniganj", "Durgapur", "Bardhaman", "Howrah"]
  },
  "12339": {
    "name": "Coalfield Express",
    "route": "Howrah Jn (HWH) to Dhanbad Jn (DHN)",
    "stops": ["Howrah", "Mankar", "Panagarh", "Durgapur", "Waria", "Raniganj", "Asansol", "Barakar", "Kumardubi", "Dhanbad"]
  },
  "12340": {
    "name": "Coalfield Express (DHN to HWH)",
    "route": "Dhanbad Jn (DHN) to Howrah Jn (HWH)",
    "stops": ["Dhanbad", "Kumardubi", "Barakar", "Asansol", "Raniganj", "Waria", "Durgapur", "Panagarh", "Mankar", "Howrah"]
  },
  "12004": {
    "name": "New Delhi - Lucknow Shatabdi Express",
    "route": "New Delhi (NDLS) to Lucknow Charbagh (LKO)",
    "stops": ["New Delhi", "Ghaziabad", "Aligarh", "Tundla", "Etawah", "Kanpur Central", "Lucknow"]
  },
  "12003": {
    "name": "Lucknow - New Delhi Shatabdi Express",
    "route": "Lucknow Charbagh (LKO) to New Delhi (NDLS)",
    "stops": ["Lucknow", "Kanpur Central", "Etawah", "Tundla", "Aligarh", "Ghaziabad", "New Delhi"]
  },
  "12391": {
    "name": "Shramjeevi Express",
    "route": "Rajgir (RGD) to New Delhi (NDLS)",
    "stops": ["Rajgir", "Nalanda", "Bakhtiyarpur", "Patna", "Ara", "Buxar", "Dildarnagar", "Ghazipur", "Varanasi", "Jaunpur", "Sultanpur", "Lucknow", "Bareilly", "Moradabad", "Ghaziabad", "New Delhi"]
  },
  "12392": {
    "name": "Shramjeevi Express (NDLS to RGD)",
    "route": "New Delhi (NDLS) to Rajgir (RGD)",
    "stops": ["New Delhi", "Ghaziabad", "Moradabad", "Bareilly", "Lucknow", "Sultanpur", "Jaunpur", "Varanasi", "Ghazipur", "Dildarnagar", "Buxar", "Ara", "Patna", "Bakhtiyarpur", "Nalanda", "Rajgir"]
  },
  "12213": {
    "name": "Yesvantpur - Delhi Sarai Rohilla Duronto",
    "route": "Yesvantpur Jn (YPR) to Delhi Sarai Rohilla (DEE)",
    "stops": ["Bengaluru Urban", "Dharmavaram", "Guntakal", "Secunderabad", "Balharshah", "Nagpur", "Habibganj", "Bhopal", "Jhansi", "New Delhi", "Delhi"]
  },
  "12214": {
    "name": "Delhi Sarai Rohilla - Yesvantpur Duronto",
    "route": "Delhi Sarai Rohilla (DEE) to Yesvantpur Jn (YPR)",
    "stops": ["Delhi", "New Delhi", "Jhansi", "Bhopal", "Habibganj", "Nagpur", "Balharshah", "Secunderabad", "Guntakal", "Dharmavaram", "Yesvantpur"]
  }
};

module.exports = irctcData;
